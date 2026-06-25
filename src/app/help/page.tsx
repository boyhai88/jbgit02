import { BookOpen, CircleDollarSign, ClipboardCheck, Layers3, Star } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const helpSections = [
  {
    title: "快速入门",
    icon: BookOpen,
    items: [
      {
        question: "注册登录",
        answer:
          "使用邮箱密码或 Google 账号创建 JBGIT 账户。登录后，平台会根据你的身份展示个人资料、申请记录、项目进度和收益信息。",
      },
      {
        question: "完善资料",
        answer:
          "建议补充技能标签、项目经验、GitHub 主页和可协作时间。资料越完整，AI 匹配越容易把你推荐给合适的项目方。",
      },
      {
        question: "发布项目",
        answer:
          "项目方可以填写项目名称、描述、预算、技能要求和工序分配。发布前请确保描述完整、工序分成清晰且总比例合理。",
      },
    ],
  },
  {
    title: "项目相关",
    icon: ClipboardCheck,
    items: [
      {
        question: "如何发布项目",
        answer:
          "进入项目市场，点击“发布项目”，填写项目基本信息、预算、技能标签和工序配置。提交后项目会进入招募状态。",
      },
      {
        question: "如何申请项目",
        answer:
          "打开项目详情页，查看项目说明、工序、收益分配和里程碑。选择适合自己的工序后提交申请，等待项目方审核。",
      },
      {
        question: "如何审核申请",
        answer:
          "项目所有者可在项目详情页查看工序申请人列表，对每个申请执行通过或拒绝。通过后对应工序人数会自动更新。",
      },
    ],
  },
  {
    title: "工序相关",
    icon: Layers3,
    items: [
      {
        question: "什么是工序",
        answer:
          "工序是项目中的可交付工作单元，例如前端页面开发、后端 API、测试、文档或部署。每个工序可设置招募人数和分成比例。",
      },
      {
        question: "如何拆分工序",
        answer:
          "建议按交付边界拆分：目标清晰、验收标准明确、依赖关系可控。复杂项目可先使用 AI 自动拆分，再由项目方人工调整。",
      },
      {
        question: "如何申请工序",
        answer:
          "在项目详情页的工序卡片中点击“申请加入”。如果工序已满或你已申请过，系统会提示当前状态，避免重复提交。",
      },
    ],
  },
  {
    title: "收益相关",
    icon: CircleDollarSign,
    items: [
      {
        question: "如何计算分成",
        answer:
          "项目收益以工序分成比例为基础，结合实际交付和项目规则执行。建议项目发布前确保各工序分成总和为 100%。",
      },
      {
        question: "如何提现",
        answer:
          "收益结算功能会根据账户状态、项目完成情况和平台规则开放。提现前请确认账户信息、身份验证和收款方式准确。",
      },
      {
        question: "收益到账时间",
        answer:
          "通常在项目验收、争议期结束和结算确认后进入到账流程。具体时间会受到支付渠道、地区和合规审核影响。",
      },
    ],
  },
  {
    title: "评价相关",
    icon: Star,
    items: [
      {
        question: "如何评价",
        answer:
          "项目参与者可在项目详情页发表评价，选择评分、分类并填写评语。评价提交后进入审核，审核通过后公开显示。",
      },
      {
        question: "评价有什么用",
        answer:
          "评价会沉淀为开发者和项目方的信誉资产，帮助后续匹配、申请审核和合作决策更加透明。",
      },
      {
        question: "如何查看评价",
        answer:
          "项目详情页会展示已通过审核的评价。个人维度的综合评价能力将逐步在资料页和信誉体系中呈现。",
      },
    ],
  },
]

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[#05050B] px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl border border-white/10 bg-[#10101A] p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8D87FF]">
            Help Center
          </p>
          <h1 className="mt-4 text-4xl font-black md:text-5xl">帮助中心</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-gray-300 md:text-lg">
            这里汇总了 JBGIT 的核心使用流程。无论你是第一次加入平台的开发者，还是正在招募协作者的项目方，都可以从这里快速了解注册、发布、申请、审核、分成和评价规则。
          </p>
        </section>

        <section className="mt-8 grid gap-5">
          {helpSections.map((section) => {
            const Icon = section.icon

            return (
              <Card
                key={section.title}
                className="border-white/10 bg-[#10101A] text-white"
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-[#6C63FF]/18 text-[#8D87FF]">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-xl font-bold">
                      {section.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {section.items.map((item) => (
                      <div
                        key={item.question}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                      >
                        <h2 className="text-base font-semibold text-white">
                          {item.question}
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-gray-300">
                          {item.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>
      </div>
    </main>
  )
}
