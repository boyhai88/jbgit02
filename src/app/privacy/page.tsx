import { Database, Eye, FileCheck2, LockKeyhole, Mail, Share2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const sections = [
  {
    title: "信息收集",
    icon: Database,
    content:
      "我们会收集你在注册和使用服务过程中主动提供的信息，包括邮箱、显示名称、技能标签、项目经历、申请记录、评价内容和企业信息。为了保障平台稳定运行，我们也可能记录必要的使用数据、日志信息、设备信息、浏览器类型、访问时间和安全事件。",
  },
  {
    title: "信息使用",
    icon: Eye,
    content:
      "收集的信息将用于提供账号认证、项目发布、工序申请、收益分配、评价展示、通知提醒和客户支持等服务。我们也会基于匿名或聚合数据优化产品体验、改进 AI 匹配效果、识别异常行为并提升平台安全性。",
  },
  {
    title: "信息共享",
    icon: Share2,
    content:
      "我们不会出售你的个人信息。仅在提供必要第三方服务、满足法律法规要求、保护平台与用户合法权益，或获得用户明确同意的情况下共享有限信息。与第三方服务合作时，我们会尽量要求其遵守合理的数据保护义务。",
  },
  {
    title: "数据安全",
    icon: LockKeyhole,
    content:
      "JBGIT 通过加密传输、访问控制、权限隔离、操作日志和定期审计等措施保护数据安全。我们会持续改进安全机制，但互联网服务无法保证绝对安全，因此也建议用户妥善保管账号密码并开启必要的安全设置。",
  },
  {
    title: "用户权利",
    icon: FileCheck2,
    content:
      "你有权访问、修改、删除或导出与自己相关的个人信息，也可以请求注销账户或撤回部分授权。部分信息因交易记录、合规要求或争议处理需要，可能会在合理期限内保留。我们会在可行范围内响应你的权利请求。",
  },
  {
    title: "联系方式",
    icon: Mail,
    content:
      "如果你对隐私政策、数据处理方式或个人信息权利有任何疑问，请通过 hello@jbgit.dev 联系我们。收到请求后，我们会尽快核实身份并在合理时间内处理。",
  },
]

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#05050B] px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-3xl border border-white/10 bg-[#10101A] p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8D87FF]">
            Privacy Policy
          </p>
          <h1 className="mt-4 text-4xl font-black md:text-5xl">隐私政策</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-gray-300 md:text-lg">
            我们重视每一位用户的数据权益。本政策说明 JBGIT 如何收集、使用、共享和保护信息，以及你可以如何管理自己的个人数据。
          </p>
          <p className="mt-4 text-sm text-gray-500">最后更新：2026年6月26日</p>
        </section>

        <section className="mt-8 grid gap-5">
          {sections.map((section) => {
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
                <CardContent className="text-base leading-8 text-gray-300">
                  {section.content}
                </CardContent>
              </Card>
            )
          })}
        </section>
      </div>
    </main>
  )
}
