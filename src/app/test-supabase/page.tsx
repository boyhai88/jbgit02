import { CheckCircle2, Clock3, XCircle } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

type ConnectionResult =
  | {
      ok: true
      serverTime: string
      serverTimeIso: string
    }
  | {
      ok: false
      error: string
    }

function formatServerTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.valueOf())) {
    return value
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "full",
    timeStyle: "long",
    timeZone: "Asia/Shanghai",
  }).format(date)
}

async function getSupabaseServerTime(): Promise<ConnectionResult> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("now")

    if (error) {
      return {
        ok: false,
        error: error.message,
      }
    }

    if (!data) {
      return {
        ok: false,
        error: "Supabase now() did not return a value.",
      }
    }

    const serverTimeIso = String(data)

    return {
      ok: true,
      serverTime: formatServerTime(serverTimeIso),
      serverTimeIso,
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown Supabase error.",
    }
  }
}

export default async function TestSupabasePage() {
  const result = await getSupabaseServerTime()

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <Card className="w-full max-w-xl">
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Supabase 连接测试</CardTitle>
              <CardDescription>服务端组件调用 Supabase now()</CardDescription>
            </div>

            <div
              className={
                result.ok
                  ? "inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200"
                  : "inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1 text-sm font-medium text-red-700 ring-1 ring-red-200"
              }
            >
              {result.ok ? (
                <CheckCircle2 className="size-4" aria-hidden="true" />
              ) : (
                <XCircle className="size-4" aria-hidden="true" />
              )}
              {result.ok ? "连接成功" : "连接失败"}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <section className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock3 className="size-4" aria-hidden="true" />
              Supabase 服务器当前时间
            </div>
            <div className="mt-2 text-xl font-semibold">
              {result.ok ? result.serverTime : "无法获取"}
            </div>
            {result.ok ? (
              <div className="mt-1 break-all font-mono text-xs text-muted-foreground">
                {result.serverTimeIso}
              </div>
            ) : null}
          </section>

          {!result.ok ? (
            <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              <div className="font-medium">错误信息</div>
              <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-sm">
                {result.error}
              </pre>
            </section>
          ) : null}
        </CardContent>
      </Card>
    </main>
  )
}
