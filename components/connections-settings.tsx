"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase"
import { useSearchParams } from "next/navigation"
import { useTranslation } from "@/lib/translations"

interface ConnectedAccount {
  id: string
  provider: string
  email: string
  name: string
  avatar_url?: string
  connected_at: string
  last_used_at: string
  is_active: boolean
}

interface ConnectionsSettingsProps {
  onConnectionChange?: () => void
  language?: "en" | "nl"
}

export function ConnectionsSettings({ onConnectionChange, language = "en" }: ConnectionsSettingsProps) {
  const { toast } = useToast()
  const { t } = useTranslation(language)
  const searchParams = useSearchParams()
  const [connectedAccounts, setConnectedAccounts] = React.useState<ConnectedAccount[]>([])
  const [loading, setLoading] = React.useState(true)
  const [connecting, setConnecting] = React.useState<string | null>(null)
  const [isLoggedInWithGoogle, setIsLoggedInWithGoogle] = React.useState(false)
  const [userEmail, setUserEmail] = React.useState("")
  const supabase = createClient()

  React.useEffect(() => {
    const connected = searchParams.get("connected")
    if (connected === "google") {
      console.log("[v0] Google account connected successfully")
      toast({
        title: t("accountConnected"),
        description: t("googleAccountConnectedSuccess"),
      })
      onConnectionChange?.()
      // Remove the URL parameter
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [searchParams, toast, onConnectionChange])

  // Load connected accounts and check auth provider
  React.useEffect(() => {
    const loadConnectedAccounts = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Check if user is logged in via Google OAuth
        const isGoogleAuth = user.app_metadata?.provider === 'google' || 
                            user.user_metadata?.iss?.includes('accounts.google.com')
        
        setIsLoggedInWithGoogle(isGoogleAuth)
        setUserEmail(user.email || "")
        
        console.log("[v0] User auth info:", {
          provider: user.app_metadata?.provider,
          issuer: user.user_metadata?.iss,
          isGoogleAuth,
          email: user.email
        })

        const { data, error } = await supabase
          .from("user_connected_accounts")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("connected_at", { ascending: false })

        if (error) {
          if (error.code === "42P01" || error.message.includes("does not exist")) {
            console.log("[v0] Connected accounts table not found - please run the SQL script")
          } else if (error.code === "PGRST116" || error.message.includes("406")) {
            console.log("[v0] RLS policy blocking access to connected accounts table")
            console.log("[v0] User ID:", user.id)
            console.log("[v0] Error details:", error)
          } else {
            console.error("[v0] Error loading connected accounts:", error)
          }
          setConnectedAccounts([])
          return
        }

        setConnectedAccounts(data || [])
        console.log("[v0] Loaded connected accounts:", data?.length || 0)
      } catch (error) {
        console.error("[v0] Error loading connected accounts:", error)
        setConnectedAccounts([])
      } finally {
        setLoading(false)
      }
    }

    loadConnectedAccounts()
  }, [supabase])

  const connectGoogle = async () => {
    try {
      setConnecting("google")
      console.log("[v0] Initiating Google OAuth connection with calendar scopes")

      // Use Supabase OAuth with calendar scopes
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/calendar',
          redirectTo: `${window.location.origin}/auth/callback?connection=google`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      })

      if (error) {
        throw error
      }

      // The redirect will happen automatically, no need to reset connecting here
    } catch (error) {
      console.error("[v0] Error connecting Google account:", error)
      toast({
        title: t("connectionFailed"),
        description: t("failedToConnectGoogle"),
        variant: "destructive",
      })
      setConnecting(null)
    }
  }

  const disconnectAccount = async (accountId: string, provider: string) => {
    try {
      console.log(`[v0] Disconnecting ${provider} account (ID: ${accountId})`)

      const { error } = await supabase.from("user_connected_accounts").update({ is_active: false }).eq("id", accountId)

      if (error) {
        console.log("[v0] Error disconnecting account (table may not be accessible):", error)
        // Remove from local state anyway
        setConnectedAccounts((prev) => prev.filter((acc) => acc.id !== accountId))
        onConnectionChange?.()
        
        toast({
          title: t("accountDisconnected"),
          description: `${provider} ${t("accountDisconnectedDesc")} (local only)`,
        })
        return
      }

      setConnectedAccounts((prev) => prev.filter((acc) => acc.id !== accountId))
      onConnectionChange?.()

      console.log(`[v0] Successfully disconnected ${provider} account`)
      toast({
        title: t("accountDisconnected"),
        description: `${provider} ${t("accountDisconnectedDesc")}`,
      })
    } catch (error) {
      console.error("[v0] Error disconnecting account:", error)
      toast({
        title: t("disconnectionFailed"),
        description: t("failedToDisconnectAccount"),
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "google":
        return "🔗"
      default:
        return "🔗"
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{t("connectedAccounts")}</Label>
          <p className="text-sm text-neutral-600">{t("loadingConnectedAccounts")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t("connectedAccounts")}</Label>
        <p className="text-sm text-neutral-600">{t("connectAccountsDesc")}</p>
      </div>

      {connectedAccounts.length > 0 && (
        <div className="space-y-3">
          {connectedAccounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={account.avatar_url || "/placeholder.svg"} alt={account.name} />
                  <AvatarFallback>{getProviderIcon(account.provider)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{account.provider}</span>
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      ✓ {t("connected")}
                    </Badge>
                  </div>
                  <p className="text-sm text-neutral-600">{account.email}</p>
                  <p className="text-xs text-neutral-500">Connected {formatDate(account.connected_at)}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                onClick={() => disconnectAccount(account.id, account.provider)}
              >
                {t("disconnect")}
              </Button>
            </div>
          ))}
          <Separator />
        </div>
      )}

      <div className="space-y-3">
        <Label>{t("availableConnections")}</Label>

        {/* Google Connection */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">🔗</div>
            <div className="space-y-1">
              <span className="font-medium">Google</span>
              {isLoggedInWithGoogle ? (
                <div className="space-y-1">
                  <p className="text-sm text-neutral-600">
                    {t("alreadyLoggedInGoogle")}
                  </p>
                  <p className="text-xs text-neutral-500">({userEmail})</p>
                </div>
              ) : connectedAccounts.some((acc) => acc.provider === "google") ? (
                <p className="text-sm text-neutral-600">
                  {t("googleConnectedFeatures")}
                </p>
              ) : (
                <p className="text-sm text-neutral-600">
                  {t("connectGoogleForCalendar")}
                </p>
              )}
            </div>
          </div>
          
          {isLoggedInWithGoogle ? (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="text-green-700 border-green-200 bg-green-50 cursor-not-allowed"
            >
              ✓ Already Connected
            </Button>
          ) : connectedAccounts.some((acc) => acc.provider === "google") ? (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
              ✓ {t("connected")}
            </Badge>
          ) : (
            <Button onClick={connectGoogle} disabled={connecting === "google"} size="sm">
              {connecting === "google" ? t("connecting") : t("connectGoogle")}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
