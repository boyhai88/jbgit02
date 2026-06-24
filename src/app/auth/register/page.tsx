"use client"

import { Lock, Mail } from "lucide-react"
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

const slogan = "连接全球开发者，让技能创造价值"

function RegisterSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-11 w-full bg-[#6C63FF] text-white hover:bg-[#5B54E8]"
    >
      {pending ? "创建中..." : "创建账号"}
    </Button>
  )
}

export default function RegisterPage() {
  const [state, formAction] = useFormState<AuthActionState, FormData>(
    registerWithPassword,
    {},
  )

  return (
    <main className="flex min-h-screen flex-col bg-[#05050B] text-white lg:flex-row">
      <section className="relative flex min-h-[44vh] basis-1/2 items-center justify-center overflow-hidden bg-[#0D0B22] px-8 py-14 lg:min-h-screen lg:w-1/2 lg:pl-20 lg:pr-16 xl:pl-24 xl:pr-20">
        <div className="pointer-events-none absolute -left-28 top-1/3 size-[28rem] rounded-full bg-[#6C63FF]/16 blur-3xl" />
        <div className="relative w-full max-w-[620px] lg:translate-x-10 xl:translate-x-16">
          <div className="flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-lg bg-[#6C63FF] font-mono text-base text-white shadow-[0_0_30px_rgba(108,99,255,0.34)]">
              JB
            </span>
            <span className="text-3xl font-black tracking-normal">JBGIT</span>
          </div>

          <h1 className="mt-16 max-w-[760px] text-4xl font-black leading-tight tracking-normal text-white md:text-5xl lg:text-[3.1rem]">
            {slogan.slice(0, 8)}
            <span className="text-[#6C63FF]">{slogan.slice(8)}</span>
          </h1>

          <p className="mt-8 max-w-[540px] text-lg leading-8 text-white/45">
            加入12万+开发者社区，发现协作机会，透明获取项目收益。
          </p>

          <div className="mt-16 flex gap-12">
            <div>
              <div className="font-mono text-3xl text-white">128K+</div>
              <div className="mt-2 text-sm text-white/45">注册开发者</div>
            </div>
            <div>
              <div className="font-mono text-3xl text-white">$42.6M</div>
              <div className="mt-2 text-sm text-white/45">总交易额</div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex basis-1/2 items-center justify-center px-8 py-14 lg:w-1/2 lg:pl-16 lg:pr-20 xl:pr-24">
        <Card className="w-full max-w-[460px] rounded-2xl border-white/10 bg-[#10101A] py-0 text-white shadow-2xl shadow-black/30 lg:translate-x-10 xl:translate-x-16">
          <CardHeader className="p-6 pb-3 text-center">
            <CardTitle className="text-3xl font-black text-white">
              加入 JBGIT
            </CardTitle>
            <CardDescription className="text-white/45">
              用邮箱和密码创建你的账号
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-6 pt-3">
            {state.error ? (
              <Alert className="border-red-500/35 bg-red-500/10 text-red-200">
                <AlertTitle>注册失败</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}

            {state.message ? (
              <Alert className="border-[#6C63FF]/35 bg-[#6C63FF]/10 text-white">
                <AlertTitle>请验证邮箱</AlertTitle>
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            ) : null}

            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  邮箱
                </Label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35"
                    aria-hidden="true"
                  />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="border-white/10 bg-black/20 pl-10 text-white placeholder:text-white/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  密码
                </Label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35"
                    aria-hidden="true"
                  />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="至少 6 位"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    className="border-white/10 bg-black/20 pl-10 text-white placeholder:text-white/30"
                  />
                </div>
              </div>

              <RegisterSubmitButton />
            </form>

            <p className="text-center text-sm text-white/45">
              已有账号？{" "}
              <Link
                href="/auth/login"
                className="font-medium text-[#8D87FF] hover:underline"
              >
                去登录
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
