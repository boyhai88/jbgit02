"use client"

import { LogOut, UserRound } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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

type UserMenuProps = {
  className?: string
  variant?: "dark" | "light"
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

export function UserMenu({ className, variant = "light" }: UserMenuProps) {
  const router = useRouter()
  const { loading, signOut, user } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const isDark = variant === "dark"

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

  if (loading) {
    return (
      <div
        aria-label="正在读取登录状态"
        className={cn(
          "size-9 animate-pulse rounded-full",
          isDark
            ? "border border-white/15 bg-white/10"
            : "border border-[#6C63FF]/20 bg-[#6C63FF]/10",
          className,
        )}
      />
    )
  }

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className={cn(
          "rounded-lg border border-[#6C63FF] bg-[#6C63FF] px-4 py-2 text-sm font-medium text-white shadow-[0_12px_28px_rgba(108,99,255,0.24)] transition-colors hover:border-[#5B54E8] hover:bg-[#5B54E8]",
          className,
        )}
      >
        登录
      </Link>
    )
  }

  const email = user.email ?? ""
  const avatarUrl = getAvatarUrl(user.user_metadata)
  const initial = getEmailInitial(email)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="打开用户菜单"
        className={cn(
          "rounded-full outline-none ring-[#6C63FF]/40 transition focus-visible:ring-2 focus-visible:ring-offset-2",
          isDark ? "ring-offset-[#05050B]" : "ring-offset-background",
          className,
        )}
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
  )
}
