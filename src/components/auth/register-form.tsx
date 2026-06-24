"use client"

import Link from "next/link"
import { useFormState, useFormStatus } from "react-dom"

import {
  registerWithPassword,
  type AuthActionState,
} from "@/app/auth/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function RegisterSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      className="h-10 w-full bg-[#6C63FF] text-white hover:bg-[#5B54E8]"
      disabled={pending}
    >
      {pending ? "创建中..." : "创建账号"}
    </Button>
  )
}

export function RegisterForm() {
  const [state, formAction] = useFormState<AuthActionState, FormData>(
    registerWithPassword,
    {},
  )

  return (
    <Card className="w-full max-w-md border-[#6C63FF]/20 shadow-[0_24px_80px_rgba(108,99,255,0.16)]">
      <CardHeader className="space-y-2 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#6C63FF] text-lg font-bold text-white">
          JB
        </div>
        <CardTitle className="text-3xl font-bold text-[#272343]">
          加入 JBGIT
        </CardTitle>
        <CardDescription>
          用邮箱和密码创建你的账号
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {state.error ? (
          <Alert className="border-red-200 bg-red-50 text-red-800">
            <AlertTitle>注册失败</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}

        {state.message ? (
          <Alert className="border-[#6C63FF]/30 bg-[#6C63FF]/10 text-[#38317F]">
            <AlertTitle>请验证邮箱</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="至少 6 位"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          <RegisterSubmitButton />
        </form>

        <p className="text-center text-sm text-muted-foreground">
          已经有账号？{" "}
          <Link
            href="/auth/login"
            className="font-medium text-[#6C63FF] hover:underline"
          >
            去登录
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
