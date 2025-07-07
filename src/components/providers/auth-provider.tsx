"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Listen for auth state changes across all tabs
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      
      // Handle sign out across all tabs
      if (event === "SIGNED_OUT") {
        // Redirect to home page when signed out
        router.push("/")
        router.refresh()
      }
      
      // Handle sign in
      if (event === "SIGNED_IN" && window.location.pathname === "/") {
        // Redirect to dashboard when signed in
        router.push("/dashboard")
        router.refresh()
      }
      
      // Handle token refresh
      if (event === "TOKEN_REFRESHED") {
        console.log("Token refreshed")
      }
    })

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase.auth])

  return <>{children}</>
}