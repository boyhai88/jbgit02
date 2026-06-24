// 🔴 强制重新编译 - 2026-06-21 00:35
console.log("✅ Stripe Webhook 路由已加载")

import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import Stripe from "stripe"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    console.log("Webhook 开始处理")

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log("webhookSecret 是否存在:", Boolean(webhookSecret))

    if (!stripeSecretKey || !webhookSecret) {
      console.error("Stripe 环境变量缺失:", {
        hasStripeSecretKey: Boolean(stripeSecretKey),
        hasWebhookSecret: Boolean(webhookSecret),
      })

      return NextResponse.json(
        { error: "Missing Stripe webhook environment variables" },
        { status: 500 },
      )
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase 环境变量缺失:", {
        hasSupabaseUrl: Boolean(supabaseUrl),
        hasServiceRoleKey: Boolean(supabaseServiceKey),
      })

      return NextResponse.json(
        { error: "Missing Supabase service environment variables" },
        { status: 500 },
      )
    }

    const signature = request.headers.get("stripe-signature")
    console.log("signature 是否存在:", Boolean(signature))

    if (!signature) {
      console.error("Stripe Webhook 缺少 stripe-signature 请求头")

      return NextResponse.json(
        { error: "Missing Stripe signature" },
        { status: 500 },
      )
    }

    const rawBody = await request.text()
    console.log("raw body 长度:", rawBody.length)
    console.log("Webhook raw body 前100字符:", rawBody.slice(0, 100))

    const stripe = new Stripe(stripeSecretKey)
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
      console.log("签名验证通过")
    } catch (error) {
      console.error("签名验证失败:", error)

      return NextResponse.json(
        { error: "Invalid Stripe webhook signature" },
        { status: 500 },
      )
    }

    console.log("事件类型:", event.type)

    if (event.type !== "checkout.session.completed") {
      console.log("非 checkout.session.completed 事件，跳过处理")

      return NextResponse.json({ received: true }, { status: 200 })
    }

    const session = event.data.object as Stripe.Checkout.Session
    const customerEmail =
      session.customer_email || session.customer_details?.email || null
    const planType = session.metadata?.plan_type || "估值报告"

    console.log("customerEmail:", customerEmail)
    console.log("planType:", planType)

    if (!customerEmail) {
      console.error("checkout.session.completed 缺少 customer_email")

      return NextResponse.json(
        { error: "Missing customer email" },
        { status: 500 },
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log("开始查询 public.users 用户:", customerEmail)
    const { data: matchedUser, error: userLookupError } = await supabase
      .from("users")
      .select("id")
      .eq("email", customerEmail)
      .maybeSingle()

    console.log("查询用户结果:", { matchedUser, userLookupError })

    if (userLookupError) {
      console.error("查询 public.users 失败:", userLookupError)

      return NextResponse.json(
        { error: userLookupError.message },
        { status: 500 },
      )
    }

    const userId = matchedUser?.id

    if (!userId) {
      console.error("未找到 Stripe customerEmail 对应用户:", customerEmail)

      return NextResponse.json(
        { error: "User not found for Stripe customer email" },
        { status: 500 },
      )
    }

    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + 1)

    console.log("准备更新订阅:", {
      userId,
      planType,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    })

    const { data: subscriptionData, error: upsertError } = await supabase
      .from("user_subscriptions")
      .upsert(
        {
          user_id: userId,
          plan_type: planType,
          status: "active",
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        },
        {
          onConflict: "user_id, plan_type",
        },
      )
      .select("*")

    console.log("订阅更新完成:", { subscriptionData, upsertError })

    if (upsertError) {
      console.error("更新 user_subscriptions 失败:", upsertError)
      console.error("upsertError 完整内容:", {
        message: upsertError.message,
        code: upsertError.code,
        details: upsertError.details,
        hint: upsertError.hint,
      })

      return NextResponse.json(
        { error: upsertError.message },
        { status: 500 },
      )
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error("Webhook 错误:", error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
