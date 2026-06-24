"use client"

import { LogOut, UserRound } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "首页" },
  { href: "/projects", label: "项目市场" },
  { href: "/invite", label: "邀请" },
  { href: "/dashboard", label: "仪表盘" },
] as const

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/"
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

function getEmailInitial(email?: string | null) {
  return email?.trim().charAt(0).toUpperCase() || "U"
}

function getAvatarUrl(metadata: Record<string, unknown> | null | undefined) {
  const avatarUrl = metadata?.avatar_url
  const picture = metadata?.picture

  if (typeof avatarUrl === "string" && avatarUrl.length > 0) {
    return avatarUrl
  }

  if (typeof picture === "string" && picture.length > 0) {
    return picture
  }

  return undefined
}

export function SiteNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { loading, signOut, user } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  if (pathname.startsWith("/auth")) {
    return null
  }

  async function handleSignOut() {
    if (signingOut) {
      return
    }

    setSigningOut(true)

    try {
      await signOut()
      router.refresh()
    } finally {
      setSigningOut(false)
    }
  }

  const email = user?.email ?? ""
  const avatarUrl = user ? getAvatarUrl(user.user_metadata) : undefined
  const initial = getEmailInitial(email)

  return (
    <header className="border-b border-white/10 bg-[#05050B] text-white">
      <nav className="mx-auto flex h-16 w-full max-w-[980px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 font-bold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-[#6C63FF] text-xs text-white shadow-[0_0_28px_rgba(108,99,255,0.32)]">
            JB
          </span>
          <span className="text-lg">JBGIT</span>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium text-white/50 md:flex">
          {navItems.map((item) => {
            const isActive = isActivePath(pathname, item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "transition-colors hover:text-white",
                  isActive && "text-white",
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        {!user ? (
          <Link
            href="/auth/login"
            aria-busy={loading}
            className="rounded-lg border border-[#6C63FF] bg-[#6C63FF] px-4 py-2 text-sm font-medium text-white shadow-[0_12px_28px_rgba(108,99,255,0.24)] transition-colors hover:border-[#5B54E8] hover:bg-[#5B54E8]"
          >
            登录
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/enterprise/create"
              className="hidden rounded-lg border border-[#6C63FF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#6C63FF] md:inline-flex"
            >
              创建企业
            </Link>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="打开用户菜单"
              className="rounded-full outline-none ring-[#6C63FF]/40 transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05050B]"
            >
              <Avatar className="size-9 border border-[#6C63FF]/50 bg-[#6C63FF] text-sm font-bold text-white shadow-[0_0_26px_rgba(108,99,255,0.32)]">
                <AvatarImage src={avatarUrl} alt={email || "用户头像"} />
                <AvatarFallback className="bg-[#6C63FF] text-white">
                  {initial}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="border-white/10 bg-[#11111D] text-white shadow-xl"
            >
              <DropdownMenuLabel className="max-w-56 truncate text-white/85">
                {email || "JBGIT 用户"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                asChild
                className="cursor-pointer text-white/85 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white"
              >
                <Link href="/profile">
                  <UserRound className="size-4" aria-hidden="true" />
                  个人资料
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={signingOut}
                className="cursor-pointer text-red-200 hover:bg-red-500/10 hover:text-red-100 focus:bg-red-500/10 focus:text-red-100"
                onSelect={(event) => {
                  event.preventDefault()
                  void handleSignOut()
                }}
              >
                <LogOut className="size-4" aria-hidden="true" />
                {signingOut ? "退出中..." : "退出登录"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        )}
      </nav>
    </header>
  )
}
