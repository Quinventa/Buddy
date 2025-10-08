"use client"

import { Badge } from "@/components/ui/badge"
import { Bot } from "lucide-react"
import { useTranslation } from "@/lib/translations"

type ModelStatusProps = {
  model: string
  language?: "en" | "nl"
}

export function ModelStatus({ model, language = "en" }: ModelStatusProps) {
  const { t } = useTranslation(language)
  const getModelInfo = (model: string) => {
    switch (model) {
      case "grok-3":
        return { name: "Grok-3", provider: "xAI", color: "bg-purple-100 text-purple-800" }
      case "gpt-4o":
        return { name: "GPT-4o", provider: "OpenAI", color: "bg-green-100 text-green-800" }
      case "gpt-4o-mini":
        return { name: "GPT-4o Mini", provider: "OpenAI", color: "bg-blue-100 text-blue-800" }
      case "auto":
        return { name: t("autoModel"), provider: t("bestAvailable"), color: "bg-muted text-muted-foreground" }
      default:
        return { name: t("unknown"), provider: "", color: "bg-muted text-muted-foreground" }
    }
  }

  const info = getModelInfo(model)

  return (
    <Badge variant="secondary" className={`${info.color} text-xs`}>
      <Bot className="mr-1 h-3 w-3" />
      {info.name}
      {info.provider && <span className="ml-1 opacity-75">({info.provider})</span>}
    </Badge>
  )
}
