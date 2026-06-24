import { redirect } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

type ProjectSkillRow = {
  skills: string[] | string | null
}

function normalizeSkills(skills: ProjectSkillRow["skills"]) {
  if (Array.isArray(skills)) {
    return skills
  }

  if (!skills) {
    return []
  }

  try {
    const parsed = JSON.parse(skills)
    return Array.isArray(parsed) ? parsed : [skills]
  } catch {
    return skills.split(",").map((skill) => skill.trim())
  }
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== "admin") {
    redirect("/")
  }

  const [
    { count: userCount },
    { count: projectCount },
    { count: applicationCount },
    { count: reviewCount },
    { data: projectSkills },
  ] = await Promise.all([
    supabase.schema("auth").from("users").select("*", {
      count: "exact",
      head: true,
    }),
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase
      .from("project_applications")
      .select("*", { count: "exact", head: true }),
    supabase.from("user_reviews").select("*", { count: "exact", head: true }),
    supabase.from("projects").select("skills"),
  ])

  const skillCounts = new Map<string, number>()

  ;((projectSkills ?? []) as ProjectSkillRow[]).forEach((project) => {
    normalizeSkills(project.skills).forEach((skill) => {
      if (!skill) {
        return
      }

      skillCounts.set(skill, (skillCounts.get(skill) ?? 0) + 1)
    })
  })

  const hotSkills = Array.from(skillCounts.entries())
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const stats = [
    { label: "总用户数", value: userCount ?? 0 },
    { label: "总项目数", value: projectCount ?? 0 },
    { label: "总申请数", value: applicationCount ?? 0 },
    { label: "总评价数", value: reviewCount ?? 0 },
  ]

  return (
    <main className="min-h-screen bg-[#05050B] px-6 py-10 text-white">
      <section className="mx-auto w-full max-w-6xl">
        <div>
          <h1 className="text-3xl font-black tracking-normal text-white">
            📊 平台数据看板
          </h1>
          <p className="mt-2 text-sm text-white/45">
            管理员查看平台核心数据与技能需求趋势。
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className="rounded-2xl border-white/10 bg-[#10101A] py-0 text-white shadow-none"
            >
              <CardContent className="p-6">
                <p className="text-sm text-white/45">{stat.label}</p>
                <p className="mt-4 font-mono text-4xl font-bold text-white">
                  {stat.value.toLocaleString()}
                </p>
                <div className="mt-5 h-1.5 rounded-full bg-[#6C63FF]/20">
                  <div className="h-full w-2/3 rounded-full bg-[#6C63FF]" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 rounded-2xl border-white/10 bg-[#10101A] py-0 text-white shadow-none">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-xl font-bold text-white">
              技能热度排名
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            {hotSkills.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-center text-sm text-white/45">
                暂无技能数据
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {hotSkills.map((item, index) => (
                  <div
                    key={item.skill}
                    className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF]/18 text-sm font-bold text-[#8D87FF]">
                        {index + 1}
                      </span>
                      <span className="truncate font-medium text-white">
                        {item.skill}
                      </span>
                    </div>
                    <span className="font-mono text-sm text-white/55">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
