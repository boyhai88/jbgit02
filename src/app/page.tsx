"use client"

import { BrainCircuit, CircleDollarSign, FolderKanban } from "lucide-react"
import Link from "next/link"

import { useAuth } from "@/components/auth/auth-provider"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Footer } from "@/components/footer"
import { cn } from "@/lib/utils"

const platformStats = [
  { value: "128,400+", label: "注册开发者" },
  { value: "18,920", label: "已完成项目" },
  { value: "$42.6M", label: "总交易额" },
]

const features = [
  {
    title: "智能匹配",
    description:
      "基于技能图谱与项目需求的AI匹配引擎，自动推荐最适合你的协作机会，减少沟通成本。",
    icon: BrainCircuit,
  },
  {
    title: "项目协作",
    description:
      "内置代码审查、任务看板、实时沟通与版本追踪，让远程团队保持高效同步。",
    icon: FolderKanban,
  },
  {
    title: "收益分成",
    description:
      "透明的收益分配方案，按贡献自动结算，保障每位成员的长期权益。",
    icon: CircleDollarSign,
  },
]

export default function Home() {
  const { user } = useAuth()
  const joinHref = user ? "/dashboard" : "/auth/login"

  return (
    <main className="min-h-screen bg-[#05050B] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_84%_0%,rgba(108,99,255,0.2),transparent_30rem)]">
        <div className="mx-auto w-full max-w-[980px] px-6 py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/38">
            GLOBAL DEVELOPER PLATFORM
          </p>
          <h1 className="mt-5 max-w-[680px] text-4xl font-black leading-tight tracking-normal md:text-5xl">
            连接全球开发者，让技能创造价值
          </h1>
          <p className="mt-5 max-w-[680px] text-base leading-7 text-white/58">
            JBGIT是面向独立开发者与远程团队的协作平台。智能匹配技能、透明收益分成，让每一次代码贡献都获得应有回报。
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={joinHref}
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 rounded-lg bg-[#6C63FF] px-6 text-white shadow-[0_14px_34px_rgba(108,99,255,0.28)] hover:bg-[#5B54E8]",
              )}
            >
              立即加入
            </Link>
            <Link
              href="/projects"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "h-11 rounded-lg border-white/15 bg-transparent px-6 text-white/82 hover:bg-white/8 hover:text-white",
              )}
            >
              浏览项目
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#0B0B12]">
        <div className="mx-auto grid w-full max-w-[980px] grid-cols-1 gap-4 px-6 py-8 text-center sm:grid-cols-3">
          {platformStats.map((stat) => (
            <Card
              key={stat.label}
              className="rounded-xl border-white/10 bg-[#11111D] py-0 text-white shadow-none"
            >
              <CardContent className="p-5">
                <div className="font-mono text-3xl font-semibold text-[#6C63FF]">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-white/45">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[980px] px-6 py-10">
        <div className="mb-6">
          <h2 className="text-2xl font-black tracking-normal text-white">
            三大核心功能
          </h2>
          <p className="mt-2 text-sm text-white/45">
            从发现机会到协作交付，JBGIT覆盖开发者技能变现的完整流程。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon

            return (
              <Card
                key={feature.title}
                className="rounded-xl border-white/10 bg-[#10101A] py-0 text-white shadow-none"
              >
                <CardHeader className="p-5">
                  <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-[#6C63FF]/18 text-[#8D87FF]">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-lg font-bold text-white">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="pt-2 text-sm leading-6 text-white/48">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[980px] px-6 pb-12">
        <Card className="rounded-xl border-white/10 bg-[#151426] py-0 text-white shadow-none">
          <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-normal">
                准备好让技能产生价值了吗？
              </h2>
              <p className="mt-2 text-sm text-white/45">
                加入12万+全球开发者，开启你的第一个协作项目
              </p>
            </div>
            <Link
              href={joinHref}
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 shrink-0 rounded-lg bg-[#6C63FF] px-7 text-white hover:bg-[#5B54E8]",
              )}
            >
              立即加入
            </Link>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </main>
  )
}
