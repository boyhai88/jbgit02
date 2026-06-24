import Link from "next/link"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/server"

type EnterpriseRow = {
  id: string
  name: string | null
  slug: string | null
  status: string | null
  description: string | null
  owner_id: string | null
}

type MemberRow = {
  id: string | number
  email: string | null
  role: string | null
  status: string | null
  created_at: string | null
}

type ProjectRow = {
  id: string | number
  status: string | null
  budget: string | number | null
}

type EditField = "name" | "description" | "slug"

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function formatDate(date: string | null) {
  if (!date) {
    return "刚刚"
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date))
}

function getMemberName(email: string | null) {
  if (!email) {
    return "未命名成员"
  }

  return email.split("@")[0]
}

function formatRevenue(projects: ProjectRow[]) {
  const total = projects
    .filter((project) => project.status === "已完成")
    .reduce((sum, project) => {
      const value =
        typeof project.budget === "number"
          ? project.budget
          : Number(project.budget ?? 0)

      return sum + (Number.isFinite(value) ? value : 0)
    }, 0)

  return `$${total.toLocaleString()}`
}

async function updateEnterpriseSetting(formData: FormData) {
  "use server"

  console.log("企业设置 formData:", Object.fromEntries(formData.entries()))

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const enterpriseId = String(formData.get("enterpriseId") ?? "")
  const field = String(formData.get("field") ?? "") as EditField
  const rawValue = String(formData.get("value") ?? "")
  const value = field === "slug" ? createSlug(rawValue) : rawValue.trim()

  console.log("企业设置 enterpriseId:", enterpriseId)
  console.log("企业设置 field:", field)
  console.log("企业设置 value:", value)

  if (!enterpriseId || !["name", "description", "slug"].includes(field)) {
    console.error("企业设置参数无效:", { enterpriseId, field })
    redirect("/enterprise/dashboard")
  }

  if (!value) {
    console.error("企业设置 value 为空:", { enterpriseId, field })
    redirect(`/enterprise/dashboard?edit=${field}`)
  }

  const { error } = await supabase
    .from("enterprises")
    .update({
      [field]: value,
      updated_at: new Date().toISOString(),
    })
    .eq("id", enterpriseId)
    .eq("owner_id", user.id)

  if (error) {
    console.error("保存企业设置失败:", error)
    console.error("保存企业设置错误详情:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
  } else {
    console.log("保存企业设置成功:", { enterpriseId, field, value })
  }

  revalidatePath("/enterprise/dashboard")
  redirect("/enterprise/dashboard")
}

async function inviteEnterpriseMember(formData: FormData) {
  "use server"

  console.log("添加成员 formData:", Object.fromEntries(formData.entries()))

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const enterpriseId = String(formData.get("enterpriseId") ?? "").trim()
  const emailInput = String(formData.get("email") ?? "").trim().toLowerCase()
  const email = emailInput.includes("@") ? emailInput : ""

  if (!email || !email.includes("@")) {
    console.error("测试成员邮箱无效:", { emailInput, email })
    redirect("/enterprise/dashboard?invite=1&inviteError=invalid_email")
  }

  if (email === user.email?.toLowerCase()) {
    console.log("不能添加自己:", { email, userEmail: user.email })
    redirect("/enterprise/dashboard?inviteResult=self")
  }

  const { data: targetUser, error: userLookupError } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", email)
    .maybeSingle()

  console.log("查询待添加用户结果:", { targetUser, userLookupError })

  if (userLookupError) {
    console.error("查询待添加用户失败:", {
      message: userLookupError.message,
      code: userLookupError.code,
      details: userLookupError.details,
      hint: userLookupError.hint,
    })
    redirect("/enterprise/dashboard?invite=1&inviteError=user_lookup_failed")
  }

  if (!targetUser?.id) {
    console.log("该用户未注册:", email)
    redirect("/enterprise/dashboard?invite=1&inviteError=not_registered")
  }

  const inviteMember = {
    enterprise_id: enterpriseId || user.id,
    user_id: targetUser.id,
    email,
    role: "member",
    status: "已加入",
  }

  console.log("准备写入 enterprise_members 成员记录:", inviteMember)

  const { data: insertedMember, error } = await supabase
    .from("enterprise_members")
    .insert(inviteMember)
    .select("*")

  console.log("enterprise_members 成员记录写入结果:", { insertedMember, error })

  if (error) {
    console.error("enterprise_members 成员记录写入失败:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    redirect("/enterprise/dashboard?invite=1&inviteError=insert_failed")
  }

  console.log("成员添加成功:", insertedMember)
  revalidatePath("/enterprise/dashboard")
  redirect("/enterprise/dashboard?inviteResult=success")
}

async function removeEnterpriseMember(formData: FormData) {
  "use server"

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const enterpriseId = String(formData.get("enterpriseId") ?? "")
  const memberId = String(formData.get("memberId") ?? "")

  if (!enterpriseId || !memberId) {
    redirect("/enterprise/dashboard")
  }

  const { data: enterprise } = await supabase
    .from("enterprises")
    .select("id")
    .eq("id", enterpriseId)
    .eq("owner_id", user.id)
    .maybeSingle()

  if (!enterprise) {
    redirect("/enterprise/dashboard")
  }

  const { error } = await supabase
    .from("enterprise_members")
    .delete()
    .eq("id", memberId)
    .eq("enterprise_id", enterpriseId)

  if (error) {
    console.error("移除成员失败:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
  }

  revalidatePath("/enterprise/dashboard")
  redirect("/enterprise/dashboard")
}

function getEditTitle(field: EditField) {
  if (field === "name") {
    return "修改名称"
  }

  if (field === "description") {
    return "修改简介"
  }

  return "修改标识"
}

function getEditValue(enterprise: EnterpriseRow, field: EditField) {
  if (field === "name") {
    return enterprise.name || ""
  }

  if (field === "description") {
    return enterprise.description || ""
  }

  return enterprise.slug || ""
}

export default async function EnterpriseDashboardPage({
  searchParams,
}: {
  searchParams?: {
    edit?: string
    invite?: string
    inviteError?: string
    inviteResult?: string
  }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: enterpriseRows, error: enterpriseError } = await supabase
    .from("enterprises")
    .select("id, name, slug, status, description, owner_id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)

  if (enterpriseError) {
    console.error("读取企业数据失败:", enterpriseError)
  }

  const enterpriseData = enterpriseRows?.[0]

  if (!enterpriseData) {
    return (
      <main className="min-h-screen bg-[#05050B] px-6 py-10 text-white">
        <section className="mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-3xl items-center justify-center">
          <Card className="w-full rounded-2xl border-white/10 bg-[#10101A] py-0 text-center text-white shadow-none">
            <CardContent className="p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6C63FF]">
                ENTERPRISE DASHBOARD
              </p>
              <h1 className="mt-4 text-3xl font-black text-white">
                请先创建企业
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-300">
                当前账号还没有拥有的企业。创建企业后即可查看成员、项目和收益数据。
              </p>
              <Link
                href="/enterprise/create"
                className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-[#6C63FF] px-5 text-sm font-medium text-white transition-colors hover:bg-[#5B54E8]"
              >
                创建企业
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>
    )
  }

  const enterprise = enterpriseData as EnterpriseRow
  const editParam = searchParams?.edit
  const editField =
    editParam === "name" ||
    editParam === "description" ||
    editParam === "slug"
      ? editParam
      : null
  const inviteOpen = searchParams?.invite === "1"
  const inviteErrorMessages: Record<string, string> = {
    invalid_email: "请输入有效邮箱",
    reset_failed: "邀请邮件发送失败，请稍后重试",
    user_lookup_failed: "查询用户失败，请稍后重试",
    not_registered: "该用户未注册",
    insert_failed: "添加成员失败，请稍后重试",
  }
  const inviteErrorMessage = searchParams?.inviteError
    ? inviteErrorMessages[searchParams.inviteError]
    : null
  const inviteAlert =
    searchParams?.inviteResult === "success"
      ? {
          title: "成员已添加",
          description: "成员记录已写入 enterprise_members 表。",
          className: "border-emerald-500/35 bg-emerald-500/10 text-emerald-100",
        }
      : searchParams?.inviteResult === "self"
        ? {
            title: "不能添加自己",
            description: "测试时建议用另一个邮箱，例如 283013941@qq.com。",
            className: "border-amber-500/35 bg-amber-500/10 text-amber-100",
          }
      : searchParams?.inviteError
        ? {
            title: "添加成员失败",
            description: inviteErrorMessage || "写入失败，请查看终端日志。",
            className: "border-red-500/35 bg-red-500/10 text-red-100",
          }
        : null

  const currentEnterpriseId = enterprise.id

  console.log("当前企业成员查询 enterprise_id:", currentEnterpriseId)

  const [{ data: membersData }, { data: projectsData }] = await Promise.all([
    supabase
      .from("enterprise_members")
      .select("id, email, role, status, created_at")
      .eq("enterprise_id", currentEnterpriseId)
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select("id, status, budget")
      .eq("enterprise_id", currentEnterpriseId),
  ])

  const members = (membersData ?? []) as MemberRow[]
  const projects = (projectsData ?? []) as ProjectRow[]
  const isEnterpriseOwner = enterprise.owner_id === user.id
  const activeProjects = projects.filter(
    (project) => project.status === "进行中",
  ).length
  const completedProjects = projects.filter(
    (project) => project.status === "已完成",
  ).length
  const stats = [
    { label: "成员数", value: String(members.length) },
    { label: "进行中项目", value: String(activeProjects) },
    { label: "已完成项目", value: String(completedProjects) },
    { label: "总收益", value: formatRevenue(projects) },
  ]

  return (
    <main className="min-h-screen bg-[#05050B] px-6 py-10 text-white">
      <section className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6C63FF]">
              ENTERPRISE DASHBOARD
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-normal text-white">
              {enterprise.name || "未命名企业"}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-gray-300">
                /enterprise/{enterprise.slug || "未设置"}
              </span>
              <span
                className={
                  enterprise.status === "已过期"
                    ? "rounded-full border border-red-500/35 bg-red-500/12 px-3 py-1 text-red-300"
                    : "rounded-full border border-emerald-500/35 bg-emerald-500/12 px-3 py-1 text-emerald-300"
                }
              >
                订阅状态：{enterprise.status || "活跃"}
              </span>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-300">
              {enterprise.description || "暂无企业简介"}
            </p>
          </div>

          <Link
            href="/enterprise/dashboard?edit=name"
            className="inline-flex h-10 items-center justify-center rounded-md bg-[#6C63FF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5B54E8]"
          >
            企业设置
          </Link>
        </div>

        {inviteAlert ? (
          <Alert className={`mt-6 ${inviteAlert.className}`}>
            <AlertTitle className="text-white">{inviteAlert.title}</AlertTitle>
            <AlertDescription className="text-sm text-white/90">
              {inviteAlert.description}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className="rounded-2xl border-white/10 bg-[#10101A] py-0 text-white shadow-none"
            >
              <CardContent className="p-6">
                <p className="text-sm text-gray-300">{stat.label}</p>
                <p className="mt-4 font-mono text-4xl font-bold text-white">
                  {stat.value}
                </p>
                <div className="mt-5 h-1.5 rounded-full bg-[#6C63FF]/20">
                  <div className="h-full w-2/3 rounded-full bg-[#6C63FF]" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <Card className="rounded-2xl border-white/10 bg-[#10101A] py-0 text-white shadow-none">
            <CardHeader className="flex flex-row items-center justify-between gap-4 p-6 pb-2">
              <CardTitle className="text-xl font-bold text-white">
                成员列表
              </CardTitle>
              <Link
                href="/enterprise/dashboard?invite=1"
                className="inline-flex h-10 items-center justify-center rounded-md bg-[#6C63FF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5B54E8]"
              >
                添加成员
              </Link>
            </CardHeader>
            <CardContent className="space-y-3 p-6 pt-4">
              {members.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm text-gray-300">
                  暂无成员
                </div>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#6C63FF] text-sm font-bold text-white">
                        {getMemberName(member.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-white">
                            {getMemberName(member.email)}
                          </p>
                          <span className="rounded-full border border-[#6C63FF]/30 bg-[#6C63FF]/15 px-2 py-0.5 text-xs text-[#8D87FF]">
                            {member.role || "member"}
                          </span>
                          <span
                            className={
                              member.status === "待接受"
                                ? "rounded-full border border-amber-500/35 bg-amber-500/12 px-2 py-0.5 text-xs text-amber-300"
                                : "rounded-full border border-emerald-500/35 bg-emerald-500/12 px-2 py-0.5 text-xs text-emerald-300"
                            }
                          >
                            {member.status || "已加入"}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-gray-300">
                          {member.email} · {formatDate(member.created_at)}
                        </p>
                      </div>
                    </div>
                    {isEnterpriseOwner && member.role !== "owner" ? (
                      <form action={removeEnterpriseMember}>
                        <input
                          type="hidden"
                          name="enterpriseId"
                          value={enterprise.id}
                        />
                        <input
                          type="hidden"
                          name="memberId"
                          value={member.id}
                        />
                        <button
                          type="submit"
                          className="inline-flex h-9 items-center justify-center rounded-md border border-red-500/35 bg-transparent px-3 text-sm font-medium text-red-200 transition-colors hover:bg-red-500/10 hover:text-red-100"
                        >
                          移除
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-gray-300">企业主</span>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/10 bg-[#10101A] py-0 text-white shadow-none">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-xl font-bold text-white">
                企业设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6 pt-4">
              <p className="text-sm leading-6 text-gray-300">
                修改企业名称、简介、标识，保存后刷新页面显示新数据。
              </p>
              <div className="grid gap-3">
                {[
                  { label: "修改名称", field: "name" },
                  { label: "修改简介", field: "description" },
                  { label: "修改标识", field: "slug" },
                ].map((item) => (
                  <Link
                    key={item.field}
                    href={`/enterprise/dashboard?edit=${item.field}`}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white transition-colors hover:border-[#6C63FF] hover:text-[#8D87FF]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {editField ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="enterprise-edit-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#10101A] p-6 text-white shadow-2xl shadow-black/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="enterprise-edit-title"
                  className="text-xl font-bold text-white"
                >
                  {getEditTitle(editField)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-300">
                  保存后会使用服务端 Supabase 客户端写入数据库。
                </p>
              </div>
              <Link
                href="/enterprise/dashboard"
                className="rounded-lg px-2 py-1 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="关闭企业设置对话框"
              >
                关闭
              </Link>
            </div>

            <form className="mt-5 space-y-4" action={updateEnterpriseSetting}>
              <input type="hidden" name="enterpriseId" value={enterprise.id} />
              <input type="hidden" name="field" value={editField} />
              <div className="space-y-2">
                <Label htmlFor="enterprise-edit-value" className="text-white">
                  {getEditTitle(editField)}
                </Label>
                {editField === "description" ? (
                  <Textarea
                    id="enterprise-edit-value"
                    name="value"
                    defaultValue={getEditValue(enterprise, editField)}
                    className="min-h-28 border-white/10 bg-black/20 text-white placeholder:text-white/30"
                  />
                ) : (
                  <Input
                    id="enterprise-edit-value"
                    name="value"
                    defaultValue={getEditValue(enterprise, editField)}
                    className="border-white/10 bg-black/20 text-white placeholder:text-white/30"
                  />
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Link
                  href="/enterprise/dashboard"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  取消
                </Link>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-[#6C63FF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5B54E8]"
                >
                  保存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {inviteOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-member-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#10101A] p-6 text-white shadow-2xl shadow-black/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="invite-member-title"
                  className="text-xl font-bold text-white"
                >
                  添加成员
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-300">
                  输入已注册用户邮箱，系统会直接添加企业成员。
                </p>
              </div>
              <Link
                href="/enterprise/dashboard"
                className="rounded-lg px-2 py-1 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="关闭添加成员对话框"
              >
                关闭
              </Link>
            </div>

            <form className="mt-5 space-y-4" action={inviteEnterpriseMember}>
              <input type="hidden" name="enterpriseId" value={enterprise.id} />
              <div className="space-y-2">
                <Label htmlFor="invite-email" className="text-white">
                  成员邮箱
                </Label>
                <Input
                  id="invite-email"
                  name="email"
                  type="email"
                  required
                  placeholder="developer@example.com"
                  className="border-white/10 bg-black/20 text-white placeholder:text-white/30"
                />
              </div>

              {inviteErrorMessage ? (
                <Alert className="border-red-500/35 bg-red-500/10 text-red-100">
                  <AlertTitle className="text-white">添加成员失败</AlertTitle>
                  <AlertDescription className="text-sm text-red-100">
                    {inviteErrorMessage}
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="flex justify-end gap-3">
                <Link
                  href="/enterprise/dashboard"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  取消
                </Link>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-[#6C63FF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5B54E8]"
                >
                  添加成员
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  )
}
