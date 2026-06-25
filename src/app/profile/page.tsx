import {
  Award,
  Bell,
  Code2,
  CreditCard,
  KeyRound,
  Mail,
  Medal,
  Save,
  ShieldCheck,
  Star,
  Trophy,
  UserRound,
} from "lucide-react"
import { revalidatePath } from "next/cache"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

type Metadata = Record<string, unknown>

type ProfileRow = {
  skills?: string[] | string | null
}

const presetSkills = [
  "React",
  "TypeScript",
  "Python",
  "Rust",
  "Solidity",
  "AI/ML",
  "DevOps",
  "Next.js",
  "Node.js",
  "Web3",
  "Go",
  "Java",
  "C++",
  "Vue",
  "Angular",
]

const joinedProjects = [
  {
    id: "PR3-001",
    name: "开源 AI 代码审查助手",
    role: "前端开发",
    status: "进行中",
    contribution: "Dashboard UI 与代码审查工作流",
  },
  {
    id: "PR3-004",
    name: "开发者文档搜索引擎",
    role: "协作者",
    status: "招募中",
    contribution: "VS Code 插件集成",
  },
  {
    id: "PR3-006",
    name: "NFT 创作者工具套件",
    role: "顾问",
    status: "即将开始",
    contribution: "链上数据分析",
  },
]

const settings = [
  {
    title: "登录与安全",
    description: "管理密码、OAuth 登录和账户保护选项",
    icon: ShieldCheck,
  },
  {
    title: "通知偏好",
    description: "设置项目邀请、收益结算和协作消息提醒",
    icon: Bell,
  },
  {
    title: "支付与收益",
    description: "维护收款方式，查看收益分成记录",
    icon: CreditCard,
  },
  {
    title: "API 访问",
    description: "创建访问令牌，用于自动化协作流程",
    icon: KeyRound,
  },
]

const defaultBadges = ["可信协作者", "快速响应", "高质量交付", "项目推进者"]

async function updateSkills(formData: FormData) {
  "use server"

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return
  }

  const selectedSkills = formData
    .getAll("skills")
    .map(String)
    .filter((skill) => presetSkills.includes(skill))

  await supabase
    .from("profiles")
    .upsert({ id: user.id, skills: selectedSkills }, { onConflict: "id" })

  revalidatePath("/profile")
}

function getMetadataString(metadata: Metadata, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key]

    if (typeof value === "string" && value.trim().length > 0) {
      return value
    }
  }

  return undefined
}

function getMetadataNumber(metadata: Metadata, keys: string[], fallback: number) {
  for (const key of keys) {
    const value = metadata[key]

    if (typeof value === "number" && Number.isFinite(value)) {
      return value
    }

    if (typeof value === "string") {
      const parsed = Number(value)

      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return fallback
}

function getMetadataBadges(metadata: Metadata) {
  const value = metadata.badges

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string")
  }

  return defaultBadges
}

function getSkills(skills: ProfileRow["skills"]) {
  if (Array.isArray(skills)) {
    return skills.map(String).filter(Boolean)
  }

  if (typeof skills === "string") {
    try {
      const parsed = JSON.parse(skills)
      return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [skills]
    } catch {
      return skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
    }
  }

  return []
}

function getReputationLevel(reputation: number) {
  if (reputation > 1000) {
    return "钻石"
  }

  if (reputation >= 601) {
    return "铂金"
  }

  if (reputation >= 301) {
    return "黄金"
  }

  if (reputation >= 101) {
    return "白银"
  }

  return "青铜"
}

function getInitial(displayName: string, email: string) {
  return (displayName || email || "U").trim().charAt(0).toUpperCase()
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("skills")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null }

  const metadata = (user?.user_metadata ?? {}) as Metadata
  const email = user?.email ?? "未登录"
  const displayName =
    getMetadataString(metadata, ["full_name", "name", "display_name"]) ??
    user?.email?.split("@")[0] ??
    "JBGIT 用户"
  const avatarUrl = getMetadataString(metadata, ["avatar_url", "picture"])
  const reputation = user
    ? getMetadataNumber(metadata, ["reputation", "reputation_score"], 386)
    : 0
  const reputationLevel = getReputationLevel(reputation)
  const badges = user ? getMetadataBadges(metadata) : []
  const skills = getSkills((profile as ProfileRow | null)?.skills)
  const initial = getInitial(displayName, user?.email ?? "")

  return (
    <main className="min-h-screen bg-[#05050B] text-white">
      <section className="mx-auto grid w-full max-w-[960px] gap-6 px-6 py-8 lg:grid-cols-[340px_1fr]">
        <div className="grid gap-6">
          <Card className="rounded-xl border-white/10 bg-[#10101A] py-0 text-white shadow-none">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="size-16 border border-[#6C63FF]/45 bg-[#6C63FF]">
                  <AvatarImage src={avatarUrl} alt={`${displayName} 头像`} />
                  <AvatarFallback className="bg-[#6C63FF] text-xl font-bold text-white">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-white">{displayName}</p>
                  <p className="mt-2 flex items-center gap-2 truncate text-sm text-white/50">
                    <Mail className="size-4 shrink-0" aria-hidden="true" />
                    {email}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
                <div className="rounded-lg bg-white/5 p-4">
                  <p className="font-mono text-2xl text-[#8D87FF]">
                    {user ? joinedProjects.length : 0}
                  </p>
                  <p className="mt-1 text-xs text-white/45">参与项目</p>
                </div>
                <div className="rounded-lg bg-white/5 p-4">
                  <p className="font-mono text-2xl text-emerald-400">
                    {user ? "92%" : "--"}
                  </p>
                  <p className="mt-1 text-xs text-white/45">协作完成率</p>
                </div>
              </div>

              {!user ? (
                <div className="mt-5 rounded-lg border border-[#6C63FF]/25 bg-[#6C63FF]/10 p-4">
                  <p className="text-sm leading-6 text-white/68">
                    登录后可查看真实个人资料、项目信誉、协作记录和账户设置。
                  </p>
                  <Link
                    href="/auth/login"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "mt-4 h-10 rounded-lg bg-[#6C63FF] px-4 text-white hover:bg-[#5B54E8]",
                    )}
                  >
                    登录账户
                  </Link>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-xl border-white/10 bg-[#10101A] py-0 text-white shadow-none">
            <CardHeader className="p-6 pb-3">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
                <Trophy className="size-5 text-[#8D87FF]" aria-hidden="true" />
                信誉体系
              </CardTitle>
              <CardDescription className="text-white/45">
                信誉分由项目交付、协作评价、响应速度和历史贡献综合计算
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <div className="rounded-xl border border-[#6C63FF]/25 bg-[#6C63FF]/10 p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-white/50">用户信誉分</p>
                    <p className="mt-2 font-mono text-4xl font-bold text-white">
                      {reputation}
                    </p>
                  </div>
                  <div className="rounded-full border border-[#6C63FF]/40 bg-[#6C63FF]/20 px-4 py-2 text-sm font-semibold text-[#C8C5FF]">
                    {reputationLevel}
                  </div>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#6C63FF]"
                    style={{ width: `${Math.min(reputation / 10, 100)}%` }}
                  />
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Award className="size-4 text-[#8D87FF]" aria-hidden="true" />
                  已获得徽章
                </div>
                {badges.length === 0 ? (
                  <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-white/45">
                    暂无徽章，完成项目协作后即可逐步解锁。
                  </p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {badges.map((badge) => (
                      <span
                        key={badge}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/75"
                      >
                        <Medal className="size-4 text-[#8D87FF]" aria-hidden="true" />
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 grid gap-2 text-xs text-white/42">
                <p>0-100：青铜 · 101-300：白银 · 301-600：黄金</p>
                <p>601-1000：铂金 · 1000+：钻石</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card className="rounded-xl border-white/10 bg-[#10101A] py-0 text-white shadow-none">
            <CardHeader className="p-6 pb-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
                    <Code2 className="size-5 text-[#8D87FF]" aria-hidden="true" />
                    技能标签管理
                  </CardTitle>
                  <CardDescription className="mt-1 text-white/45">
                    维护你的技术栈标签，用于项目匹配和智能推荐
                  </CardDescription>
                </div>
                {user ? (
                  <a
                    href="#edit-skills"
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-[#6C63FF] px-4 text-sm font-medium text-[#B8B4FF] transition hover:bg-[#6C63FF] hover:text-white"
                  >
                    编辑技能
                  </a>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              {skills.length === 0 ? (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
                  暂无技能标签，添加后可提升项目推荐匹配度。
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-[#6C63FF]/20 px-3 py-1.5 text-sm text-[#B8B4FF]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl border-white/10 bg-[#10101A] py-0 text-white shadow-none">
            <CardHeader className="p-6 pb-3">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
                <UserRound className="size-5 text-[#8D87FF]" aria-hidden="true" />
                参与的项目
              </CardTitle>
              <CardDescription className="text-white/45">
                你正在跟进的协作项目和贡献方向
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 p-6 pt-2">
              {joinedProjects.map((project) => (
                <div
                  key={project.id}
                  className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-[#8D87FF]">
                        {project.id}
                      </span>
                      <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                        {project.status}
                      </span>
                    </div>
                    <p className="mt-2 font-semibold text-white">
                      {project.name}
                    </p>
                    <p className="mt-1 text-sm text-white/45">
                      {project.contribution}
                    </p>
                  </div>
                  <span className="rounded-lg border border-[#6C63FF]/25 bg-[#6C63FF]/10 px-3 py-1 text-sm text-[#B2AEFF]">
                    {project.role}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-xl border-white/10 bg-[#10101A] py-0 text-white shadow-none">
            <CardHeader className="p-6 pb-3">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
                <Star className="size-5 text-[#8D87FF]" aria-hidden="true" />
                账户设置
              </CardTitle>
              <CardDescription className="text-white/45">
                管理账户安全、通知、收益和开发者访问权限
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 p-6 pt-2 sm:grid-cols-2">
              {settings.map((item) => {
                const Icon = item.icon

                return (
                  <button
                    key={item.title}
                    type="button"
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-left transition-colors hover:border-[#6C63FF]/45 hover:bg-[#6C63FF]/10"
                  >
                    <Icon className="size-5 text-[#8D87FF]" aria-hidden="true" />
                    <p className="mt-3 font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-white/45">
                      {item.description}
                    </p>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </section>

      <div
        id="edit-skills"
        className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 opacity-0 transition target:pointer-events-auto target:opacity-100"
      >
        <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#10101A] p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">编辑技能</h2>
              <p className="mt-2 text-sm text-white/45">
                选择与你当前能力匹配的技能标签，可多选。
              </p>
            </div>
            <a
              href="#"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/60 transition hover:text-white"
            >
              关闭
            </a>
          </div>

          <form action={updateSkills} className="mt-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {presetSkills.map((skill) => (
                <label
                  key={skill}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/75 transition hover:border-[#6C63FF]/45 hover:bg-[#6C63FF]/10"
                >
                  <input
                    type="checkbox"
                    name="skills"
                    value={skill}
                    defaultChecked={skills.includes(skill)}
                    className="size-4 accent-[#6C63FF]"
                  />
                  {skill}
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <a
                href="#"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-white/10 px-4 text-sm text-white/65 transition hover:text-white"
              >
                取消
              </a>
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#6C63FF] px-4 text-sm font-medium text-white transition hover:bg-[#5B54E8]"
              >
                <Save className="size-4" aria-hidden="true" />
                保存技能
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
