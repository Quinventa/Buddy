"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/translations"

interface UserProfileProps {
  onOpenSettings: () => void
  userAvatarUrl?: string
  language?: "en" | "nl"
}

export function UserProfile({ onOpenSettings, userAvatarUrl, language = "en" }: UserProfileProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslation(language)

  useEffect(() => {
    const getUser = async () => {
      try {
        console.log("[v0] Getting user session...")

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()
        console.log("[v0] Session data:", session)
        console.log("[v0] Session error:", sessionError)

        if (session?.user) {
          console.log("[v0] User found in session - Email:", session.user.email, "ID:", session.user.id)
          setUserEmail(session.user.email || null)
        } else {
          const {
            data: { user },
            error,
          } = await supabase.auth.getUser()

          console.log("[v0] User data:", user)
          console.log("[v0] Auth error:", error)

          if (user) {
            console.log("[v0] User found - Email:", user.email, "ID:", user.id)
            setUserEmail(user.email || null)
          } else {
            console.log("[v0] No user found in getUser() call")
          }
        }
      } catch (err) {
        console.error("[v0] Error getting user:", err)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[v0] Auth state change:", event, session?.user?.email)
      if (event === "SIGNED_OUT") {
        setUserEmail(null)
        router.push("/auth/sign-in")
      } else if (event === "SIGNED_IN" && session?.user) {
        setUserEmail(session.user.email || null)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Sign out error:", error)
        toast({
          title: t("errorSigningOut"),
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: t("signedOutSuccessfully"),
          description: "You have been signed out of your account.",
        })
        window.location.href = "/auth/sign-in"
      }
    } catch (err) {
      console.error("Unexpected sign out error:", err)
      toast({
        title: t("errorSigningOut"),
        description: t("unexpectedSignOutError"),
        variant: "destructive",
      })
    } finally {
      setIsSigningOut(false)
    }
  }

  const handleForceReset = () => {
    console.log("[v0] Force resetting session...")
    localStorage.clear()
    sessionStorage.clear()
    window.location.href = "/auth/sign-in"
  }

  if (isLoading) {
    return (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" disabled>
          Loading...
        </Button>
        <Button variant="outline" size="sm" onClick={handleForceReset}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  if (!userEmail) {
    return (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" disabled>
          No User
        </Button>
        <Button variant="outline" size="sm" onClick={handleForceReset}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  const initials = userEmail
    .split("@")[0]
    .split(".")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={userAvatarUrl || "/placeholder-user.jpg"} alt={userEmail} />
            <AvatarFallback className="bg-blue-100 text-blue-700">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{t("yourAccount")}</p>
            <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onOpenSettings}>
          <Settings className="mr-2 h-4 w-4" />
          <span>{t("settings")}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isSigningOut ? t("signingOut") : t("signOut")}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleForceReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          <span>{t("resetAndSignOut")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
