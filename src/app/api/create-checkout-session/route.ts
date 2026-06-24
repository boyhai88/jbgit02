import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

type PlanType = "估值报告" | "优先推荐" | "企业版"

const plans: Record<
  PlanType,
  {
    name: string
    amount: number
    description: string
  }
> = {
  估值报告: {
    name: "完整估值报告",
    amount: 1900,
    description: "包含薪资建议、市场排名、技能分析",
  },
  优先推荐: {
    name: "优先推荐",
    amount: 4900,
    description: "项目匹配优先展示与推荐",
  },
  企业版: {
    name: "企业版",
    amount: 19900,
    description: "企业项目发布、团队协作与数据支持",
  },
}

export async function POST(request: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY

  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "缺少 STRIPE_SECRET_KEY 环境变量" },
      { status: 500 },
    )
  }

  const { plan_type } = (await request.json()) as { plan_type?: PlanType }
  const selectedPlan = plan_type && plan_type in plans ? plan_type : null
  const plan = selectedPlan ? plans[selectedPlan] : null

  if (!plan) {
    return NextResponse.json({ error: "无效的订阅方案" }, { status: 400 })
  }

  const stripe = new Stripe(stripeSecretKey)
  const origin = request.nextUrl.origin
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          recurring: {
            interval: "month",
          },
          product_data: {
            name: plan.name,
            description: plan.description,
          },
          unit_amount: plan.amount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      plan_type: selectedPlan,
    },
    success_url: `${origin}/skills/valuation?payment=success`,
    cancel_url: `${origin}/payment?payment=cancelled`,
  })

  return NextResponse.json({ url: session.url })
}
