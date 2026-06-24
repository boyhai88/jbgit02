"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth/auth-provider"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function AuthStatus() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
    router.refresh()
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-[#6C63FF]/20 bg-[#6C63FF]/5 px-4 py-3 text-sm text-muted-foreground">
        正在读取登录状态...
      </div>
    )
  }

  if (user) {
    return (
      <div className="space-y-3 rounded-lg border border-[#6C63FF]/20 bg-[#6C63FF]/5 p-4">
        <div className="text-sm text-muted-foreground">当前账号</div>
        <div className="break-all font-medium text-[#272343]">{user.email}</div>
        <Button
          type="button"
          variant="outline"
          className="w-full border-[#6C63FF]/30 hover:bg-[#6C63FF]/10 sm:w-auto"
          onClick={handleSignOut}
        >
          退出登录
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
      <Link
        href="/auth/login"
        className={cn(
          buttonVariants(),
          "h-10 bg-[#6C63FF] px-4 text-white hover:bg-[#5B54E8]",
        )}
      >
        登录
      </Link>
      <Link
        href="/auth/register"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-10 border-[#6C63FF]/30 px-4 hover:bg-[#6C63FF]/10",
        )}
      >
        注册
      </Link>
    </div>
  )
}
