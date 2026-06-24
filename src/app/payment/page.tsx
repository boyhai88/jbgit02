"use client"

import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"

type PlanType = "估值报告" | "优先推荐" | "企业版"

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

const plans: Array<{
  type: PlanType
  title: string
  price: string
  description: string
}> = [
  {
    type: "估值报告",
    title: "完整估值报告",
    price: "$19/月",
    description: "包含薪资建议、市场排名、技能分析",
  },
  {
    type: "优先推荐",
    title: "优先推荐",
    price: "$49/月",
    description: "项目匹配优先展示与推荐",
  },
  {
    type: "企业版",
    title: "企业版",
    price: "$199/月",
    description: "企业项目发布、团队协作与数据支持",
  },
]

export default function PaymentPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("估值报告")
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState("")
  const currentPlan = plans.find((plan) => plan.type === selectedPlan) ?? plans[0]

  async function handlePayment() {
    setError("")
    setPaying(true)

    try {
      await stripePromise

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan_type: selectedPlan,
        }),
      })
      const data = (await response.json()) as {
        url?: string
        error?: string
      }

      if (!response.ok || !data.url) {
        throw new Error(data.error || "创建 Stripe Checkout 失败")
      }

      window.location.href = data.url
    } catch (paymentError) {
      setPaying(false)
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "支付失败，请稍后重试",
      )
    }
  }

  return (
    <main className="min-h-screen bg-[#05050B] px-6 py-10 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-2xl items-center">
        <Card className="w-full rounded-2xl border-white/10 bg-[#10101A] py-0 text-white shadow-2xl shadow-black/30">
          <CardHeader className="p-6 pb-3">
            <CardTitle className="text-3xl font-black text-white">
              解锁完整估值报告
            </CardTitle>
            <CardDescription className="text-white/50">
              选择订阅方案，使用 Stripe Checkout 完成安全支付。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-6 pt-3">
            <div className="space-y-3">
              <Label className="text-white">订阅方案</Label>
              <div className="grid gap-3 md:grid-cols-3">
                {plans.map((plan) => {
                  const active = selectedPlan === plan.type

                  return (
                    <button
                      key={plan.type}
                      type="button"
                      onClick={() => setSelectedPlan(plan.type)}
                      className={`rounded-xl border p-4 text-left transition ${
                        active
                          ? "border-[#6C63FF] bg-[#6C63FF]/15"
                          : "border-white/10 bg-white/[0.03] hover:border-[#6C63FF]/45"
                      }`}
                    >
                      <p className="font-semibold text-white">{plan.title}</p>
                      <p className="mt-2 font-mono text-2xl font-bold text-white">
                        {plan.price}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-white/45">
                        {plan.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-xl border border-[#6C63FF]/30 bg-[#6C63FF]/10 p-5">
              <p className="text-sm text-white/55">支付方式</p>
              <p className="mt-2 text-xl font-bold text-white">信用卡支付</p>
              <p className="mt-2 text-sm leading-6 text-white/50">
                将跳转至 Stripe Checkout 页面完成支付。
              </p>
            </div>

            {error ? (
              <Alert className="border-red-500/35 bg-red-500/10 text-red-200">
                <AlertTitle>支付失败</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <Button
              type="button"
              disabled={paying}
              onClick={handlePayment}
              className="h-11 w-full bg-[#6C63FF] text-white hover:bg-[#5B54E8]"
            >
              {paying ? "正在跳转 Stripe..." : `立即支付 ${currentPlan.price}`}
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
