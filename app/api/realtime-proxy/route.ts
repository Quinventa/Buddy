import { NextRequest, NextResponse } from 'next/server'
import { buildSystemPrompt } from '@/lib/buddy-prompt'
import type { BuddySettings } from '@/types/buddy'

// GPT Realtime API proxy endpoint
// This handles the server-side connection to OpenAI's Realtime API
// and provides a REST interface for the client

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, settings, audioData, sessionId } = body

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    switch (action) {
      case 'create_session':
        return await createRealtimeSession(settings)
      
      case 'send_audio':
        return await sendAudioToRealtime(sessionId, audioData)
      
      case 'end_session':
        return await endRealtimeSession(sessionId)
      
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

async function createRealtimeSession(settings: BuddySettings) {
  // Create session configuration
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
    instructions: 'Use WebSocket client to connect to OpenAI Realtime API directly from the frontend'
  })
}

async function sendAudioToRealtime(sessionId: string, audioData: string) {
  // In a real implementation, you'd manage WebSocket connections here
  // For now, return instructions for client-side implementation
  
  return NextResponse.json({
    success: true,
    message: 'Audio should be sent via WebSocket connection',
    sessionId
  })
}

async function endRealtimeSession(sessionId: string) {
  // Clean up session
  return NextResponse.json({
    success: true,
    message: 'Session ended',
    sessionId
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
  return voiceMap[voiceName] || 'alloy'
}