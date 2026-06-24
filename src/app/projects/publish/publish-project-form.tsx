"use client"

import { AlertCircle, CheckCircle2, Plus, Trash2 } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
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
import { cn } from "@/lib/utils"

const steps = ["基本信息", "技能需求", "团队设置", "收益分配"]

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
]

type ProjectFormData = {
  projectName: string
  projectDescription: string
  projectBudget: string
  recruitCount: string
  roleDescription: string
}

type RevenueRow = {
  id: number
  roleName: string
  contributionType: string
  shareRatio: string
}

type Notice = {
  type: "success" | "error"
  title: string
  description?: string
}

const initialFormData: ProjectFormData = {
  projectName: "",
  projectDescription: "",
  projectBudget: "",
  recruitCount: "",
  roleDescription: "",
}

export function PublishProjectForm() {
  const router = useRouter()
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [notice, setNotice] = useState<Notice | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [revenueRows, setRevenueRows] = useState<RevenueRow[]>([
    {
      id: 1,
      roleName: "",
      contributionType: "",
      shareRatio: "",
    },
  ])

  const progress = useMemo(
    () => Math.round(((currentStep + 1) / steps.length) * 100),
    [currentStep],
  )

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current)
      }
    }
  }, [])

  function updateFormField(field: keyof ProjectFormData, value: string) {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  function toggleSkill(skill: string) {
    setSelectedSkills((current) =>
      current.includes(skill)
        ? current.filter((item) => item !== skill)
        : [...current, skill],
    )
  }

  function updateRevenueRow(
    id: number,
    field: keyof Omit<RevenueRow, "id">,
    value: string,
  ) {
    setRevenueRows((rows) =>
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    )
  }

  function addRevenueRow() {
    setRevenueRows((rows) => [
      ...rows,
      {
        id: Date.now(),
        roleName: "",
        contributionType: "",
        shareRatio: "",
      },
    ])
  }

  function removeRevenueRow(id: number) {
    setRevenueRows((rows) =>
      rows.length === 1 ? rows : rows.filter((row) => row.id !== id),
    )
  }

  function goPrevious() {
    setNotice(null)
    setCurrentStep((step) => Math.max(0, step - 1))
  }

  function goNext() {
    setNotice(null)
    setCurrentStep((step) => Math.min(steps.length - 1, step + 1))
  }

  function validateSubmission() {
    if (!formData.projectName.trim() || !formData.projectDescription.trim()) {
      return 0
    }

    if (selectedSkills.length === 0) {
      return 1
    }

    const recruitCount = Number(formData.recruitCount)
    if (
      !formData.recruitCount.trim() ||
      Number.isNaN(recruitCount) ||
      recruitCount <= 0
    ) {
      return 2
    }

    if (revenueRows.length === 0) {
      return 3
    }

    return null
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const invalidStep = validateSubmission()

    if (invalidStep !== null) {
      setCurrentStep(invalidStep)
      setNotice({
        type: "error",
        title: "请填写所有必填字段",
        description: `请检查「${steps[invalidStep]}」中的必填内容。`,
      })
      return
    }

    const projectPayload = {
      ...formData,
      recruitCount: Number(formData.recruitCount),
      skills: selectedSkills,
      revenueDistribution: revenueRows,
      publishedAt: new Date().toISOString(),
    }

    window.sessionStorage.setItem(
      "jbgit:lastPublishedProject",
      JSON.stringify(projectPayload),
    )

    setIsPublishing(true)
    setNotice({
      type: "success",
      title: "项目发布成功！",
      description: "即将跳转到项目市场页面。",
    })

    redirectTimerRef.current = setTimeout(() => {
      router.push("/projects")
    }, 900)
  }

  return (
    <Card className="rounded-xl border-white/10 bg-[#10101A] py-0 text-white shadow-none">
      <CardHeader className="border-b border-white/10 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-2xl font-black tracking-normal text-white">
              发布项目
            </CardTitle>
            <CardDescription className="mt-2 text-white/48">
              第 {currentStep + 1} 步，共 {steps.length} 步：{steps[currentStep]}
            </CardDescription>
          </div>
          <div className="min-w-[180px]">
            <div className="mb-2 flex justify-between text-xs text-white/42">
              <span>进度</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#6C63FF] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {steps.map((step, index) => {
            const isActive = index === currentStep
            const isComplete = index < currentStep

            return (
              <button
                key={step}
                type="button"
                onClick={() => {
                  setNotice(null)
                  setCurrentStep(index)
                }}
                className={cn(
                  "rounded-lg border px-4 py-3 text-left transition-colors",
                  isActive
                    ? "border-[#6C63FF] bg-[#6C63FF]/16 text-white"
                    : isComplete
                      ? "border-[#6C63FF]/35 bg-[#6C63FF]/8 text-[#8D87FF]"
                      : "border-white/10 bg-white/[0.03] text-white/45 hover:border-[#6C63FF]/40 hover:text-white",
                )}
              >
                <span className="block font-mono text-xs">
                  0{index + 1}
                </span>
                <span className="mt-1 block text-sm font-medium">{step}</span>
              </button>
            )
          })}
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5 p-6">
          {notice ? (
            <Alert
              className={cn(
                "flex gap-3 border text-white",
                notice.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/12"
                  : "border-red-500/30 bg-red-500/12",
              )}
            >
              {notice.type === "success" ? (
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-emerald-400"
                  aria-hidden="true"
                />
              ) : (
                <AlertCircle
                  className="mt-0.5 size-4 shrink-0 text-red-400"
                  aria-hidden="true"
                />
              )}
              <div>
                <AlertTitle>{notice.title}</AlertTitle>
                {notice.description ? (
                  <AlertDescription className="text-white/70">
                    {notice.description}
                  </AlertDescription>
                ) : null}
              </div>
            </Alert>
          ) : null}

          {currentStep === 0 ? (
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="project-name" className="text-white/72">
                  项目名称
                </Label>
                <Input
                  id="project-name"
                  name="projectName"
                  value={formData.projectName}
                  onChange={(event) =>
                    updateFormField("projectName", event.target.value)
                  }
                  placeholder="例如：开源 AI 代码审查助手"
                  className="h-11 border-white/10 bg-[#05050B] text-white placeholder:text-white/30"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project-description" className="text-white/72">
                  项目描述
                </Label>
                <Textarea
                  id="project-description"
                  name="projectDescription"
                  value={formData.projectDescription}
                  onChange={(event) =>
                    updateFormField("projectDescription", event.target.value)
                  }
                  placeholder="介绍项目目标、协作方式、交付范围和预期成果"
                  className="border-white/10 bg-[#05050B] text-white placeholder:text-white/30"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project-budget" className="text-white/72">
                  项目预算
                </Label>
                <Input
                  id="project-budget"
                  name="projectBudget"
                  value={formData.projectBudget}
                  onChange={(event) =>
                    updateFormField("projectBudget", event.target.value)
                  }
                  placeholder="例如：$8,500"
                  className="h-11 border-white/10 bg-[#05050B] text-white placeholder:text-white/30"
                />
              </div>
            </div>
          ) : null}

          {currentStep === 1 ? (
            <div>
              <Label className="text-white/72">技能标签选择</Label>
              <div className="mt-4 flex flex-wrap gap-3">
                {skillOptions.map((skill) => {
                  const isSelected = selectedSkills.includes(skill)

                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                        isSelected
                          ? "border-[#6C63FF] bg-[#6C63FF]/18 text-[#8D87FF]"
                          : "border-white/10 bg-[#05050B] text-white/58 hover:border-[#6C63FF]/50 hover:text-white",
                      )}
                    >
                      {skill}
                    </button>
                  )
                })}
              </div>
              <p className="mt-4 text-sm text-white/40">
                已选择 {selectedSkills.length} 个技能标签
              </p>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="recruit-count" className="text-white/72">
                  招募人数
                </Label>
                <Input
                  id="recruit-count"
                  name="recruitCount"
                  type="number"
                  min="1"
                  value={formData.recruitCount}
                  onChange={(event) =>
                    updateFormField("recruitCount", event.target.value)
                  }
                  placeholder="例如：4"
                  className="h-11 border-white/10 bg-[#05050B] text-white placeholder:text-white/30"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role-description" className="text-white/72">
                  角色描述
                </Label>
                <Input
                  id="role-description"
                  name="roleDescription"
                  value={formData.roleDescription}
                  onChange={(event) =>
                    updateFormField("roleDescription", event.target.value)
                  }
                  placeholder="例如：前端工程师、智能合约工程师、产品设计师"
                  className="h-11 border-white/10 bg-[#05050B] text-white placeholder:text-white/30"
                />
              </div>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="grid gap-4">
              {revenueRows.map((row, index) => (
                <div
                  key={row.id}
                  className="grid gap-3 rounded-xl border border-white/10 bg-[#05050B] p-4 lg:grid-cols-[1fr_1fr_120px_auto]"
                >
                  <div className="grid gap-2">
                    <Label
                      htmlFor={`role-name-${row.id}`}
                      className="text-white/72"
                    >
                      角色名称
                    </Label>
                    <Input
                      id={`role-name-${row.id}`}
                      value={row.roleName}
                      onChange={(event) =>
                        updateRevenueRow(
                          row.id,
                          "roleName",
                          event.target.value,
                        )
                      }
                      placeholder="前端负责人"
                      className="h-11 border-white/10 bg-[#10101A] text-white placeholder:text-white/30"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor={`contribution-type-${row.id}`}
                      className="text-white/72"
                    >
                      贡献类型
                    </Label>
                    <Input
                      id={`contribution-type-${row.id}`}
                      value={row.contributionType}
                      onChange={(event) =>
                        updateRevenueRow(
                          row.id,
                          "contributionType",
                          event.target.value,
                        )
                      }
                      placeholder="功能开发"
                      className="h-11 border-white/10 bg-[#10101A] text-white placeholder:text-white/30"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor={`share-ratio-${row.id}`}
                      className="text-white/72"
                    >
                      分成比例
                    </Label>
                    <Input
                      id={`share-ratio-${row.id}`}
                      type="number"
                      min="0"
                      max="100"
                      value={row.shareRatio}
                      onChange={(event) =>
                        updateRevenueRow(
                          row.id,
                          "shareRatio",
                          event.target.value,
                        )
                      }
                      placeholder="25"
                      className="h-11 border-white/10 bg-[#10101A] text-white placeholder:text-white/30"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-lg"
                      onClick={() => removeRevenueRow(row.id)}
                      disabled={revenueRows.length === 1}
                      aria-label={`删除第 ${index + 1} 行收益分配`}
                      className="border-white/10 bg-transparent text-white/58 hover:bg-white/8 hover:text-white"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addRevenueRow}
                className="h-11 w-full border-dashed border-[#6C63FF]/45 bg-transparent text-[#8D87FF] hover:bg-[#6C63FF]/10 hover:text-white"
              >
                <Plus className="size-4" aria-hidden="true" />
                添加一行收益分配
              </Button>
            </div>
          ) : null}
        </CardContent>

        <div className="flex items-center justify-between border-t border-white/10 px-6 py-5">
          <Button
            type="button"
            variant="outline"
            onClick={goPrevious}
            disabled={currentStep === 0 || isPublishing}
            className="h-11 border-white/10 bg-transparent px-5 text-white/70 hover:bg-white/8 hover:text-white"
          >
            上一步
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              type="button"
              onClick={goNext}
              disabled={isPublishing}
              className="h-11 bg-[#6C63FF] px-6 text-white hover:bg-[#5B54E8]"
            >
              下一步
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isPublishing}
              className="h-11 bg-[#6C63FF] px-6 text-white hover:bg-[#5B54E8]"
            >
              {isPublishing ? "发布中..." : "发布项目"}
            </Button>
          )}
        </div>
      </form>
    </Card>
  )
}
