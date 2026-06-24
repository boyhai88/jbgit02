"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth/auth-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"

const skillOptions = [
  "React",
  "TypeScript",
  "Python",
  "Rust",
  "Solidity",
  "AI/ML",
  "DevOps",
  "Next.js",
  "Node.js",
  "Web3",
]

type PhaseRow = {
  id: number
  name: string
  headcount: string
  sharePercent: string
}

type Notice = {
  type: "success" | "error"
  title: string
  message: string
}

function countText(value: string) {
  return Array.from(value.replace(/\s/g, "")).length
}

export default function PublishProjectPage() {
  const router = useRouter()
  const { loading, user } = useAuth()
  const [projectName, setProjectName] = useState("")
  const [description, setDescription] = useState("")
  const [budget, setBudget] = useState("")
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [phases, setPhases] = useState<PhaseRow[]>([
    { id: 1, name: "", headcount: "1", sharePercent: "100" },
  ])
  const [notice, setNotice] = useState<Notice | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const descriptionLength = countText(description)
  const phaseShareTotal = useMemo(
    () =>
      phases.reduce(
        (total, phase) => total + (Number(phase.sharePercent) || 0),
        0,
      ),
    [phases],
  )

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login")
    }
  }, [loading, router, user])

  function toggleSkill(skill: string) {
    setSelectedSkills((current) =>
      current.includes(skill)
        ? current.filter((item) => item !== skill)
        : [...current, skill],
    )
  }

  function updatePhase(
    id: number,
    field: keyof Omit<PhaseRow, "id">,
    value: string,
  ) {
    setPhases((current) =>
      current.map((phase) =>
        phase.id === id ? { ...phase, [field]: value } : phase,
      ),
    )
  }

  function addPhase() {
    setPhases((current) => [
      ...current,
      { id: Date.now(), name: "", headcount: "1", sharePercent: "" },
    ])
  }

  function removePhase(id: number) {
    setPhases((current) => current.filter((phase) => phase.id !== id))
  }

  function validateForm() {
    const name = projectName.trim()
    const descriptionValue = description.trim()
    const budgetValue = Number(budget)
    const validPhases = phases.map((phase) => ({
      name: phase.name.trim(),
      headcount: Number(phase.headcount),
      sharePercent: Number(phase.sharePercent),
    }))

    if (!name || !descriptionValue || !budget || selectedSkills.length === 0) {
      return "请填写项目名称、项目描述、项目预算，并至少选择一个技能标签。"
    }

    if (descriptionLength < 50) {
      return `项目描述至少需要50个字，当前${descriptionLength}个字。`
    }

    if (!Number.isFinite(budgetValue) || budgetValue <= 0) {
      return "项目预算必须是大于0的数字。"
    }

    if (
      validPhases.length === 0 ||
      validPhases.some(
        (phase) =>
          !phase.name ||
          !Number.isFinite(phase.headcount) ||
          phase.headcount <= 0 ||
          !Number.isFinite(phase.sharePercent) ||
          phase.sharePercent <= 0,
      )
    ) {
      return "请完整填写每个工序的名称、招募人数和分成比例。"
    }

    if (phaseShareTotal !== 100) {
      return `工序分成比例总和必须为100%，当前为${phaseShareTotal}%。`
    }

    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!user) {
      router.push("/auth/login")
      return
    }

    const validationError = validateForm()

    if (validationError) {
      setNotice({
        type: "error",
        title: "发布失败",
        message: validationError,
      })
      return
    }

    setSubmitting(true)
    setNotice(null)

    const supabase = createClient()
    const cleanedPhases = phases.map((phase) => ({
      name: phase.name.trim(),
      headcount: Number(phase.headcount),
      share_percent: Number(phase.sharePercent),
    }))

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        name: projectName.trim(),
        description: description.trim(),
        budget: Number(budget),
        skills: selectedSkills,
        headcount: cleanedPhases.reduce(
          (total, phase) => total + phase.headcount,
          0,
        ),
        status: "招募中",
        user_id: user.id,
      })
      .select("id")
      .single()

    if (projectError || !project) {
      setSubmitting(false)
      setNotice({
        type: "error",
        title: "项目发布失败",
        message: projectError?.message ?? "未能创建项目，请稍后重试。",
      })
      return
    }

    const { error: phaseError } = await supabase.from("project_phases").insert(
      cleanedPhases.map((phase, index) => ({
        project_id: project.id,
        name: phase.name,
        headcount: phase.headcount,
        share_percent: phase.share_percent,
        status: "招募中",
        sort_order: index + 1,
      })),
    )

    if (phaseError) {
      setSubmitting(false)
      setNotice({
        type: "error",
        title: "工序保存失败",
        message: phaseError.message,
      })
      return
    }

    setNotice({
      type: "success",
      title: "项目发布成功！",
      message: "正在跳转到项目市场。",
    })
    router.push("/projects")
    router.refresh()
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#05050B] px-6 py-12 text-white">
        <div className="mx-auto max-w-3xl text-center text-white/60">
          正在读取登录状态...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#05050B] px-6 py-12 text-white">
      <section className="mx-auto w-full max-w-4xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8D87FF]">
            Publish Project
          </p>
          <h1 className="mt-3 text-3xl font-black text-white md:text-4xl">
            发布项目
          </h1>
          <p className="mt-3 text-base leading-7 text-white/55">
            填写项目信息、技能需求和工序分成，快速匹配合适的开发者伙伴。
          </p>
        </div>

        <Card className="rounded-2xl border-white/10 bg-[#10101A] text-white shadow-2xl shadow-black/30">
          <CardHeader className="border-b border-white/10 p-6">
            <CardTitle className="text-xl text-white">项目信息</CardTitle>
            <CardDescription className="text-white/55">
              项目描述至少50字，工序分成比例总和需为100%。
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
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

              <div className="grid gap-2">
                <Label htmlFor="project-name" className="text-white">
                  项目名称
                </Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="例如：开源 AI 代码审查助手"
                  className="h-11 border-white/10 bg-black/30 text-white placeholder:text-white/35"
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="project-description" className="text-white">
                    项目描述
                  </Label>
                  <span className="text-xs text-white/40">
                    {descriptionLength}/50
                  </span>
                </div>
                <Textarea
                  id="project-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="说明项目背景、目标、交付物、协作方式和你期待的伙伴类型。"
                  className="min-h-36 border-white/10 bg-black/30 text-white placeholder:text-white/35"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="project-budget" className="text-white">
                  项目预算
                </Label>
                <Input
                  id="project-budget"
                  type="number"
                  min="1"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  placeholder="例如：8000"
                  className="h-11 border-white/10 bg-black/30 text-white placeholder:text-white/35"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-white">技能标签</Label>
                <div className="flex flex-wrap gap-2">
                  {skillOptions.map((skill) => {
                    const selected = selectedSkills.includes(skill)

                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={
                          selected
                            ? "rounded-full border border-[#6C63FF] bg-[#6C63FF] px-4 py-2 text-sm font-medium text-white transition"
                            : "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/65 transition hover:border-[#6C63FF]/60 hover:text-white"
                        }
                      >
                        {skill}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Label className="text-white">工序管理</Label>
                    <p className="mt-1 text-sm text-white/45">
                      每个工序包含名称、招募人数和分成比例。
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addPhase}
                    className="border-[#6C63FF]/50 bg-transparent text-[#8D87FF] hover:bg-[#6C63FF]/10 hover:text-white"
                  >
                    + 添加工序
                  </Button>
                </div>

                <div className="space-y-3">
                  {phases.map((phase, index) => (
                    <Card
                      key={phase.id}
                      className="rounded-xl border-white/10 bg-black/20 py-0 text-white"
                    >
                      <CardContent className="p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="rounded-lg bg-[#6C63FF] px-3 py-1.5 text-xs font-bold text-white">
                            工序 {index + 1}
                          </span>
                          {phases.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => removePhase(phase.id)}
                              className="rounded-lg border border-red-500/35 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-500/10"
                            >
                              删除
                            </button>
                          ) : null}
                        </div>

                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px_160px]">
                          <label className="grid gap-2">
                            <span className="text-xs text-white/55">
                              工序名称
                            </span>
                            <Input
                              value={phase.name}
                              onChange={(event) =>
                                updatePhase(
                                  phase.id,
                                  "name",
                                  event.target.value,
                                )
                              }
                              placeholder="例如：前端页面开发"
                              className="h-11 border-white/10 bg-[#11111D] text-white placeholder:text-white/35"
                            />
                          </label>

                          <label className="grid gap-2">
                            <span className="text-xs text-white/55">
                              招募人数
                            </span>
                            <Input
                              type="number"
                              min="1"
                              value={phase.headcount}
                              onChange={(event) =>
                                updatePhase(
                                  phase.id,
                                  "headcount",
                                  event.target.value,
                                )
                              }
                              className="h-11 border-white/10 bg-[#11111D] text-white"
                            />
                          </label>

                          <label className="grid gap-2">
                            <span className="text-xs text-white/55">
                              分成比例
                            </span>
                            <div className="relative">
                              <Input
                                type="number"
                                min="1"
                                max="100"
                                value={phase.sharePercent}
                                onChange={(event) =>
                                  updatePhase(
                                    phase.id,
                                    "sharePercent",
                                    event.target.value,
                                  )
                                }
                                className="h-11 border-white/10 bg-[#11111D] pr-8 text-white"
                              />
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/45">
                                %
                              </span>
                            </div>
                          </label>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/55">
                  当前工序分成总和：
                  <span className="font-mono font-semibold text-[#8D87FF]">
                    {phaseShareTotal}%
                  </span>
                </div>
              </div>

              <div className="flex justify-end border-t border-white/10 pt-6">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-11 bg-[#6C63FF] px-8 text-white hover:bg-[#5B54E8]"
                >
                  {submitting ? "发布中..." : "发布项目"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
