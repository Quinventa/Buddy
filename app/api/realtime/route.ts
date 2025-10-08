import { NextRequest, NextResponse } from 'next/server'
import { buildSystemPrompt } from '@/lib/buddy-prompt'
import type { BuddySettings } from '@/types/buddy'

// Rate limiting cache
const apiKeyCache = { key: '', timestamp: 0 }
const API_KEY_CACHE_DURATION = 60000 // Cache for 1 minute

// This endpoint provides information about GPT Realtime API integration
// For actual WebSocket connections, you would need a separate WebSocket server
// or use a service like Pusher/Ably for production

export async function GET(req: NextRequest) {
  // Return cached API key if available
  const now = Date.now()
  if (apiKeyCache.key && (now - apiKeyCache.timestamp) < API_KEY_CACHE_DURATION) {
    return NextResponse.json({
      message: 'GPT Realtime API endpoint',
      status: 'ready',
      api_key: apiKeyCache.key,
      instructions: 'Use this API key for WebSocket authentication',
      note: 'API key retrieved from cache'
    })
  }
  
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    console.error('❌ [REALTIME API] No OpenAI API key configured')
    return NextResponse.json({
      error: 'OpenAI API key not configured'
    }, { status: 500 })
  }

  // Cache the API key
  apiKeyCache.key = apiKey
  apiKeyCache.timestamp = now

  return NextResponse.json({
    message: 'GPT Realtime API endpoint',
    status: 'ready',
    api_key: apiKey,
    instructions: 'Use this API key for WebSocket authentication',
    note: 'API key retrieved successfully'
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, settings } = body

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    switch (action) {
      case 'get_session_config':
        return getSessionConfig(settings)
      
      case 'validate_api_key':
        return validateApiKey()
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Realtime API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getSessionConfig(settings: BuddySettings) {
  const sessionConfig = {
    modalities: ['text', 'audio'],
    instructions: buildSystemPrompt(settings),
    voice: mapVoiceURI(settings.buddyVoiceURI),
    input_audio_format: 'pcm16',
    output_audio_format: 'pcm16',
    input_audio_transcription: {
      model: 'whisper-1'
    },
    turn_detection: {
      type: 'server_vad',
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 500
    },
    temperature: 0.8,
    max_response_output_tokens: 4096
  }

  return NextResponse.json({
    success: true,
    sessionId: crypto.randomUUID(),
    config: sessionConfig,
    apiUrl: 'wss://api.openai.com/v1/realtime',
    model: 'gpt-4o-realtime-preview-2024-10-01'
  })
}

function validateApiKey() {
  const hasApiKey = !!process.env.OPENAI_API_KEY
  
  return NextResponse.json({
    success: hasApiKey,
    message: hasApiKey ? 'API key configured' : 'API key missing'
  })
}

function mapVoiceURI(voiceURI: string): string {
  // Map Web Speech API voices to OpenAI Realtime voices
  const voiceMap: Record<string, string> = {
    'alloy': 'alloy',
    'echo': 'echo', 
    'fable': 'fable',
    'onyx': 'onyx',
    'nova': 'nova',
    'shimmer': 'shimmer'
  }
  
  // Extract voice name from URI or use default
  const voiceName = voiceURI.toLowerCase()
  for (const [key, value] of Object.entries(voiceMap)) {
    if (voiceName.includes(key)) {
      return value
    }
  }
  
  return 'alloy' // default
}