import { NextResponse } from "next/server"
import { generateText } from "ai"
import { xai } from "@ai-sdk/xai"
import { openai } from "@ai-sdk/openai"
import { buildChatPrompt, buildSystemPrompt } from "@/lib/buddy-prompt"
import type { BuddyMessage, BuddySettings } from "@/types/buddy"

type Body = {
  messages: BuddyMessage[]
  settings: BuddySettings
}

function containsSensitiveAdviceRequest(text: string) {
  const hay = text.toLowerCase()
  const medical = /(diagnos|prescrib|medicin|treat|symptom|dose|pill|therapy|therapist)/i.test(hay)
  const financial = /(invest|stock|bond|crypto|loan|mortgage|tax|retire|savings advice)/i.test(hay)
  const legal = /(legal|lawyer|sue|lawsuit|contract|illegal|warrant)/i.test(hay)
  return medical || financial || legal
}

// Model selection based on user preference and available keys
function selectModel(preferredModel: string) {
  const hasXAI = !!process.env.XAI_API_KEY
  const hasOpenAI = !!process.env.OPENAI_API_KEY

  switch (preferredModel) {
    case "grok-3":
      if (hasXAI) return xai("grok-3")
      if (hasOpenAI) return openai("gpt-4o") // fallback
      return null
    case "gpt-4o":
      if (hasOpenAI) return openai("gpt-4o")
      if (hasXAI) return xai("grok-3") // fallback
      return null
    case "gpt-4o-mini":
      if (hasOpenAI) return openai("gpt-4o-mini")
      if (hasXAI) return xai("grok-3") // fallback
      return null
    case "auto":
    default:
      if (hasXAI) return xai("grok-3")
      if (hasOpenAI) return openai("gpt-4o")
      return null
  }
}

export async function POST(req: Request) {
  // Debug: check if API key is loaded
  console.log("OpenAI key exists:", !!process.env.OPENAI_API_KEY)
  console.log("XAI key exists:", !!process.env.XAI_API_KEY)

  try {
    const { messages, settings } = (await req.json()) as Body

    // Safety: gentle redirect if user requests sensitive advice (server-side check)
    const lastUser = [...messages].reverse().find((m) => m.role === "user")
    if (lastUser && containsSensitiveAdviceRequest(lastUser.content)) {
      const text =
        "I can’t give medical, financial, or legal advice. It’s best to speak with a trusted person or professional. Would you like a gentle breathing exercise or a light story instead?"
      return NextResponse.json({ text })
    }

    // Safety: blocked topics hint
    const blocked = (settings.blockedTopics || []).map((x) => x.toLowerCase().trim()).filter(Boolean)
    if (lastUser && blocked.length) {
      const hay = lastUser.content.toLowerCase()
      if (blocked.some((b) => b && hay.includes(b))) {
        const text =
          "Let’s keep things light and safe. How about we talk about a happy memory, a favorite song, or today’s weather?"
        return NextResponse.json({ text })
      }
    }

    const system = buildSystemPrompt(settings)
    const prompt = buildChatPrompt(messages, settings.userName)

    const model = selectModel(settings.aiModel || "auto")

    // If no API keys are available, provide a gentle fallback
    if (!model) {
      const text =
        "I'm here with you. Let's take a calm breath. Would you like a cozy story, a light joke, or help setting a small reminder? (Note: Add XAI_API_KEY or OPENAI_API_KEY to enable AI responses)"
      return NextResponse.json({ text }, { headers: { "x-buddy-warning": "Missing API keys" } })
    }

    const { text } = await generateText({
      model,
      system,
      prompt,
    })

    return NextResponse.json({ text })
  } catch (err) {
    // THIS IS THE NEW LINE TO HELP DEBUG!
    console.error("AI Generation Error:", err)
    const text =
      "I’m here. Let’s keep things simple and gentle. We can share a memory, a laugh, or set a small reminder together."
    return NextResponse.json({ text }, { status: 200 })
  }
}
