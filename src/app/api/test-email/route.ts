import { NextResponse } from "next/server"

import { sendEmail } from "@/lib/email"

export async function GET() {
  const to = process.env.TEST_EMAIL_TO || process.env.RESEND_TEST_EMAIL

  if (!to) {
    return NextResponse.json(
      {
        error: "请先配置 TEST_EMAIL_TO 或 RESEND_TEST_EMAIL 环境变量",
      },
      { status: 400 },
    )
  }

  const result = await sendEmail({
    to,
    subject: "JBGIT 邮件测试",
    html: "<p>这是一封测试邮件</p>",
    text: "这是一封测试邮件",
  })

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error || "邮件发送失败",
      },
      { status: 500 },
    )
  }

  return NextResponse.json({
    message: result.skipped ? "邮件服务未配置，已跳过发送" : "测试邮件已发送",
    result,
  })
}
