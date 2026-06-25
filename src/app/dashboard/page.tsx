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
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

const STATUS_PENDING = "待审核"
const STATUS_APPROVED = "已通过"
const STATUS_REJECTED = "已拒绝"
const STATUS_RECRUITING = "招募中"

type NestedProject = {
  id: string | number
  name: string | null
}

type NestedPhase = {
  id: string | number
  project_id: string | number | null
  name: string | null
  projects?: NestedProject | NestedProject[] | null
}

type PhaseApplicationRow = {
  id: string | number
  phase_id: string | number | null
  status: string | null
  created_at: string | null
  project_phases?: NestedPhase | NestedPhase[] | null
}

type ProjectNameRow = {
  id: string | number
  name: string | null
  status?: string | null
  project_applications?: { id: string | number }[] | null
}

type NotificationRow = {
  id: string | number
  title: string | null
  content: string | null
  created_at: string | null
  is_read: boolean | null
}

type MyPhaseApplication = {
  id: string | number
  project_id: string | number | null
  project_name: string
  phase_name: string
  status: string
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
    helper: "高于平台平均水平",
    icon: CheckCircle2,
  },
  {
    label: "协作者数",
    value: "18",
    helper: "本月新增 4 人",
    icon: UsersRound,
  },
]

const activities = [
  {
    title: "AI 代码审查助手已更新",
    description: "项目发起人已查看最新协作进度。",
    time: "15 分钟前",
    href: "/projects/1",
  },
  {
    title: "工序申请状态有更新",
    description: "一个项目工序申请已进入审核队列。",
    time: "2 小时前",
    href: "/projects",
  },
  {
    title: "收益分配方案已刷新",
    description: "项目的工序分成方案已更新。",
    time: "昨天",
    href: "/projects",
  },
]

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

function statusClass(status: string) {
  if (status === STATUS_APPROVED) {
    return "border-emerald-500/30 bg-emerald-500/12 text-emerald-300"
  }

  if (status === STATUS_REJECTED) {
    return "border-red-500/30 bg-red-500/12 text-red-300"
  }

  return "border-amber-500/30 bg-amber-500/12 text-amber-300"
}

function getFirst<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: notificationData } = await supabase
    .from("notifications")
    .select("id, title, content, created_at, is_read")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(8)

  const { data: phaseApplicationsData } = await supabase
    .from("phase_applications")
    .select(
      "id, phase_id, status, created_at, project_phases(id, project_id, name, projects(id, name))",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const { data: publishedProjectsData } = await supabase
    .from("projects")
    .select("id, name, status, project_applications(id)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const notifications = (notificationData ?? []) as NotificationRow[]
  const unreadCount = notifications.filter((item) => !item.is_read).length
  const phaseApplicationRows =
    (phaseApplicationsData ?? []) as PhaseApplicationRow[]
  const myPhaseApplications: MyPhaseApplication[] = phaseApplicationRows.map(
    (application) => {
      const phase = getFirst(application.project_phases)
      const project = getFirst(phase?.projects)

      return {
        id: application.id,
        project_id: phase?.project_id ?? null,
        project_name: project?.name || "未命名项目",
        phase_name: phase?.name || "未命名工序",
        status: application.status || STATUS_PENDING,
        created_at: application.created_at,
      }
    },
  )
  const publishedProjects =
    (publishedProjectsData ?? []) as ProjectNameRow[]
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
                  prefetch={true}
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
                查看项目协作、工序申请与最近活动。
              </p>
            </div>
            <div className="flex items-center gap-3">
              <details className="group relative">
                <summary className="flex size-11 cursor-pointer list-none items-center justify-center rounded-xl border border-white/10 bg-[#10101A] text-[#8D87FF] transition hover:border-[#6C63FF]/50 [&::-webkit-details-marker]:hidden">
                  <Bell className="size-5" aria-hidden="true" />
                  {unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  ) : null}
                </summary>
                <div className="absolute right-0 z-20 mt-3 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#11111D] shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        通知中心
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        {unreadCount > 0
                          ? `${unreadCount} 条未读`
                          : "全部已读"}
                      </p>
                    </div>
                    <form action={markAllNotificationsRead}>
                      <button
                        type="submit"
                        className="rounded-lg border border-[#6C63FF]/50 px-3 py-1.5 text-xs font-medium text-[#B8B4FF] transition hover:bg-[#6C63FF] hover:text-white"
                      >
                        全部已读
                      </button>
                    </form>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2">
                    {notifications.length === 0 ? (
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/45">
                        暂无通知
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map((notification) => (
                          <form
                            key={notification.id}
                            action={markNotificationRead}
                          >
                            <input
                              type="hidden"
                              name="notificationId"
                              value={String(notification.id)}
                            />
                            <button
                              type="submit"
                              className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-[#6C63FF]/45 hover:bg-[#6C63FF]/10"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-semibold text-white">
                                  {notification.title || "新通知"}
                                </p>
                                <span
                                  className={cn(
                                    "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                                    notification.is_read
                                      ? "border-white/10 text-white/35"
                                      : "border-red-500/30 bg-red-500/12 text-red-200",
                                  )}
                                >
                                  {notification.is_read
                                    ? "已读"
                                    : "未读"}
                                </span>
                              </div>
                              <p className="mt-2 text-xs leading-5 text-white/55">
                                {notification.content || "暂无内容"}
                              </p>
                              <p className="mt-2 text-[11px] text-white/30">
                                {formatDate(notification.created_at)}
                              </p>
                            </button>
                          </form>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </details>

              <div className="rounded-xl border border-white/10 bg-[#10101A] px-4 py-3 text-sm text-white/58">
                当前用户：
                <span className="ml-2 font-medium text-white">
                  {displayName}
                </span>
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
                  {publishedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/projects/${project.id}`}
                          prefetch={true}
                          className="font-semibold text-white transition-colors hover:text-[#8D87FF] hover:underline"
                        >
                          {project.name || "未命名项目"}
                        </Link>
                        <p className="mt-1 text-xs text-white/35">
                          申请数：{project.project_applications?.length ?? 0}
                        </p>
                      </div>
                      <span className="w-fit rounded-full border border-amber-500/30 bg-amber-500/12 px-3 py-1 text-xs font-medium text-amber-300">
                        {project.status || STATUS_RECRUITING}
                      </span>
                    </div>
                  ))}
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
              {myPhaseApplications.length === 0 ? (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
                  暂无申请记录
                </div>
              ) : (
                <div className="space-y-3">
                  {myPhaseApplications.map((application) => (
                    <div
                      key={application.id}
                      className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <Link
                          href={
                            application.project_id
                              ? `/projects/${application.project_id}`
                              : "/projects"
                          }
                          prefetch={true}
                          className="font-semibold text-white transition-colors hover:text-[#8D87FF] hover:underline"
                        >
                          {application.project_name}
                        </Link>
                        <p className="mt-1 text-xs text-white/35">
                          工序：{application.phase_name}
                        </p>
                        <p className="mt-1 text-xs text-white/35">
                          申请时间：{formatDate(application.created_at)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "w-fit rounded-full border px-3 py-1 text-xs font-medium",
                          statusClass(application.status),
                        )}
                      >
                        {application.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6 rounded-xl border-white/10 bg-[#10101A] py-0 text-white shadow-none">
            <CardHeader className="p-6 pb-2">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-xl font-bold text-white">
                  最近活动
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
                          prefetch={true}
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
