"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useFormStatus } from "react-dom"

import {
  loginWithGoogle,
} from "@/app/auth/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSafeRedirectPath } from "@/lib/auth/redirect"
import { createClient } from "@/lib/supabase/client"

function PasswordSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      className="mt-2 h-14 w-full rounded-lg bg-[#6C63FF] text-base text-white hover:bg-[#5B54E8]"
      disabled={pending}
    >
      {pending ? "登录中..." : "登录"}
    </Button>
  )
}

function GoogleSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      variant="outline"
      className="h-14 w-full rounded-lg border-white/10 bg-[#10101A] text-base text-white/72 hover:bg-white/5 hover:text-white"
      disabled={pending}
    >
      <span className="flex size-6 items-center justify-center rounded-full bg-white text-sm font-black text-[#4285F4]">
        G
      </span>
      {pending ? "正在跳转..." : "使用Google账号登录"}
    </Button>
  )
}

export function LoginForm({
  initialError,
  next,
}: {
  initialError?: string
  next?: string
}) {
  const router = useRouter()
  const [clientError, setClientError] = useState("")
  const safeNext = getSafeRedirectPath(next ?? "/")
  const error = clientError || initialError
  const registerHref =
    safeNext === "/"
      ? "/auth/register"
      : `/auth/register?next=${encodeURIComponent(safeNext)}`

  async function handlePasswordLogin(formData: FormData) {
    setClientError("")

    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")

    if (!email || !password) {
      setClientError("请输入邮箱和密码。")
      return
    }

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setClientError(signInError.message)
      return
    }

    router.push(safeNext)
    router.refresh()
  }

  return (
    <Card className="w-full max-w-[460px] border-0 bg-transparent py-0 text-white shadow-none ring-0">
      <CardContent className="p-0">
        <div className="grid grid-cols-2 border-b border-white/10 text-center text-lg font-medium">
          <Link
            href="/auth/login"
            className="border-b-2 border-[#6C63FF] pb-4 text-white"
            aria-current="page"
          >
            登录
          </Link>
          <Link
            href={registerHref}
            className="pb-4 text-white/45 transition-colors hover:text-white"
          >
            注册
          </Link>
        </div>

        <div className="mt-8 space-y-7">
          {error ? (
            <Alert className="border-red-500/25 bg-red-500/10 text-red-100">
              <AlertTitle>登录失败</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <form action={loginWithGoogle}>
            <input type="hidden" name="next" value={safeNext} />
            <GoogleSubmitButton />
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[#05050B] px-4 text-white/45">或使用邮箱</span>
            </div>
          </div>

          <form action={handlePasswordLogin} className="space-y-4">
            <input type="hidden" name="next" value={safeNext} />

            <div className="space-y-2">
              <Label htmlFor="email" className="text-base text-white/80">
                邮箱
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="h-14 rounded-lg border-white/10 bg-transparent px-5 text-base text-white placeholder:text-white/35 focus-visible:border-[#6C63FF] focus-visible:ring-[#6C63FF]/25"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-base text-white/80">
                密码
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="h-14 rounded-lg border-white/10 bg-transparent px-5 text-base text-white placeholder:text-white/35 focus-visible:border-[#6C63FF] focus-visible:ring-[#6C63FF]/25"
                required
              />
            </div>

            <PasswordSubmitButton />
          </form>

          <p className="pt-1 text-center text-sm text-white/45">
            还没有账号？{" "}
            <Link
              href={registerHref}
              className="font-medium text-[#6C63FF] hover:underline"
            >
              立即注册
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
