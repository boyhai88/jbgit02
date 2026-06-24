import {
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FolderKanban,
  Settings,
  UsersRound,
} from "lucide-react"
import { revalidatePath } from "next/cache"
import Link from "next/link"
import { redirect } from "next/navigation"

import { SiteFooter } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

type ApplicationRow = {
  id: string | number
  project_id: string | number
  status: string | null
  created_at: string | null
  projects: { name: string | null } | { name: string | null }[] | null
}

type PublishedProjectRow = {
  id: string | number
  name: string | null
  status: string | null
  project_applications: { id: string | number }[] | null
}

type NotificationRow = {
  id: string | number
  title: string | null
  content: string | null
  type: string | null
  is_read: boolean | null
  created_at: string | null
}

const sidebarItems = [
  { label: "概览", href: "/dashboard", icon: BriefcaseBusiness, active: true },
  { label: "我的项目", href: "/projects", icon: FolderKanban },
  { label: "参与的团队", href: "/projects", icon: UsersRound },
  { label: "收益记录", href: "/dashboard/earnings", icon: CircleDollarSign },
  { label: "账户设置", href: "/profile", icon: Settings },
]

const stats = [
  {
    label: "参与项目数",
    value: "6",
    helper: "3 个进行中",
    icon: FolderKanban,
  },
  {
    label: "协作完成率",
    value: "92%",
    helper: "高于平台平均",
    icon: CheckCircle2,
  },
  {
    label: "协作者数",
    value: "18",
    helper: "本月新增 4 位",
    icon: UsersRound,
  },
]

const activities = [
  {
    title: "开源 AI 代码审查助手完成 UI 评审",
    description: "你提交的 Dashboard 原型已被 Lin Chen 标记为通过。",
    time: "15 分钟前",
    href: "/projects/1",
  },
  {
    title: "跨链 DeFi 聚合协议邀请你加入",
    description: "项目发起人希望你负责路由监控面板前端开发。",
    time: "2 小时前",
    href: "/projects/2",
  },
  {
    title: "医疗影像标注平台收益分成已结算",
    description: "医疗影像标注平台里程碑 2 已完成，分成 $620 已入账。",
    time: "昨天",
    href: "/projects/3",
  },
  {
    title: "测试项目-001 有新协作者申请",
    description: "新的协作者申请已进入待审核队列。",
    time: "3 天前",
    href: "/projects/1",
  },
]

const applicationStatusStyles: Record<string, string> = {
  待审核: "border-amber-500/30 bg-amber-500/12 text-amber-300",
  已通过: "border-emerald-500/30 bg-emerald-500/12 text-emerald-300",
  已拒绝: "border-red-500/30 bg-red-500/12 text-red-300",
}

const projectStatusStyles: Record<string, string> = {
  招募中: "border-amber-500/30 bg-amber-500/12 text-amber-300",
  进行中: "border-emerald-500/30 bg-emerald-500/12 text-emerald-300",
  已结束: "border-white/10 bg-white/5 text-white/55",
}

const notificationTypeStyles: Record<string, string> = {
  申请加入: "border-blue-500/30 bg-blue-500/12 text-blue-300",
  申请通过: "border-emerald-500/30 bg-emerald-500/12 text-emerald-300",
  申请拒绝: "border-red-500/30 bg-red-500/12 text-red-300",
  里程碑更新: "border-[#6C63FF]/35 bg-[#6C63FF]/16 text-[#8D87FF]",
  新评价: "border-orange-500/30 bg-orange-500/12 text-orange-300",
}

async function markNotificationRead(formData: FormData) {
  "use server"

  const notificationId = String(formData.get("notificationId") ?? "")

  if (!notificationId) {
    return
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return
  }

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id)

  revalidatePath("/dashboard")
}

async function markAllNotificationsRead() {
  "use server"

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return
  }

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  revalidatePath("/dashboard")
}

function formatDate(date: string | null) {
  if (!date) {
    return "刚刚"
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

function getProjectName(projects: ApplicationRow["projects"]) {
  if (Array.isArray(projects)) {
    return projects[0]?.name || "未命名项目"
  }

  return projects?.name || "未命名项目"
}

function NotificationCenter({
  notifications,
}: {
  notifications: NotificationRow[]
}) {
  const unreadCount = notifications.filter((item) => !item.is_read).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative inline-flex size-11 items-center justify-center rounded-xl border border-white/10 bg-[#10101A] text-[#8D87FF] transition-colors hover:border-[#6C63FF]/50 hover:bg-[#6C63FF]/10"
          aria-label="通知中心"
        >
          <Bell className="size-5" aria-hidden="true" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
              {unreadCount}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 border-white/10 bg-[#10101A] p-0 text-white shadow-2xl shadow-black/30"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <DropdownMenuLabel className="p-0 text-base font-bold text-white">
            通知中心
          </DropdownMenuLabel>
          <form action={markAllNotificationsRead}>
            <button
              type="submit"
              className="text-xs font-medium text-[#8D87FF] transition-colors hover:text-white hover:underline"
            >
              全部已读
            </button>
          </form>
        </div>
        <DropdownMenuSeparator className="bg-white/10" />
        <div className="max-h-96 overflow-y-auto p-2">
          {notifications.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-5 text-center text-sm text-white/45">
              暂无通知
            </div>
          ) : (
            notifications.map((notification) => {
              const type = notification.type || "申请加入"

              return (
                <DropdownMenuItem
                  key={notification.id}
                  asChild
                  className="cursor-pointer rounded-lg p-0 focus:bg-white/[0.06]"
                >
                  <form action={markNotificationRead} className="w-full">
                    <input
                      type="hidden"
                      name="notificationId"
                      value={notification.id}
                    />
                    <button
                      type="submit"
                      className="flex w-full flex-col gap-2 rounded-lg px-3 py-3 text-left transition-colors hover:bg-white/[0.06]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-semibold text-white">
                          {notification.title || "系统通知"}
                        </span>
                        {!notification.is_read ? (
                          <span className="mt-1 size-2 rounded-full bg-red-500" />
                        ) : null}
                      </div>
                      <p className="line-clamp-2 text-sm leading-5 text-white/55">
                        {notification.content || "暂无通知内容"}
                      </p>
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                            notificationTypeStyles[type] ??
                              "border-white/10 bg-white/5 text-white/55",
                          )}
                        >
                          {type}
                        </span>
                        <span className="text-[11px] text-white/35">
                          {formatDate(notification.created_at)}
                          {notification.is_read ? " · 已读" : " · 未读"}
                        </span>
                      </div>
                    </button>
                  </form>
                </DropdownMenuItem>
              )
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: applicationsData } = await supabase
    .from("project_applications")
    .select("id, project_id, status, created_at, projects(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const { data: publishedProjectsData } = await supabase
    .from("projects")
    .select("id, name, status, project_applications(id)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const { data: notificationsData } = await supabase
    .from("notifications")
    .select("id, title, content, type, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  const applications = (applicationsData ?? []) as ApplicationRow[]
  const publishedProjects =
    (publishedProjectsData ?? []) as PublishedProjectRow[]
  const notifications = (notificationsData ?? []) as NotificationRow[]
  const userEmail = user.email ?? "user@jbgit.dev"
  const displayName =
    typeof user.user_metadata?.name === "string"
      ? user.user_metadata.name
      : userEmail
  const avatarInitial = displayName.trim().charAt(0).toUpperCase() || "U"

  return (
    <main className="min-h-screen bg-[#05050B] text-white">
      <div className="mx-auto flex w-full max-w-[1080px] flex-col lg:flex-row">
        <aside className="border-b border-white/10 bg-[#10101A] lg:min-h-[calc(100vh-4rem)] lg:w-[220px] lg:border-b-0 lg:border-r">
          <div className="px-6 py-7">
            <div className="flex size-14 items-center justify-center rounded-full bg-[#6C63FF] text-lg font-bold text-white shadow-[0_0_28px_rgba(108,99,255,0.32)]">
              {avatarInitial}
            </div>
            <div className="mt-4">
              <p className="text-lg font-bold text-white">{displayName}</p>
              <p className="mt-1 truncate text-sm text-white/40">
                {userEmail}
              </p>
            </div>
          </div>

          <nav className="flex overflow-x-auto border-t border-white/10 lg:block">
            {sidebarItems.map((item) => {
              const Icon = item.icon

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex min-w-max items-center gap-3 px-6 py-4 text-sm font-medium transition-colors hover:underline lg:min-w-0",
                    item.active
                      ? "border-b-4 border-[#6C63FF] bg-[#6C63FF]/18 text-[#8D87FF] lg:border-b-0 lg:border-l-4"
                      : "text-white/45 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        <section className="min-w-0 flex-1 px-6 py-8 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-normal text-white">
                仪表盘
              </h1>
              <p className="mt-3 text-sm text-white/45">
                查看你的项目协作、团队动态和收益进展。
              </p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationCenter notifications={notifications} />
              <div className="rounded-xl border border-white/10 bg-[#10101A] px-4 py-3 text-sm text-white/58">
                当前用户：
                <span className="ml-2 font-medium text-white">{displayName}</span>
              </div>
            </div>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {stats.map((stat) => {
              const Icon = stat.icon

              return (
                <Card
                  key={stat.label}
                  className="rounded-xl border-white/10 bg-[#10101A] py-0 text-white shadow-none"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-white/45">{stat.label}</p>
                        <p className="mt-3 font-mono text-4xl text-white">
                          {stat.value}
                        </p>
                      </div>
                      <div className="flex size-10 items-center justify-center rounded-lg bg-[#6C63FF]/16 text-[#8D87FF]">
                        <Icon className="size-5" aria-hidden="true" />
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-emerald-400">
                      {stat.helper}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card className="mt-6 rounded-xl border-white/10 bg-[#10101A] py-0 text-white shadow-none">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-xl font-bold text-white">
                我发布的项目
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-4">
              {publishedProjects.length === 0 ? (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
                  暂无发布的项目
                </div>
              ) : (
                <div className="space-y-3">
                  {publishedProjects.map((project) => {
                    const status = project.status || "招募中"
                    const applicationCount =
                      project.project_applications?.length ?? 0

                    return (
                      <div
                        key={project.id}
                        className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <Link
                            href={`/projects/${project.id}`}
                            className="font-semibold text-white transition-colors hover:text-[#8D87FF] hover:underline"
                          >
                            {project.name || "测试项目-001"}
                          </Link>
                          <p className="mt-1 text-xs text-white/35">
                            申请人数：{applicationCount}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "w-fit rounded-full border px-3 py-1 text-xs font-medium",
                            projectStatusStyles[status] ??
                              "border-white/10 bg-white/5 text-white/55",
                          )}
                        >
                          {status}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6 rounded-xl border-white/10 bg-[#10101A] py-0 text-white shadow-none">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-xl font-bold text-white">
                我的申请
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-4">
              {applications.length === 0 ? (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
                  暂无申请记录
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((application) => {
                    const status = application.status || "待审核"

                    return (
                      <div
                        key={application.id}
                        className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <Link
                            href={`/projects/${application.project_id}`}
                            className="font-semibold text-white transition-colors hover:text-[#8D87FF] hover:underline"
                          >
                            {getProjectName(application.projects)}
                          </Link>
                          <p className="mt-1 text-xs text-white/35">
                            申请时间：{formatDate(application.created_at)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "w-fit rounded-full border px-3 py-1 text-xs font-medium",
                            applicationStatusStyles[status] ??
                              "border-white/10 bg-white/5 text-white/55",
                          )}
                        >
                          {status}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6 rounded-xl border-white/10 bg-[#10101A] py-0 text-white shadow-none">
            <CardHeader className="p-6 pb-2">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-xl font-bold text-white">
                  最近活动时间线
                </CardTitle>
                <Bell className="size-5 text-[#8D87FF]" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-4">
              <div className="space-y-5">
                {activities.map((activity, index) => (
                  <div key={activity.title} className="relative flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex size-9 items-center justify-center rounded-full border border-[#6C63FF]/35 bg-[#6C63FF]/18 text-[#8D87FF]">
                        <Clock3 className="size-4" aria-hidden="true" />
                      </div>
                      {index < activities.length - 1 ? (
                        <div className="mt-2 h-full min-h-10 w-px bg-white/10" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Link
                          href={activity.href}
                          className="font-semibold text-white transition-colors hover:text-[#8D87FF] hover:underline"
                        >
                          {activity.title}
                        </Link>
                        <span className="text-xs text-white/35">
                          {activity.time}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-white/50">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
      <SiteFooter />
    </main>
  )
}
