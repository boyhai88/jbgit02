import {
  Activity,
  CircleDollarSign,
  FolderKanban,
  Tags,
  UserPlus,
  UsersRound,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

type ProjectRow = {
  id: string | number
  name: string | null
  budget: string | number | null
  skills: string[] | string | null
  created_at: string | null
}

type UserRow = {
  id: string | number
  email: string | null
  created_at: string | null
}

const fallbackUsers: UserRow[] = [
  { id: "u1", email: "alex@jbgit.dev", created_at: "2026-06-26T09:30:00Z" },
  { id: "u2", email: "maya@jbgit.dev", created_at: "2026-06-25T15:20:00Z" },
  { id: "u3", email: "chen@jbgit.dev", created_at: "2026-06-24T11:10:00Z" },
]

const fallbackProjects: ProjectRow[] = [
  {
    id: "p1",
    name: "开源 AI 代码审查助手",
    budget: 8500,
    skills: ["React", "TypeScript", "AI/ML"],
    created_at: "2026-06-26T08:00:00Z",
  },
  {
    id: "p2",
    name: "跨链 DeFi 聚合协议",
    budget: 12000,
    skills: ["Rust", "Solidity", "区块链"],
    created_at: "2026-06-25T08:00:00Z",
  },
  {
    id: "p3",
    name: "医疗影像标注平台",
    budget: 6200,
    skills: ["Python", "FastAPI", "AI/ML"],
    created_at: "2026-06-24T08:00:00Z",
  },
]

function getBudgetValue(project: ProjectRow) {
  const value =
    typeof project.budget === "number"
      ? project.budget
      : Number(String(project.budget ?? "0").replace(/[^\d.]/g, ""))

  return Number.isFinite(value) ? value : 0
}

function getSkills(skills: ProjectRow["skills"]) {
  if (Array.isArray(skills)) {
    return skills.map(String).filter(Boolean)
  }

  if (typeof skills === "string") {
    try {
      const parsed = JSON.parse(skills)
      return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [skills]
    } catch {
      return skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
    }
  }

  return []
}

function formatDate(date: string | null) {
  if (!date) {
    return "暂无时间"
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

function buildTrend(projects: ProjectRow[]) {
  const today = new Date()

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today)
    day.setDate(today.getDate() - (6 - index))
    const key = day.toISOString().slice(0, 10)
    const count = projects.filter((project) =>
      project.created_at?.startsWith(key),
    ).length

    return {
      label: `${day.getMonth() + 1}/${day.getDate()}`,
      count,
    }
  })
}

function buildSkillRanking(projects: ProjectRow[]) {
  const counts = new Map<string, number>()

  projects.forEach((project) => {
    getSkills(project.skills).forEach((skill) => {
      counts.set(skill, (counts.get(skill) ?? 0) + 1)
    })
  })

  return Array.from(counts.entries())
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { count: projectCount, data: projectData } = await supabase
    .from("projects")
    .select("id, name, budget, skills, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })

  const { count: userCount, data: userData } = await supabase
    .from("users")
    .select("id, email, created_at", { count: "exact" })
    .order("created_at", { ascending: false })

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { count: activeUserCount } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .gte("updated_at", sevenDaysAgo.toISOString())

  const projects =
    projectData && projectData.length > 0
      ? (projectData as ProjectRow[])
      : fallbackProjects
  const users =
    userData && userData.length > 0 ? (userData as UserRow[]) : fallbackUsers
  const totalBudget = projects.reduce(
    (sum, project) => sum + getBudgetValue(project),
    0,
  )
  const trend = buildTrend(projects)
  const maxTrendValue = Math.max(...trend.map((item) => item.count), 1)
  const skillRanking = buildSkillRanking(projects)
  const latestUsers = users.slice(0, 5)
  const latestProjects = projects.slice(0, 5)

  const metrics = [
    {
      label: "总用户数",
      value: userCount ?? users.length,
      helper: "平台累计注册用户",
      icon: UsersRound,
    },
    {
      label: "总项目数",
      value: projectCount ?? projects.length,
      helper: "已发布协作项目",
      icon: FolderKanban,
    },
    {
      label: "总交易额",
      value: `$${totalBudget.toLocaleString()}`,
      helper: "按项目预算估算",
      icon: CircleDollarSign,
    },
    {
      label: "活跃用户数",
      value: activeUserCount ?? 0,
      helper: "近7天有操作",
      icon: Activity,
    },
  ]

  return (
    <main className="min-h-screen bg-[#05050B] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#10101A] p-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8D87FF]">
              Admin Analytics
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-normal">
              管理员数据看板
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-400">
              汇总平台用户、项目、交易额、活跃度与技能趋势，帮助管理员快速判断增长质量与供需结构。
            </p>
          </div>
          <div className="rounded-2xl border border-[#6C63FF]/30 bg-[#6C63FF]/10 px-4 py-3 text-sm text-[#B8B4FF]">
            更新时间：{formatDate(new Date().toISOString())}
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon

            return (
              <Card
                key={metric.label}
                className="border-white/10 bg-[#10101A] text-white"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-400">{metric.label}</p>
                      <p className="mt-3 font-mono text-3xl font-bold">
                        {metric.value}
                      </p>
                    </div>
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-[#6C63FF]/18 text-[#8D87FF]">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-500">{metric.helper}</p>
                </CardContent>
              </Card>
            )
          })}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <Card className="border-white/10 bg-[#10101A] text-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold">近7日趋势图</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-72 items-end gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                {trend.map((item) => (
                  <div key={item.label} className="flex flex-1 flex-col items-center">
                    <div className="mb-3 text-xs text-gray-400">{item.count}</div>
                    <div
                      className="w-full rounded-t-xl bg-[#6C63FF] shadow-[0_0_24px_rgba(108,99,255,0.24)]"
                      style={{
                        height: `${Math.max((item.count / maxTrendValue) * 190, 12)}px`,
                      }}
                    />
                    <div className="mt-3 text-xs text-gray-500">{item.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#10101A] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <Tags className="size-5 text-[#8D87FF]" aria-hidden="true" />
                热门技能标签排名
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {skillRanking.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-gray-400">
                  暂无技能数据
                </p>
              ) : (
                skillRanking.map((item, index) => (
                  <div
                    key={item.skill}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-[#6C63FF]/18 text-xs font-bold text-[#B8B4FF]">
                        {index + 1}
                      </span>
                      <span className="font-medium">{item.skill}</span>
                    </div>
                    <span className="text-sm text-gray-400">{item.count} 项</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="border-white/10 bg-[#10101A] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <UserPlus className="size-5 text-[#8D87FF]" aria-hidden="true" />
                最新注册用户
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {latestUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{user.email || "未知用户"}</p>
                    <p className="mt-1 text-xs text-gray-500">ID：{user.id}</p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">
                    {formatDate(user.created_at)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#10101A] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <FolderKanban className="size-5 text-[#8D87FF]" aria-hidden="true" />
                最新发布项目
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {latestProjects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium">{project.name || "未命名项目"}</p>
                    <span className="shrink-0 font-mono text-sm text-[#8D87FF]">
                      ${getBudgetValue(project).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {getSkills(project.skills)
                      .slice(0, 4)
                      .map((skill) => (
                        <span
                          key={`${project.id}-${skill}`}
                          className="rounded-full bg-[#6C63FF]/16 px-2.5 py-1 text-xs text-[#B8B4FF]"
                        >
                          {skill}
                        </span>
                      ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    发布时间：{formatDate(project.created_at)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
