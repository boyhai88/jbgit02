type EmailSendResult = {
  ok: boolean
  skipped?: boolean
  id?: string
  error?: string
}

type SendEmailInput = {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

type ApplicationSubmittedInput = {
  ownerEmail: string
  projectName: string
  applicantEmail: string
  phaseName?: string
  projectUrl?: string
}

type ApplicationReviewedInput = {
  applicantEmail: string
  projectName: string
  status: string
  phaseName?: string
  projectUrl?: string
}

type ReviewNotificationInput = {
  recipientEmail: string
  projectName: string
  reviewerEmail: string
  rating: number
  category: string
  projectUrl?: string
}

type MilestoneUpdatedInput = {
  recipientEmail: string | string[]
  projectName: string
  milestoneTitle: string
  status: string
  projectUrl?: string
}

const resendApiUrl = "https://api.resend.com/emails"
const defaultFrom = "JBGIT <notifications@jbgit.dev>"

function getFromAddress() {
  return process.env.RESEND_FROM_EMAIL || defaultFrom
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001"
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function buildActionLink(pathOrUrl?: string) {
  if (!pathOrUrl) {
    return `${getSiteUrl()}/dashboard`
  }

  if (pathOrUrl.startsWith("http")) {
    return pathOrUrl
  }

  return `${getSiteUrl()}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`
}

function emailLayout(title: string, content: string, actionUrl?: string) {
  const link = actionUrl ? buildActionLink(actionUrl) : undefined

  return `
    <div style="margin:0;padding:32px;background:#05050B;color:#ffffff;font-family:Arial,'Microsoft YaHei',sans-serif;">
      <div style="max-width:640px;margin:0 auto;border:1px solid rgba(255,255,255,0.10);border-radius:18px;background:#10101A;overflow:hidden;">
        <div style="padding:28px 28px 18px;border-bottom:1px solid rgba(255,255,255,0.10);">
          <div style="display:inline-block;padding:8px 10px;border-radius:10px;background:#6C63FF;color:#ffffff;font-weight:700;font-size:12px;">JBGIT</div>
          <h1 style="margin:18px 0 0;font-size:24px;line-height:1.35;color:#ffffff;">${escapeHtml(title)}</h1>
        </div>
        <div style="padding:26px 28px;color:#D1D5DB;font-size:15px;line-height:1.8;">
          ${content}
          ${
            link
              ? `<p style="margin-top:24px;"><a href="${escapeHtml(link)}" style="display:inline-block;border-radius:10px;background:#6C63FF;color:#ffffff;text-decoration:none;padding:11px 16px;font-weight:700;">查看详情</a></p>`
              : ""
          }
        </div>
        <div style="padding:18px 28px;border-top:1px solid rgba(255,255,255,0.10);color:#8B8B99;font-size:12px;">
          这是一封来自 JBGIT 的系统通知邮件。
        </div>
      </div>
    </div>
  `
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailInput): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.warn("RESEND_API_KEY 未配置，邮件已跳过发送:", subject)
    return {
      ok: true,
      skipped: true,
    }
  }

  try {
    const response = await fetch(resendApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getFromAddress(),
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      }),
    })

    const data = (await response.json().catch(() => ({}))) as {
      id?: string
      message?: string
      error?: string
    }

    if (!response.ok) {
      const error = data.message || data.error || `邮件发送失败: ${response.status}`
      console.error("邮件发送失败:", error)

      return {
        ok: false,
        error,
      }
    }

    return {
      ok: true,
      id: data.id,
    }
  } catch (error) {
    console.error("邮件发送异常:", error)

    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export function sendApplicationSubmittedEmail({
  ownerEmail,
  projectName,
  applicantEmail,
  phaseName,
  projectUrl,
}: ApplicationSubmittedInput) {
  const safeProjectName = escapeHtml(projectName)
  const safeApplicantEmail = escapeHtml(applicantEmail)
  const safePhaseName = phaseName ? escapeHtml(phaseName) : "项目"

  return sendEmail({
    to: ownerEmail,
    subject: `新的项目申请：${projectName}`,
    html: emailLayout(
      "你收到了新的项目申请",
      `
        <p>项目 <strong style="color:#ffffff;">${safeProjectName}</strong> 收到一条新的申请。</p>
        <p>申请人：<strong style="color:#ffffff;">${safeApplicantEmail}</strong></p>
        <p>申请工序：<strong style="color:#ffffff;">${safePhaseName}</strong></p>
        <p>请进入项目详情页查看申请人信息，并及时完成审核。</p>
      `,
      projectUrl,
    ),
    text: `项目 ${projectName} 收到来自 ${applicantEmail} 的申请。`,
  })
}

export function sendApplicationReviewedEmail({
  applicantEmail,
  projectName,
  status,
  phaseName,
  projectUrl,
}: ApplicationReviewedInput) {
  const safeProjectName = escapeHtml(projectName)
  const safeStatus = escapeHtml(status)
  const safePhaseName = phaseName ? escapeHtml(phaseName) : "项目"

  return sendEmail({
    to: applicantEmail,
    subject: `申请审核结果：${projectName}`,
    html: emailLayout(
      "你的申请状态已更新",
      `
        <p>你申请的项目 <strong style="color:#ffffff;">${safeProjectName}</strong> 已完成审核。</p>
        <p>申请工序：<strong style="color:#ffffff;">${safePhaseName}</strong></p>
        <p>当前状态：<strong style="color:#ffffff;">${safeStatus}</strong></p>
      `,
      projectUrl,
    ),
    text: `你在项目 ${projectName} 的申请状态已更新为：${status}。`,
  })
}

export function sendReviewNotificationEmail({
  recipientEmail,
  projectName,
  reviewerEmail,
  rating,
  category,
  projectUrl,
}: ReviewNotificationInput) {
  const safeProjectName = escapeHtml(projectName)
  const safeReviewerEmail = escapeHtml(reviewerEmail)
  const safeCategory = escapeHtml(category)

  return sendEmail({
    to: recipientEmail,
    subject: `你收到了新的项目评价：${projectName}`,
    html: emailLayout(
      "你收到了新的评价",
      `
        <p>项目 <strong style="color:#ffffff;">${safeProjectName}</strong> 有一条与你相关的新评价。</p>
        <p>评价人：<strong style="color:#ffffff;">${safeReviewerEmail}</strong></p>
        <p>评分：<strong style="color:#ffffff;">${rating}/5</strong></p>
        <p>分类：<strong style="color:#ffffff;">${safeCategory}</strong></p>
      `,
      projectUrl,
    ),
    text: `你在项目 ${projectName} 收到新的评价，评分 ${rating}/5。`,
  })
}

export function sendMilestoneUpdatedEmail({
  recipientEmail,
  projectName,
  milestoneTitle,
  status,
  projectUrl,
}: MilestoneUpdatedInput) {
  const safeProjectName = escapeHtml(projectName)
  const safeMilestoneTitle = escapeHtml(milestoneTitle)
  const safeStatus = escapeHtml(status)

  return sendEmail({
    to: recipientEmail,
    subject: `里程碑更新：${projectName}`,
    html: emailLayout(
      "项目里程碑已更新",
      `
        <p>项目 <strong style="color:#ffffff;">${safeProjectName}</strong> 的里程碑有新的状态变化。</p>
        <p>里程碑：<strong style="color:#ffffff;">${safeMilestoneTitle}</strong></p>
        <p>当前状态：<strong style="color:#ffffff;">${safeStatus}</strong></p>
      `,
      projectUrl,
    ),
    text: `项目 ${projectName} 的里程碑 ${milestoneTitle} 已更新为：${status}。`,
  })
}
