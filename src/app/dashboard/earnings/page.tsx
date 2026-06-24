import { CircleDollarSign } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function EarningsPage() {
  return (
    <main className="min-h-screen bg-[#05050B] px-6 py-10 text-white">
      <section className="mx-auto w-full max-w-[980px]">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6C63FF]">
            JBGIT DASHBOARD
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-normal text-white">
            收益记录
          </h1>
        </div>

        <Card className="rounded-xl border-white/10 bg-[#10101A] py-0 text-white shadow-none">
          <CardHeader className="p-6 pb-2">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-xl font-bold text-white">
                收益明细
              </CardTitle>
              <div className="flex size-10 items-center justify-center rounded-lg bg-[#6C63FF]/16 text-[#8D87FF]">
                <CircleDollarSign className="size-5" aria-hidden="true" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/45">
              暂无收益记录
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
