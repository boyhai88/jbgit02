import { CheckCircle2, Handshake, ShieldCheck, Sparkles } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const values = ["透明", "公平", "协作", "成长"]

const stats = [
  { label: "注册开发者", value: "128,400+" },
  { label: "已完成项目", value: "18,920" },
  { label: "总交易额", value: "$42.6M" },
]

const reasons = [
  {
    title: "AI匹配",
    description:
      "基于技能标签、项目阶段、协作记录与交付偏好，为开发者和项目方推荐更合适的合作机会。",
    icon: Sparkles,
  },
  {
    title: "透明分成",
    description:
      "项目按工序拆分责任与收益比例，成员在加入前即可了解贡献范围、分成方式和审核流程。",
    icon: Handshake,
  },
  {
    title: "信誉体系",
    description:
      "通过申请记录、交付质量、协作评价和项目履历沉淀可信身份，让优秀贡献被持续看见。",
    icon: CheckCircle2,
  },
  {
    title: "安全保障",
    description:
      "平台围绕身份认证、权限控制、数据保护和操作审计构建安全边界，降低远程协作风险。",
    icon: ShieldCheck,
  },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#05050B] px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl border border-white/10 bg-[#10101A] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8D87FF]">
            About JBGIT
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-normal md:text-5xl">
            关于我们
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-gray-300 md:text-lg">
            JBGIT 是面向全球开发者、远程团队与项目方的协作平台。我们相信，优秀的技术能力不应被地域、组织边界或信息差限制，每一次代码贡献都应该获得清晰、可衡量、可持续的价值回报。
          </p>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <Card className="border-white/10 bg-[#10101A] text-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold">使命</CardTitle>
            </CardHeader>
            <CardContent className="text-base leading-7 text-gray-300">
              让全球开发者通过协作创造价值。我们帮助开发者找到值得投入的项目，也帮助项目方组建可靠、透明、高效的远程协作团队。
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#10101A] text-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold">愿景</CardTitle>
            </CardHeader>
            <CardContent className="text-base leading-7 text-gray-300">
              成为全球最大的开发者协作与技能变现平台，让技能、信誉与收益形成正向循环，推动更多优秀产品被共同创造。
            </CardContent>
          </Card>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <Card className="border-white/10 bg-[#10101A] text-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold">价值观</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {values.map((value) => (
                  <div
                    key={value}
                    className="rounded-2xl border border-[#6C63FF]/25 bg-[#6C63FF]/12 px-4 py-5 text-center font-semibold text-[#B8B4FF]"
                  >
                    {value}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#10101A] text-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold">平台数据</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                  >
                    <p className="font-mono text-3xl font-bold text-[#8D87FF]">
                      {item.value}
                    </p>
                    <p className="mt-2 text-sm text-gray-400">{item.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <Card className="mt-8 border-white/10 bg-[#10101A] text-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold">团队理念</CardTitle>
          </CardHeader>
          <CardContent className="text-base leading-8 text-gray-300">
            开发者共建，利益共享。JBGIT 鼓励项目发起人与贡献者在清晰的规则下协作：项目被拆解为可交付的工序，贡献被记录为可追踪的成果，收益按照事先约定的比例进行分配。我们希望平台不只是任务市场，更是长期信誉、技能资产与商业机会的连接网络。
          </CardContent>
        </Card>

        <section className="mt-8">
          <h2 className="text-2xl font-bold">为什么选择JBGIT</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {reasons.map((reason) => {
              const Icon = reason.icon

              return (
                <Card
                  key={reason.title}
                  className="border-white/10 bg-[#10101A] text-white"
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-[#6C63FF]/18 text-[#8D87FF]">
                        <Icon className="size-5" aria-hidden="true" />
                      </div>
                      <CardTitle className="text-lg font-bold">
                        {reason.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="leading-7 text-gray-300">
                    {reason.description}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
