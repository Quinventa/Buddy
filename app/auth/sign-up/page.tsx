"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useTranslation } from "@/lib/translations"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  
  // Use hydration-safe language state
  const [language, setLanguage] = useState<"en" | "nl">("en")
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
    const savedLanguage = localStorage.getItem('buddy-language') as "en" | "nl" || "en"
    setLanguage(savedLanguage)
  }, [])
  
  const { t } = useTranslation(language)
  
  const handleLanguageChange = (newLanguage: "en" | "nl") => {
    setLanguage(newLanguage)
    if (typeof window !== 'undefined') {
      localStorage.setItem('buddy-language', newLanguage)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError(t("passwordsDontMatch"))
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError(t("passwordMinLength"))
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError(t("unexpectedError"))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {isClient && (
              <div className="flex justify-end mb-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="language-success" className="text-sm">{t("language")}</Label>
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-32" id="language-success">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">{t("languageEnglish")}</SelectItem>
                      <SelectItem value="nl">{t("languageDutch")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <CardTitle className="text-2xl font-bold text-green-700">{t("checkYourEmail")}</CardTitle>
            <CardDescription>
              {t("checkEmailDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/auth/sign-in")} className="w-full">
              {t("goToSignIn")}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {isClient && (
            <div className="flex justify-end mb-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="language" className="text-sm">{t("language")}</Label>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-32" id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t("languageEnglish")}</SelectItem>
                    <SelectItem value="nl">{t("languageDutch")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <CardTitle className="text-2xl font-bold text-gray-900">{t("createAccount")}</CardTitle>
          <CardDescription>{t("joinBuddy")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t("enterYourEmail")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={t("createPasswordPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder={t("confirmPasswordPlaceholder")}
              />
            </div>
            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("creatingAccount") : t("createAccount")}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">{t("alreadyHaveAccount")} </span>
            <Link href="/auth/sign-in" className="text-blue-600 hover:underline">
              {t("signIn")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
