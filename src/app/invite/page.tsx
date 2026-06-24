"use client"

import { useState } from "react"

import { Footer } from "@/components/footer"
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

const inviteCode = "JBGIT-8K29"
const inviteLink = `https://jbgit.dev/auth/register?invite=${inviteCode}`

const stats = [
  { label: "已邀请人数", value: "24" },
  { label: "已成功人数", value: "11" },
  { label: "已获得奖励", value: "$85" },
]

export default function InvitePage() {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      <main className="min-h-screen bg-[#05050B] px-6 py-10 text-white">
      <section className="mx-auto w-full max-w-5xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6C63FF]">
            JBGIT REFERRAL
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-normal text-white">
            邀请开发者，一起赚钱
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/50 md:text-base">
            分享你的专属邀请链接，邀请开发者与项目方加入 JBGIT。
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-2xl border-white/10 bg-[#10101A] py-0 text-white shadow-none">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-xl font-bold text-white">
                专属邀请信息
              </CardTitle>
              <CardDescription className="text-white/45">
                复制链接发送给开发者或项目方，完成注册与首单后获得奖励。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="invite-link" className="text-white">
                  邀请链接
                </Label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    id="invite-link"
                    readOnly
                    value={inviteLink}
                    className="border-white/10 bg-black/20 text-white placeholder:text-white/35"
                  />
                  <Button
                    type="button"
                    onClick={handleCopy}
                    className="bg-[#6C63FF] text-white hover:bg-[#5B54E8] sm:w-32"
                  >
                    {copied ? "已复制" : "复制链接"}
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-[#6C63FF]/30 bg-[#6C63FF]/10 p-5">
                <p className="text-sm text-white/45">邀请码</p>
                <p className="mt-2 font-mono text-3xl font-bold text-white">
                  {inviteCode}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/10 bg-[#10101A] py-0 text-white shadow-none">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-xl font-bold text-white">
                邀请数据
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-6 pt-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4"
                >
                  <span className="text-sm text-white/45">{stat.label}</span>
                  <span className="font-mono text-2xl font-bold text-white">
                    {stat.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 rounded-2xl border-white/10 bg-[#10101A] py-0 text-white shadow-none">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-xl font-bold text-white">
              邀请规则说明
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 pt-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="font-semibold text-white">邀请开发者注册</p>
              <p className="mt-2 text-sm leading-6 text-white/50">
                邀请开发者注册 → 双方各得 $5
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="font-semibold text-white">邀请项目方入驻</p>
              <p className="mt-2 text-sm leading-6 text-white/50">
                邀请项目方入驻 → 邀请人获得首单5%分成
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
      </main>
      <Footer />
    </>
  )
}
