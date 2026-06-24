import { redirect } from "next/navigation"

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
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/server"

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function getErrorMessage(error?: string) {
  const messages: Record<string, string> = {
    auth: "请先登录后再创建企业。",
    name: "请填写企业名称。",
    slug: "请填写企业标识。",
    database: "创建企业失败，请稍后重试。",
  }

  return error ? messages[error] || error : null
}

async function createEnterprise(formData: FormData) {
  "use server"

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const rawSlug = String(formData.get("slug") ?? "").trim()
  const slug = createSlug(rawSlug || name)

  if (!name) {
    redirect("/enterprise/create?error=name")
  }

  if (!slug) {
    redirect("/enterprise/create?error=slug")
  }

  const { error } = await supabase.from("enterprises").insert({
    name,
    slug,
    description,
    owner_id: user.id,
    status: "活跃",
  })

  if (error) {
    console.error("创建企业失败:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    redirect(
      `/enterprise/create?error=${encodeURIComponent(error.message || "database")}`,
    )
  }

  redirect("/enterprise/dashboard")
}

export default function EnterpriseCreatePage({
  searchParams,
}: {
  searchParams?: { error?: string }
}) {
  const errorMessage = getErrorMessage(searchParams?.error)

  return (
    <main className="min-h-screen bg-[#05050B] px-6 py-10 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-2xl items-center">
        <Card className="w-full rounded-2xl border-white/10 bg-[#10101A] py-0 text-white shadow-2xl shadow-black/30">
          <CardHeader className="p-6 pb-3">
            <CardTitle className="text-3xl font-black text-white">
              创建企业
            </CardTitle>
            <CardDescription className="text-white/50">
              创建企业空间，统一管理项目、成员与协作数据。
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-3">
            <form className="space-y-5" action={createEnterprise}>
              <div className="space-y-2">
                <Label htmlFor="enterprise-name" className="text-white">
                  企业名称
                </Label>
                <Input
                  id="enterprise-name"
                  name="name"
                  required
                  placeholder="例如：JBGIT Labs"
                  className="border-white/10 bg-black/20 text-white placeholder:text-white/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="enterprise-description" className="text-white">
                  企业简介
                </Label>
                <Textarea
                  id="enterprise-description"
                  name="description"
                  placeholder="介绍企业方向、团队规模或项目需求"
                  className="min-h-28 border-white/10 bg-black/20 text-white placeholder:text-white/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="enterprise-slug" className="text-white">
                  企业标识
                </Label>
                <Input
                  id="enterprise-slug"
                  name="slug"
                  placeholder="用于企业 URL，留空则根据企业名称自动生成"
                  className="border-white/10 bg-black/20 text-white placeholder:text-white/30"
                />
                <p className="text-xs text-white/40">
                  企业 URL：
                  <span className="text-[#8D87FF]">
                    /enterprise/your-company
                  </span>
                </p>
              </div>

              {errorMessage ? (
                <Alert className="border-red-500/35 bg-red-500/10 text-red-100">
                  <AlertTitle className="text-white">创建失败</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              ) : null}

              <Button
                type="submit"
                className="h-11 w-full bg-[#6C63FF] text-white hover:bg-[#5B54E8]"
              >
                创建企业
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
