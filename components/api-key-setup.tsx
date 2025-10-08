"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Key, ExternalLink } from "lucide-react"
import { useTranslation } from "@/lib/translations"

interface ApiKeySetupProps {
  language?: "en" | "nl"
}

export function ApiKeySetup({ language = "en" }: ApiKeySetupProps) {
  const { t } = useTranslation(language)
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <Key className="h-5 w-5" />
          {t("apiKeySetup")}
        </CardTitle>
        <CardDescription className="text-amber-700">
          {t("apiKeySetupDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-purple-100 text-purple-800">
              xAI
            </Badge>
            <span>{t("getYourKeyAt")}</span>
            <a
              href="https://console.x.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:underline inline-flex items-center gap-1"
            >
              console.x.ai <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-100 text-green-800">
              OpenAI
            </Badge>
            <span>{t("getYourKeyAt")}</span>
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline inline-flex items-center gap-1"
            >
              platform.openai.com <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <div className="rounded-md bg-amber-100 p-2 text-xs">
          <strong>{t("localDevelopment")}</strong> {t("addKeysToEnv")}
          <br />
          <code>XAI_API_KEY=your_xai_key_here</code>
          <br />
          <code>OPENAI_API_KEY=</code>
        </div>
      </CardContent>
    </Card>
  )
}
