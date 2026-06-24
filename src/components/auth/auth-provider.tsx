"use client"

import type { User } from "@supabase/supabase-js"
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { createClient } from "@/lib/supabase/client"

type AuthContextValue = {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!mounted) {
          return
        }

        setUser(data.user)
      })
      .catch(() => {
        if (!mounted) {
          return
        }

        setUser(null)
      })
      .finally(() => {
        if (!mounted) {
          return
        }

        setLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async signOut() {
        const supabase = createClient()
        await supabase.auth.signOut()
        setUser(null)
      },
    }),
    [loading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)

  if (!value) {
    throw new Error("useAuth must be used within AuthProvider.")
  }

  return value
}
