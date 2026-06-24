"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth/auth-provider"
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

const stacks = [
  "React",
  "TypeScript",
  "Python",
  "Rust",
  "Go",
  "Node.js",
  "Vue",
  "Java",
  "C++",
]

const skillHeat: Record<string, number> = {
  React: 88,
  TypeScript: 90,
  Python: 86,
  Rust: 84,
  Go: 80,
  "Node.js": 82,
  Vue: 76,
  Java: 78,
  "C++": 74,
}

const skillTrends: Record<string, string[]> = {
  React: ["前端高需求", "远程岗位多", "组件工程化", "AI 应用界面"],
  TypeScript: ["全栈增长", "大型项目偏好", "类型安全", "团队协作强"],
  Python: ["AI/ML 热门", "数据工程", "自动化", "后端稳定"],
  Rust: ["系统开发增长", "Web3", "高性能", "安全内存模型"],
  Go: ["云原生", "后端服务", "DevOps", "高并发"],
  "Node.js": ["全栈岗位", "API 服务", "实时应用", "生态成熟"],
  Vue: ["中后台需求", "上手快", "国内岗位稳定", "组件化"],
  Java: ["企业级稳定", "金融系统", "后端岗位多", "微服务"],
  "C++": ["高性能计算", "游戏引擎", "嵌入式", "底层系统"],
}

type ValuationResult = {
  score: number
  rank: number
  salaryMin: number
  salaryMax: number
  trendTags: string[]
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function calculateValuation(stack: string, yearsValue: string): ValuationResult {
  const years = clamp(Number(yearsValue) || 1, 1, 20)
  const heat = skillHeat[stack] ?? 75
  const experienceScore = Math.min(years * 2.2, 18)
  const score = Math.round(clamp(heat * 0.82 + experienceScore, 50, 98))
  const rank = Math.round(clamp(score - 15 + years * 0.8, 45, 96))
  const baseSalary = 9000 + heat * 150 + years * 1800
  const salaryMin = Math.round(baseSalary / 1000) * 1000
  const salaryMax = salaryMin + 9000 + Math.round(years / 2) * 1000

  return {
    score,
    rank,
    salaryMin,
    salaryMax,
    trendTags: skillTrends[stack] ?? ["市场稳定", "岗位活跃", "技能可迁移"],
  }
}

function formatCurrency(value: number) {
  return `¥${value.toLocaleString("zh-CN")}`
}

export default function SkillValuationPage() {
  const { loading, user } = useAuth()
  const router = useRouter()
  const [stack, setStack] = useState("React")
  const [years, setYears] = useState("3")
  const [result, setResult] = useState<ValuationResult | null>(null)
  const [loginMessage, setLoginMessage] = useState(false)
  const metadata = user?.user_metadata ?? {}
  const isSubscribed =
    metadata.is_subscribed === true ||
    metadata.subscribed === true ||
    metadata.subscription_status === "active"

  function handleValuation() {
    if (!loading && !user) {
      setResult(null)
      setLoginMessage(true)
      return
    }

    setLoginMessage(false)
    setResult(calculateValuation(stack, years))
  }

  function handleUnlockReport() {
    router.push("/payment?plan=skill-valuation")
  }

  return (
    <main className="min-h-screen bg-[#05050B] px-6 py-10 text-white">
      <section className="mx-auto w-full max-w-[980px]">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6C63FF]">
            JBGIT SKILL INTELLIGENCE
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-normal text-white">
            技能估值
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/50 md:text-base">
            AI驱动的技能市场公允价值
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <Card className="rounded-xl border-white/10 bg-[#10101A] py-0 text-white shadow-none">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-xl font-bold text-white">
                估值参数
              </CardTitle>
              <CardDescription className="text-white/45">
                选择技术栈和经验年限，生成技能市场参考价。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="stack" className="text-white">
                  技术栈
                </Label>
                <select
                  id="stack"
                  value={stack}
                  onChange={(event) => setStack(event.target.value)}
                  className="h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white outline-none transition focus:border-[#6C63FF] focus:ring-3 focus:ring-[#6C63FF]/20"
                >
                  {stacks.map((item) => (
                    <option key={item} value={item} className="bg-[#10101A]">
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="years" className="text-white">
                  经验年限
                </Label>
                <Input
                  id="years"
                  type="number"
                  min="1"
                  max="20"
                  value={years}
                  onChange={(event) => setYears(event.target.value)}
                  className="border-white/10 bg-black/20 text-white placeholder:text-white/35"
                />
              </div>

              <Button
                type="button"
                onClick={handleValuation}
                className="h-10 w-full bg-[#6C63FF] text-white hover:bg-[#5B54E8]"
              >
                开始估值
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-white/10 bg-[#10101A] py-0 text-white shadow-none">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-xl font-bold text-white">
                估值结果
              </CardTitle>
              <CardDescription className="text-white/45">
                完整估值报告 $19/月
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-4">
              {loginMessage || (!loading && !user) ? (
                <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-[#6C63FF]/35 bg-[#6C63FF]/10 text-sm font-medium text-white">
                  请登录查看技能估值
                </div>
              ) : loading ? (
                <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white/45">
                  正在读取登录状态...
                </div>
              ) : result && !isSubscribed ? (
                <div className="space-y-5">
                  <div className="rounded-xl border border-[#6C63FF]/35 bg-[#6C63FF]/10 p-6 text-center">
                    <p className="text-sm text-white/45">估值分数预览</p>
                    <p className="mt-3 font-mono text-5xl font-bold text-white">
                      {result.score}/100
                    </p>
                    <p className="mt-4 text-sm leading-6 text-white/58">
                      完整估值报告 $19/月，包含薪资建议、市场排名、技能分析
                    </p>
                    <Button
                      type="button"
                      onClick={handleUnlockReport}
                      className="mt-5 h-10 bg-[#6C63FF] px-6 text-white hover:bg-[#5B54E8]"
                    >
                      解锁完整报告
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 opacity-70">
                      <p className="text-sm text-white/45">市场排名</p>
                      <p className="mt-3 text-xl font-bold text-white/35">
                        订阅后查看
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 opacity-70">
                      <p className="text-sm text-white/45">建议薪资范围</p>
                      <p className="mt-3 text-xl font-bold text-white/35">
                        订阅后查看
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 opacity-70">
                      <p className="text-sm text-white/45">技能分析</p>
                      <p className="mt-3 text-xl font-bold text-white/35">
                        订阅后查看
                      </p>
                    </div>
                  </div>
                </div>
              ) : result ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                      <p className="text-sm text-white/45">估值分数</p>
                      <p className="mt-3 font-mono text-4xl font-bold text-white">
                        {result.score}/100
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                      <p className="text-sm text-white/45">市场排名</p>
                      <p className="mt-3 text-xl font-bold text-[#8D87FF]">
                        超过{result.rank}%的开发者
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                      <p className="text-sm text-white/45">建议薪资范围</p>
                      <p className="mt-3 text-xl font-bold text-emerald-300">
                        {formatCurrency(result.salaryMin)} -{" "}
                        {formatCurrency(result.salaryMax)}/月
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">
                          {stack} 技能热度趋势
                        </p>
                        <p className="mt-1 text-sm text-white/40">
                          基于 {clamp(Number(years) || 1, 1, 20)} 年经验的市场信号
                        </p>
                      </div>
                      <span className="rounded-full border border-[#6C63FF]/30 bg-[#6C63FF]/15 px-3 py-1 text-xs text-[#8D87FF]">
                        热度 {skillHeat[stack] ?? 75}
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {result.trendTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[#6C63FF]/30 bg-[#6C63FF]/16 px-3 py-1 text-xs text-[#8D87FF]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white/45">
                  点击“开始估值”查看技能市场价值
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
