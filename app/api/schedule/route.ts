import { NextRequest, NextResponse } from "next/server"

interface ScheduleRequest {
  userText: string
}

export async function POST(req: NextRequest) {
  try {
    const { userText } = (await req.json()) as ScheduleRequest

    // Use a simple API key check
    const apiKey = process.env.XAI_API_KEY || process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ 
        isSchedulingRequest: false,
        error: "No API key configured" 
      })
    }

    // Determine which API to use
    const isXAI = !!process.env.XAI_API_KEY
    const apiUrl = isXAI 
      ? "https://api.x.ai/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions"
    
    const model = isXAI ? "grok-beta" : "gpt-4o-mini"

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: `You are a scheduling assistant. Your job is to extract scheduling information from user requests and return ONLY valid JSON.

Be very forgiving of typos and misspellings:
- "shedule" = "schedule"
- "tomorow" = "tomorrow" 
- "doctr" = "doctor"
- "apointment" = "appointment"
- "meetng" = "meeting"

Return ONLY a JSON object, no other text:
{
  "isSchedulingRequest": true/false,
  "title": "corrected event title (fix obvious typos)",
  "date": "YYYY-MM-DD or relative like 'tomorrow'",
  "time": "HH:MM or description like 'morning'", 
  "duration": "duration in minutes or description",
  "location": "location if mentioned (correct spelling)",
  "guests": ["email1", "email2"] or [],
  "description": "additional details (correct spelling)",
  "missing": ["time", "date", "duration"] // what's still needed
}

If it's not a scheduling request, return {"isSchedulingRequest": false}`
          },
          {
            role: "user",
            content: userText
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      }),
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json({ isSchedulingRequest: false })
    }

    try {
      // Try to parse the JSON response
      const parsed = JSON.parse(content.trim())
      return NextResponse.json(parsed)
    } catch (parseError) {
      console.error("Failed to parse scheduling JSON:", parseError, "Content:", content)
      return NextResponse.json({ isSchedulingRequest: false })
    }

  } catch (error) {
    console.error("Scheduling extraction error:", error)
    return NextResponse.json({ isSchedulingRequest: false })
  }
}
