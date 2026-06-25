import { NextResponse } from "next/server"

const TEST_EMAIL = "zhanghaiopenclaw@gmail.com"

export async function GET() {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "RESEND_API_KEY 未配置",
      },
      { status: 500 },
    )
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "onboarding@resend.dev",
      to: [TEST_EMAIL],
      subject: "JBGIT 邮件测试",
      html: "<p>这是一封测试邮件</p>",
      text: "这是一封测试邮件",
    }),
  })

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    return NextResponse.json(
      {
        error: "邮件发送失败",
        result,
      },
      { status: 500 },
    )
  }

  return NextResponse.json({
    message: "测试邮件已发送",
    result,
  })
}
