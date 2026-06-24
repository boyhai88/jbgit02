"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { getSafeRedirectPath } from "@/lib/auth/redirect"
import { createClient } from "@/lib/supabase/server"

export type AuthActionState = {
  error?: string
  message?: string
}

async function getOrigin() {
  const headerStore = await headers()

  return (
    headerStore.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  )
}

export async function loginWithPassword(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const next = getSafeRedirectPath(formData.get("next"))

  if (!email || !password) {
    return {
      error: "请输入邮箱和密码。",
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return {
      error: error.message,
    }
  }

  redirect(next)
}

export async function registerWithPassword(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return {
      error: "请输入邮箱和密码。",
    }
  }

  if (password.length < 6) {
    return {
      error: "密码至少需要 6 位。",
    }
  }

  const origin = await getOrigin()
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return {
      error: error.message,
    }
  }

  if (data.session) {
    redirect("/")
  }

  return {
    message: "注册成功。请检查邮箱并完成验证。",
  }
}

export async function loginWithGoogle(formData: FormData) {
  const next = getSafeRedirectPath(formData.get("next"))
  const origin = await getOrigin()
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })

  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`)
  }

  if (data.url) {
    redirect(data.url)
  }

  redirect("/auth/login?error=Unable%20to%20start%20Google%20login.")
}

export async function logout() {
  const supabase = await createClient()

  await supabase.auth.signOut()

  redirect("/auth/login")
}
