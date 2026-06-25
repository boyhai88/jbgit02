import Link from "next/link"

import { SiteFooter } from "@/components/footer"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

type Project = {
  id: string | number
  name: string | null
  description: string | null
  skills: string[] | string | null
  headcount: number | null
  budget: string | number | null
  status: string | null
  created_at?: string | null
  project_applications?: { id: string | number }[] | null
  matchScore?: number
}

type Profile = {
  skills?: string[] | string | null
}

type ProjectsPageProps = {
  searchParams?: Promise<{ sort?: string }> | { sort?: string }
}

const filterTags = ["全部", "React", "Rust", "Python", "AI/ML", "区块链", "最新发布"]

const sortOptions = [
  { label: "最新发布", value: "latest" },
  { label: "最热门", value: "popular" },
  { label: "高预算", value: "budget" },
  { label: "智能推荐", value: "smart" },
]

const fallbackProjects: Project[] = [
  {
    id: "demo-1",
    name: "开源 AI 代码审查助手",
    description:
      "构建基于 LLM 的 PR 审查工具，集成 GitHub Actions，支持多语言代码审查。",
    skills: ["React", "TypeScript", "AI/ML"],
    headcount: 4,
    budget: "8500",
    status: "招募中",
    created_at: "2026-06-20T08:00:00.000Z",
    project_applications: [{ id: "a1" }, { id: "a2" }, { id: "a3" }],
  },
  {
    id: "demo-2",
    name: "跨链 DeFi 聚合协议",
    description:
      "开发多链资产路由引擎，优化 gas 费用与成本，需要 Rust 与智能合约经验。",
    skills: ["Rust", "Solidity", "区块链"],
    headcount: 5,
    budget: "12000",
    status: "招募中",
    created_at: "2026-06-19T08:00:00.000Z",
    project_applications: [{ id: "a1" }, { id: "a2" }, { id: "a3" }, { id: "a4" }],
  },
  {
    id: "demo-3",
    name: "医疗影像标注平台",
    description:
      "为放射科医生提供 DICOM 标注工具，含 AI 辅助预测标注与质量控制模块。",
    skills: ["Python", "FastAPI", "AI/ML"],
    headcount: 3,
    budget: "6200",
    status: "招募中",
    created_at: "2026-06-18T08:00:00.000Z",
    project_applications: [{ id: "a1" }],
  },
  {
    id: "demo-4",
    name: "开发者文档搜索引擎",
    description:
      "语义化搜索 API 文档与 Stack Overflow，支持 VS Code 插件集成。",
    skills: ["React", "Node.js", "Elasticsearch"],
    headcount: 2,
    budget: "4500",
    status: "招募中",
    created_at: "2026-06-17T08:00:00.000Z",
    project_applications: [{ id: "a1" }, { id: "a2" }],
  },
  {
    id: "demo-5",
    name: "边缘计算 IoT 网关",
    description:
      "工业传感器数据采集与边缘推理，低延迟协议栈与设备管理平台。",
    skills: ["Rust", "Python", "嵌入式"],
    headcount: 5,
    budget: "9800",
    status: "招募中",
    created_at: "2026-06-16T08:00:00.000Z",
    project_applications: [],
  },
  {
    id: "demo-6",
    name: "NFT 创作者工具套件",
    description: "无代码 NFT 铸造与版权管理，含创作者仪表盘与链上分析。",
    skills: ["React", "Web3.js", "区块链"],
    headcount: 4,
    budget: "7200",
    status: "招募中",
    created_at: "2026-06-15T08:00:00.000Z",
    project_applications: [{ id: "a1" }, { id: "a2" }, { id: "a3" }],
  },
]

function getSkills(skills: Project["skills"] | Profile["skills"]) {
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

function getBudgetValue(project: Project) {
  const value =
    typeof project.budget === "number"
      ? project.budget
      : Number(String(project.budget ?? "0").replace(/[^\d.]/g, ""))

  return Number.isFinite(value) ? value : 0
}

function getApplicationCount(project: Project) {
  return project.project_applications?.length ?? 0
}

function getCreatedTime(project: Project) {
  return project.created_at ? new Date(project.created_at).getTime() : 0
}

function getMatchScore(project: Project, userSkills: string[]) {
  if (userSkills.length === 0) {
    return 0
  }

  const normalizedUserSkills = userSkills.map((skill) => skill.toLowerCase())
  const projectSkills = getSkills(project.skills).map((skill) =>
    skill.toLowerCase(),
  )

  return projectSkills.filter((skill) => normalizedUserSkills.includes(skill))
    .length
}

function sortProjects(projects: Project[], sort: string, userSkills: string[]) {
  const sorted = projects.map((project) => ({
    ...project,
    matchScore: getMatchScore(project, userSkills),
  }))

  if (sort === "popular") {
    return sorted.sort((a, b) => getApplicationCount(b) - getApplicationCount(a))
  }

  if (sort === "budget") {
    return sorted.sort((a, b) => getBudgetValue(b) - getBudgetValue(a))
  }

  if (sort === "smart") {
    return sorted.sort((a, b) => {
      if ((b.matchScore ?? 0) !== (a.matchScore ?? 0)) {
        return (b.matchScore ?? 0) - (a.matchScore ?? 0)
      }

      return getCreatedTime(b) - getCreatedTime(a)
    })
  }

  return sorted.sort((a, b) => getCreatedTime(b) - getCreatedTime(a))
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = searchParams ? await searchParams : {}
  const requestedSort = params.sort ?? "latest"
  const activeSort = sortOptions.some((item) => item.value === requestedSort)
    ? requestedSort
    : "latest"
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: projects } = await supabase
    .from("projects")
    .select("*, project_applications(id)")
    .order("created_at", { ascending: false })

  let userSkills: string[] = []

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("skills")
      .eq("id", user.id)
      .maybeSingle()

    userSkills = getSkills((profile as Profile | null)?.skills)
  }

  const displayProjects =
    projects && projects.length > 0 ? (projects as Project[]) : fallbackProjects
  const sortedProjects = sortProjects(
    displayProjects,
    activeSort === "smart" && !user ? "latest" : activeSort,
    userSkills,
  )

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="p-6 pb-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">项目市场</h1>
              <p className="text-gray-400">
                发现全球协作机会，按技能与收益筛选最适合你的项目
              </p>
            </div>
            <Link href="/projects/publish">
              <button className="rounded-lg bg-[#6C63FF] px-4 py-2 text-white hover:bg-[#5a52d6]">
                + 发布项目
              </button>
            </Link>
          </div>

          <div className="mb-5 flex flex-wrap gap-3">
            {filterTags.map((tag, index) => (
              <Link
                key={tag}
                href={
                  tag === "全部"
                    ? "/projects"
                    : `/projects?filter=${encodeURIComponent(tag)}`
                }
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition",
                  index === 0
                    ? "border-[#6C63FF] bg-[#6C63FF] text-white"
                    : "border-gray-800 bg-gray-900 text-gray-300 hover:border-[#6C63FF] hover:text-[#6C63FF]",
                )}
              >
                {tag}
              </Link>
            ))}
          </div>

          <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-950 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">推荐排序</p>
                <p className="mt-1 text-xs text-gray-500">
                  按发布时间、申请热度、预算或技能匹配度调整项目展示顺序
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {sortOptions.map((option) => {
                  const disabled = option.value === "smart" && !user

                  return (
                    <Link
                      key={option.value}
                      href={
                        disabled ? "/projects?sort=smart" : `/projects?sort=${option.value}`
                      }
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm transition",
                        activeSort === option.value
                          ? "border-[#6C63FF] bg-[#6C63FF] text-white"
                          : "border-gray-800 bg-gray-900 text-gray-300 hover:border-[#6C63FF] hover:text-[#6C63FF]",
                      )}
                    >
                      {option.label}
                    </Link>
                  )
                })}
              </div>
            </div>
            {activeSort === "smart" && !user ? (
              <div className="mt-4 rounded-xl border border-[#6C63FF]/30 bg-[#6C63FF]/10 px-4 py-3 text-sm text-[#B8B4FF]">
                登录查看个性化推荐
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedProjects.map((project) => {
              const projectSkills = getSkills(project.skills)

              return (
                <div
                  key={project.id}
                  className="rounded-xl border border-gray-800 bg-gray-900 p-6 transition hover:border-[#6C63FF]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-xl font-semibold text-white">
                      {project.name || "未命名项目"}
                    </h2>
                    {activeSort === "smart" && user ? (
                      <span className="shrink-0 rounded-full border border-[#6C63FF]/30 bg-[#6C63FF]/15 px-2 py-1 text-xs text-[#B8B4FF]">
                        匹配 {project.matchScore ?? 0}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-gray-400">
                    {project.description || "暂无项目描述"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {projectSkills.map((skill) => (
                      <span
                        key={`${project.id}-${skill}`}
                        className="rounded-full bg-[#6C63FF]/20 px-3 py-1 text-xs text-[#6C63FF]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      {project.headcount || 0} 人
                    </span>
                    <span className="font-medium text-[#6C63FF]">
                      ${project.budget || 0}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>{project.status || "招募中"}</span>
                    <span>申请 {getApplicationCount(project)} 人</span>
                  </div>
                  <Link href={`/projects/${project.id}`}>
                    <button className="mt-4 w-full rounded-lg border border-[#6C63FF] px-4 py-2 text-[#6C63FF] transition hover:bg-[#6C63FF] hover:text-white">
                      查看详情
                    </button>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>
      <div className="mt-12">
        <SiteFooter />
      </div>
    </main>
  )
}
