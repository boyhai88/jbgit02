"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type Project = {
  id: string
  user_id: string | null
  name: string | null
  description: string | null
  budget: string | number | null
  skills: string[] | string | null
  headcount: number | null
  status: string | null
}

type ProjectPhase = {
  id: string | number
  project_id: string | number | null
  name: string | null
  headcount: number | string | null
  current_count?: number | string | null
  status: string | null
  share_percent: number | string | null
  sort_order?: number | null
}

type PhaseApplication = {
  id: string | number
  phase_id: string | number | null
  user_id: string | null
  applicant_email?: string | null
  status: string | null
  created_at: string | null
}

type Notice = {
  type: "success" | "error"
  title: string
  message: string
}

const phaseStatusStyles: Record<string, string> = {
  招募中: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  已满: "border-blue-500/40 bg-blue-500/15 text-blue-300",
  进行中: "border-orange-500/40 bg-orange-500/15 text-orange-300",
  已完成: "border-gray-600 bg-gray-800 text-gray-300",
}

function formatDate(date: string | null) {
  if (!date) {
    return "未设置"
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date))
}

function formatBudget(budget: Project["budget"]) {
  if (budget === null || budget === undefined || budget === "") {
    return "预算待定"
  }

  if (typeof budget === "number") {
    return `$${budget.toLocaleString()}`
  }

  return budget.startsWith("$") ? budget : `$${budget}`
}

function normalizeSkills(skills: Project["skills"]) {
  if (!skills) {
    return []
  }

  if (Array.isArray(skills)) {
    return skills
  }

  try {
    const parsed = JSON.parse(skills)
    return Array.isArray(parsed) ? parsed : [skills]
  } catch {
    return skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean)
  }
}

function getHeadcount(phase: ProjectPhase) {
  return Number(phase.headcount ?? 0)
}

function getCurrentCount(phase: ProjectPhase, applications: PhaseApplication[]) {
  const approvedCount = applications.filter(
    (application) =>
      String(application.phase_id) === String(phase.id) &&
      application.status === "已通过",
  ).length

  return approvedCount || Number(phase.current_count ?? 0)
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { loading: authLoading, user } = useAuth()
  const projectId = params.id
  const [project, setProject] = useState<Project | null>(null)
  const [projectPhases, setProjectPhases] = useState<ProjectPhase[]>([])
  const [phaseApplications, setPhaseApplications] = useState<PhaseApplication[]>([])
  const [loadingProject, setLoadingProject] = useState(true)
  const [notice, setNotice] = useState<Notice | null>(null)

  const isProjectOwner = Boolean(user && project?.user_id === user.id)
  const skills = useMemo(() => normalizeSkills(project?.skills ?? null), [project])

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    async function loadProject() {
      const [
        { data: projectData, error: projectError },
        { data: phasesData },
      ] = await Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).single(),
        supabase
          .from("project_phases")
          .select(
            "id, project_id, name, headcount, current_count, status, share_percent, sort_order",
          )
          .eq("project_id", projectId)
          .order("sort_order", { ascending: true }),
      ])

      const phaseRows = (phasesData ?? []) as ProjectPhase[]
      const phaseIds = phaseRows.map((phase) => phase.id)
      const { data: phaseApplicationsData } =
        phaseIds.length > 0
          ? await supabase
              .from("phase_applications")
              .select("id, phase_id, user_id, status, created_at")
              .in("phase_id", phaseIds)
              .order("created_at", { ascending: false })
          : { data: [] }
      const applicationRows = (phaseApplicationsData ?? []) as PhaseApplication[]
      const userIds = Array.from(
        new Set(
          applicationRows
            .map((application) => application.user_id)
            .filter((id): id is string => Boolean(id)),
        ),
      )
      const { data: usersData } =
        userIds.length > 0
          ? await supabase.from("users").select("id, email").in("id", userIds)
          : { data: [] }
      const emailMap = new Map(
        ((usersData ?? []) as Array<{ id: string; email: string | null }>).map(
          (item) => [item.id, item.email],
        ),
      )
      const applicationsWithEmail = applicationRows.map((application) => ({
        ...application,
        applicant_email: application.user_id
          ? emailMap.get(application.user_id) ?? "未知邮箱"
          : "未知邮箱",
      }))

      if (!mounted) {
        return
      }

      setProject(projectError || !projectData ? null : (projectData as Project))
      setProjectPhases(phaseRows)
      setPhaseApplications(applicationsWithEmail)
      setLoadingProject(false)
    }

    void loadProject().catch((error) => {
      console.error("项目详情加载失败:", error)

      if (!mounted) {
        return
      }

      setProject(null)
      setProjectPhases([])
      setPhaseApplications([])
      setLoadingProject(false)
    })

    return () => {
      mounted = false
    }
  }, [projectId])

  async function handleApplyPhase(phase: ProjectPhase) {
    if (authLoading) {
      return
    }

    if (!user) {
      router.push("/auth/login")
      return
    }

    const requiredCount = getHeadcount(phase)
    const currentCount = getCurrentCount(phase, phaseApplications)

    if (requiredCount > 0 && currentCount >= requiredCount) {
      setNotice({
        type: "error",
        title: "工序已满",
        message: "该工序申请人数已达到招募人数。",
      })
      return
    }

    const hasApplied = phaseApplications.some(
      (application) =>
        String(application.phase_id) === String(phase.id) &&
        application.user_id === user.id,
    )

    if (hasApplied) {
      setNotice({
        type: "error",
        title: "已申请",
        message: "你已经申请过该工序，请勿重复提交。",
      })
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from("phase_applications").insert({
      project_id: projectId,
      phase_id: phase.id,
      user_id: user.id,
      status: "待审核",
    })

    if (error) {
      const isDuplicate =
        error.code === "23505" || error.message.includes("duplicate")

      setNotice({
        type: "error",
        title: isDuplicate ? "已申请" : "工序申请失败",
        message: isDuplicate ? "你已经申请过该工序，请勿重复提交。" : error.message,
      })
      return
    }

    window.location.reload()
  }

  async function handleUpdatePhaseApplication(
    application: PhaseApplication,
    status: "已通过" | "已拒绝",
  ) {
    if (!user || !project || project.user_id !== user.id) {
      router.push("/auth/login")
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from("phase_applications")
      .update({ status })
      .eq("id", application.id)

    if (error) {
      setNotice({
        type: "error",
        title: "工序申请审核失败",
        message: error.message,
      })
      return
    }

    if (status === "已通过" && application.phase_id) {
      const phase = projectPhases.find(
        (item) => String(item.id) === String(application.phase_id),
      )
      const currentCount = phase ? Number(phase.current_count ?? 0) : 0
      const nextCount = currentCount + 1
      const { error: phaseError } = await supabase
        .from("project_phases")
        .update({ current_count: nextCount })
        .eq("id", application.phase_id)

      if (phaseError) {
        setNotice({
          type: "error",
          title: "工序人数更新失败",
          message: phaseError.message,
        })
        return
      }
    }

    window.location.reload()
  }

  if (loadingProject) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05050B] px-6 text-white">
        <p className="text-base text-white/55">正在加载项目...</p>
      </main>
    )
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-[#05050B] px-6 py-12 text-white">
        <section className="mx-auto w-full max-w-4xl">
          <Link
            href="/projects"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "mb-8 border-gray-800 bg-[#10101A] text-white/70 hover:border-[#6C63FF]/50 hover:text-white",
            )}
          >
            返回项目市场
          </Link>
          <div className="rounded-2xl border border-gray-800 bg-[#10101A] p-10 text-center text-white/55 shadow-lg">
            项目不存在
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#05050B] px-6 py-12 text-white">
      <section className="mx-auto w-full max-w-5xl">
        <Link
          href="/projects"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "mb-8 border-gray-800 bg-[#10101A] text-white/70 hover:border-[#6C63FF]/50 hover:text-white",
          )}
        >
          返回项目市场
        </Link>

        <Card className="rounded-2xl border-gray-800 bg-[#10101A] text-white shadow-lg shadow-black/30">
          <CardHeader className="border-b border-gray-800 p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-mono text-xs text-white/35">
                  项目ID：{project.id}
                </p>
                <CardTitle className="mt-4 text-4xl font-black tracking-normal text-white md:text-5xl">
                  {project.name || "未命名项目"}
                </CardTitle>
                <CardDescription className="mt-5 max-w-3xl text-lg leading-relaxed text-white/60">
                  {project.description || "暂无项目描述"}
                </CardDescription>
              </div>
              <span className="w-fit shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 py-1.5 text-sm font-medium text-emerald-300">
                {project.status || "招募中"}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-8 p-8">
            {notice ? (
              <Alert
                className={
                  notice.type === "success"
                    ? "border-[#6C63FF]/50 bg-[#6C63FF]/10 text-white"
                    : "border-red-400/40 bg-red-500/10 text-red-100"
                }
              >
                <AlertTitle>{notice.title}</AlertTitle>
                <AlertDescription>{notice.message}</AlertDescription>
              </Alert>
            ) : null}

            <section className="rounded-2xl border border-gray-800 bg-black/20 p-6 shadow-md">
              <h2 className="text-xl font-bold text-white">项目描述</h2>
              <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-white/65">
                {project.description || "暂无项目描述"}
              </p>
            </section>

            <section className="rounded-2xl border border-gray-800 bg-black/20 p-6 shadow-md">
              <h2 className="text-xl font-bold text-white">技能标签</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {skills.length > 0 ? (
                  skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-[#6C63FF]/30 bg-[#6C63FF]/16 px-4 py-1.5 font-mono text-sm text-[#8D87FF]"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-base text-white/45">暂无技能标签</span>
                )}
              </div>
            </section>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-800 bg-black/20 p-6 shadow-md">
                <p className="text-base text-white/45">招募人数</p>
                <p className="mt-3 text-3xl font-bold text-white">
                  {project.headcount ?? 0} 人
                </p>
              </div>
              <div className="rounded-2xl border border-gray-800 bg-black/20 p-6 shadow-md">
                <p className="text-base text-white/45">项目预算</p>
                <p className="mt-3 text-3xl font-bold text-[#6C63FF]">
                  {formatBudget(project.budget)}
                </p>
              </div>
            </div>

            <section className="rounded-2xl border border-gray-800 bg-black/20 p-6 shadow-md">
              <div>
                <h2 className="text-xl font-bold text-white">项目工序</h2>
                <p className="mt-2 text-base leading-relaxed text-white/45">
                  按工序查看招募人数、当前申请进度和分成比例
                </p>
              </div>

              {projectPhases.length === 0 ? (
                <div className="mt-6 rounded-xl border border-gray-800 bg-white/[0.03] p-5 text-base text-white/45">
                  暂无工序
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {projectPhases.map((phase) => {
                    const requiredCount = getHeadcount(phase)
                    const currentCount = getCurrentCount(phase, phaseApplications)
                    const progress =
                      requiredCount > 0
                        ? Math.min(100, Math.round((currentCount / requiredCount) * 100))
                        : 0
                    const isFull = requiredCount > 0 && currentCount >= requiredCount
                    const hasApplied = Boolean(
                      user &&
                        phaseApplications.some(
                          (application) =>
                            String(application.phase_id) === String(phase.id) &&
                            application.user_id === user.id,
                        ),
                    )
                    const phaseStatus = isFull ? "已满" : phase.status || "招募中"

                    return (
                      <div
                        key={phase.id}
                        className="rounded-xl border border-gray-800 bg-white/[0.03] p-5 shadow-md"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {phase.name || "未命名工序"}
                            </h3>
                            <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/55">
                              <span>招募人数：{requiredCount} 人</span>
                              <span>当前人数：{currentCount} 人</span>
                              <span className="font-mono text-[#8D87FF]">
                                分成比例：{phase.share_percent ?? 0}%
                              </span>
                            </div>
                          </div>
                          <span
                            className={cn(
                              "w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-medium",
                              phaseStatusStyles[phaseStatus] ??
                                "border-gray-700 bg-white/5 text-white/55",
                            )}
                          >
                            {phaseStatus}
                          </span>
                        </div>

                        <div className="mt-5">
                          <div className="mb-2 flex items-center justify-between text-xs text-white/40">
                            <span>
                              已满人数 / 总需求人数：{currentCount}/{requiredCount}
                            </span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-[#6C63FF] transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-5 flex justify-end border-t border-gray-800 pt-4">
                          <Button
                            type="button"
                            disabled={isFull || hasApplied}
                            onClick={() => void handleApplyPhase(phase)}
                            className={
                              isFull || hasApplied
                                ? "bg-white/10 text-white/45 hover:bg-white/10"
                                : "bg-[#6C63FF] text-white hover:bg-[#5B54E8]"
                            }
                          >
                            {isFull ? "已满" : hasApplied ? "已申请" : "申请加入"}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-gray-800 bg-black/20 p-6 shadow-md">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">工序申请人列表</h2>
                  <p className="mt-2 text-base leading-relaxed text-white/45">
                    只显示当前项目工序对应的申请记录
                  </p>
                </div>
                {isProjectOwner ? (
                  <span className="rounded-full border border-[#6C63FF]/30 bg-[#6C63FF]/15 px-3 py-1 text-xs text-[#8D87FF]">
                    项目所有者可审核
                  </span>
                ) : null}
              </div>

              {phaseApplications.length === 0 ? (
                <div className="mt-6 rounded-xl border border-gray-800 bg-white/[0.03] p-5 text-base text-white/45">
                  暂无工序申请人
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {phaseApplications.map((application) => {
                    const applicationStatus = application.status || "待审核"
                    const phaseName =
                      projectPhases.find(
                        (phase) =>
                          String(phase.id) === String(application.phase_id),
                      )?.name ?? "未知工序"
                    const statusClass =
                      applicationStatus === "已通过"
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                        : applicationStatus === "已拒绝"
                          ? "border-red-500/40 bg-red-500/15 text-red-300"
                          : "border-amber-500/40 bg-amber-500/15 text-amber-300"

                    return (
                      <div
                        key={application.id}
                        className="flex flex-col gap-4 rounded-xl border border-gray-800 bg-white/[0.03] p-5 shadow-md sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-semibold text-white">
                            {application.applicant_email || "未知邮箱"}
                          </p>
                          <p className="mt-2 text-sm text-white/45">
                            申请工序：{phaseName}
                          </p>
                          <p className="mt-1 text-sm text-white/35">
                            申请时间：{formatDate(application.created_at)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-medium",
                              statusClass,
                            )}
                          >
                            {applicationStatus}
                          </span>
                          {isProjectOwner ? (
                            <>
                              <Button
                                type="button"
                                disabled={applicationStatus === "已通过"}
                                onClick={() =>
                                  void handleUpdatePhaseApplication(
                                    application,
                                    "已通过",
                                  )
                                }
                                className="bg-[#6C63FF] text-white hover:bg-[#5B54E8]"
                              >
                                通过
                              </Button>
                              <Button
                                type="button"
                                disabled={applicationStatus === "已拒绝"}
                                onClick={() =>
                                  void handleUpdatePhaseApplication(
                                    application,
                                    "已拒绝",
                                  )
                                }
                                variant="outline"
                                className="border-red-500/40 bg-transparent text-red-200 hover:bg-red-500/10 hover:text-red-100"
                              >
                                拒绝
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
