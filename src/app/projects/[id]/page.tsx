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

const STATUS_RECRUITING = "\u62db\u52df\u4e2d"
const STATUS_FULL = "\u5df2\u6ee1"
const STATUS_PENDING = "\u5f85\u5ba1\u6838"
const STATUS_APPROVED = "\u5df2\u901a\u8fc7"
const STATUS_REJECTED = "\u5df2\u62d2\u7edd"

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
  [STATUS_RECRUITING]: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  [STATUS_FULL]: "border-blue-500/40 bg-blue-500/15 text-blue-300",
  "\u8fdb\u884c\u4e2d": "border-orange-500/40 bg-orange-500/15 text-orange-300",
  "\u5df2\u5b8c\u6210": "border-gray-600 bg-gray-800 text-gray-300",
}

function formatDate(date: string | null) {
  if (!date) {
    return "Not set"
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date))
}

function formatBudget(budget: Project["budget"]) {
  if (budget === null || budget === undefined || budget === "") {
    return "TBD"
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
      application.status === STATUS_APPROVED,
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
  const phaseShareTotal = useMemo(
    () =>
      projectPhases.reduce(
        (total, phase) => total + (Number(phase.share_percent) || 0),
        0,
      ),
    [projectPhases],
  )

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
          ? emailMap.get(application.user_id) ?? "Unknown email"
          : "Unknown email",
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
      console.error("Project detail load failed:", error)

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
        title: "Phase is full",
        message: "This phase has reached the required headcount.",
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
        title: "Already applied",
        message: "You have already applied for this phase.",
      })
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from("phase_applications").insert({
      project_id: projectId,
      phase_id: phase.id,
      user_id: user.id,
      status: STATUS_PENDING,
    })

    if (error) {
      const isDuplicate =
        error.code === "23505" || error.message.includes("duplicate")

      setNotice({
        type: "error",
        title: isDuplicate ? "Already applied" : "Phase application failed",
        message: isDuplicate ? "You have already applied for this phase." : error.message,
      })
      return
    }

    window.location.reload()
  }

  async function handleUpdatePhaseApplication(
    application: PhaseApplication,
    status: typeof STATUS_APPROVED | typeof STATUS_REJECTED,
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
        title: "Review failed",
        message: error.message,
      })
      return
    }

    if (status === STATUS_APPROVED && application.phase_id) {
      const phase = projectPhases.find(
        (item) => String(item.id) === String(application.phase_id),
      )
      const currentCount = phase ? Number(phase.current_count ?? 0) : 0
      const headcount = phase ? getHeadcount(phase) : 0
      const nextCount = currentCount + 1
      const phaseUpdate: { current_count: number; status?: string } = {
        current_count: nextCount,
      }

      if (headcount > 0 && nextCount >= headcount) {
        phaseUpdate.status = STATUS_FULL
      }

      const { error: phaseError } = await supabase
        .from("project_phases")
        .update(phaseUpdate)
        .eq("id", application.phase_id)

      if (phaseError) {
        setNotice({
          type: "error",
          title: "Phase count update failed",
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
        <p className="text-base text-white/55">Loading project...</p>
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
            Back to marketplace
          </Link>
          <div className="rounded-2xl border border-gray-800 bg-[#10101A] p-10 text-center text-white/55 shadow-lg">
            Project not found
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
          Back to marketplace
        </Link>

        <Card className="rounded-2xl border-gray-800 bg-[#10101A] text-white shadow-lg shadow-black/30">
          <CardHeader className="border-b border-gray-800 p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-mono text-xs text-white/35">
                  Project ID: {project.id}
                </p>
                <CardTitle className="mt-4 text-4xl font-black tracking-normal text-white md:text-5xl">
                  {project.name || "Untitled project"}
                </CardTitle>
                <CardDescription className="mt-5 max-w-3xl text-lg leading-relaxed text-white/60">
                  {project.description || "No project description yet."}
                </CardDescription>
              </div>
              <span className="w-fit shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 py-1.5 text-sm font-medium text-emerald-300">
                {project.status || STATUS_RECRUITING}
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
              <h2 className="text-xl font-bold text-white">Description</h2>
              <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-white/65">
                {project.description || "No project description yet."}
              </p>
            </section>

            <section className="rounded-2xl border border-gray-800 bg-black/20 p-6 shadow-md">
              <h2 className="text-xl font-bold text-white">Skills</h2>
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
                  <span className="text-base text-white/45">No skills listed</span>
                )}
              </div>
            </section>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-800 bg-black/20 p-6 shadow-md">
                <p className="text-base text-white/45">Headcount</p>
                <p className="mt-3 text-3xl font-bold text-white">
                  {project.headcount ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-800 bg-black/20 p-6 shadow-md">
                <p className="text-base text-white/45">Budget</p>
                <p className="mt-3 text-3xl font-bold text-[#6C63FF]">
                  {formatBudget(project.budget)}
                </p>
              </div>
            </div>

            <section className="rounded-2xl border border-gray-800 bg-black/20 p-6 shadow-md">
              <div>
                <h2 className="text-xl font-bold text-white">Project phases</h2>
                <p className="mt-2 text-base leading-relaxed text-white/45">
                  Review phase headcount, application progress, and revenue share.
                </p>
              </div>

              {projectPhases.length === 0 ? (
                <div className="mt-6 rounded-xl border border-gray-800 bg-white/[0.03] p-5 text-base text-white/45">
                  No phases yet
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
                    const phaseStatus = isFull ? STATUS_FULL : phase.status || STATUS_RECRUITING

                    return (
                      <div
                        key={phase.id}
                        className="rounded-xl border border-gray-800 bg-white/[0.03] p-5 shadow-md"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {phase.name || "Untitled phase"}
                            </h3>
                            <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/55">
                              <span>Required: {requiredCount}</span>
                              <span>Current: {currentCount}</span>
                              <span className="font-mono text-[#8D87FF]">
                                Share: {phase.share_percent ?? 0}%
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
                              Filled / required: {currentCount}/{requiredCount}
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
                            {isFull ? "Full" : hasApplied ? "Applied" : "Apply"}
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
                  <h2 className="text-xl font-bold text-white">Phase applicants</h2>
                  <p className="mt-2 text-base leading-relaxed text-white/45">
                    Only applications related to this project's phases are shown.
                  </p>
                </div>
                {isProjectOwner ? (
                  <span className="rounded-full border border-[#6C63FF]/30 bg-[#6C63FF]/15 px-3 py-1 text-xs text-[#8D87FF]">
                    Owner review enabled
                  </span>
                ) : null}
              </div>

              {phaseApplications.length === 0 ? (
                <div className="mt-6 rounded-xl border border-gray-800 bg-white/[0.03] p-5 text-base text-white/45">
                  No phase applications yet
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {phaseApplications.map((application) => {
                    const applicationStatus = application.status || STATUS_PENDING
                    const phaseName =
                      projectPhases.find(
                        (phase) =>
                          String(phase.id) === String(application.phase_id),
                      )?.name ?? "Unknown phase"
                    const statusClass =
                      applicationStatus === STATUS_APPROVED
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                        : applicationStatus === STATUS_REJECTED
                          ? "border-red-500/40 bg-red-500/15 text-red-300"
                          : "border-amber-500/40 bg-amber-500/15 text-amber-300"

                    return (
                      <div
                        key={application.id}
                        className="flex flex-col gap-4 rounded-xl border border-gray-800 bg-white/[0.03] p-5 shadow-md sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-semibold text-white">
                            {application.applicant_email || "Unknown email"}
                          </p>
                          <p className="mt-2 text-sm text-white/45">
                            Phase: {phaseName}
                          </p>
                          <p className="mt-1 text-sm text-white/35">
                            Applied: {formatDate(application.created_at)}
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
                                disabled={applicationStatus === STATUS_APPROVED}
                                onClick={() =>
                                  void handleUpdatePhaseApplication(
                                    application,
                                    STATUS_APPROVED,
                                  )
                                }
                                className="bg-[#6C63FF] text-white hover:bg-[#5B54E8]"
                              >
                                Approve
                              </Button>
                              <Button
                                type="button"
                                disabled={applicationStatus === STATUS_REJECTED}
                                onClick={() =>
                                  void handleUpdatePhaseApplication(
                                    application,
                                    STATUS_REJECTED,
                                  )
                                }
                                variant="outline"
                                className="border-red-500/40 bg-transparent text-red-200 hover:bg-red-500/10 hover:text-red-100"
                              >
                                Reject
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

            <section className="rounded-2xl border border-gray-800 bg-black/20 p-6 shadow-md">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {"\u6536\u76ca\u5206\u914d"}
                  </h2>
                  <p className="mt-2 text-base leading-relaxed text-white/45">
                    {"\u6309\u5de5\u5e8f\u5c55\u793a\u5f53\u524d\u9879\u76ee\u7684\u5206\u6210\u6bd4\u4f8b"}
                  </p>
                </div>
                <div className="rounded-full border border-[#6C63FF]/30 bg-[#6C63FF]/15 px-4 py-2 text-sm font-semibold text-[#8D87FF]">
                  {"\u603b\u5206\u6210"}: {phaseShareTotal}%
                </div>
              </div>

              {phaseShareTotal !== 100 ? (
                <Alert className="mt-6 border-amber-500/40 bg-amber-500/10 text-amber-100">
                  <AlertTitle>{"\u5206\u6210\u6bd4\u4f8b\u5f02\u5e38"}</AlertTitle>
                  <AlertDescription>
                    {"\u5f53\u524d\u6240\u6709\u5de5\u5e8f\u5206\u6210\u6bd4\u4f8b\u603b\u548c\u4e3a"}{" "}
                    {phaseShareTotal}
                    {"%\uff0c\u9700\u8981\u7b49\u4e8e100%\u3002"}
                  </AlertDescription>
                </Alert>
              ) : null}

              {projectPhases.length === 0 ? (
                <div className="mt-6 rounded-xl border border-gray-800 bg-white/[0.03] p-5 text-base text-white/45">
                  {"\u6682\u65e0\u5de5\u5e8f\u5206\u6210\u6570\u636e"}
                </div>
              ) : (
                <div className="mt-6 overflow-hidden rounded-xl border border-gray-800">
                  <div className="grid grid-cols-2 bg-white/[0.04] px-5 py-4 text-sm font-semibold text-white/45">
                    <span>{"\u5de5\u5e8f\u540d\u79f0"}</span>
                    <span className="text-right">{"\u5206\u6210\u6bd4\u4f8b"}</span>
                  </div>
                  {projectPhases.map((phase) => (
                    <div
                      key={phase.id}
                      className="grid grid-cols-2 border-t border-gray-800 px-5 py-4 text-base text-white/70"
                    >
                      <span>{phase.name || "Untitled phase"}</span>
                      <span className="text-right font-mono text-[#8D87FF]">
                        {Number(phase.share_percent ?? 0)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
