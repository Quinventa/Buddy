import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

/**
 * AI Agent API Route - Bridges React app to n8n workflow
 * 
 * This endpoint forwards user messages to your n8n workflow webhook
 * and returns the AI-generated response with calendar tool integration.
 * 
 * Flow:
 * 1. User sends message from frontend
 * 2. This route forwards to n8n webhook
 * 3. n8n runs AI Agent with memory + calendar tools
 * 4. Response comes back to frontend
 */

export async function POST(req: NextRequest) {
  try {
    const { message, settings } = await req.json()

    // Validate input
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get current authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    // Get calendar access token from session
    const { data: session } = await supabase.auth.getSession()
    const calendarToken = session?.session?.provider_token

    // Check if n8n webhook URL is configured
    if (!process.env.N8N_WEBHOOK_URL) {
      console.error('❌ N8N_WEBHOOK_URL not configured in environment variables')
      return NextResponse.json(
        { error: 'AI agent not configured. Please contact support.' },
        { status: 500 }
      )
    }

    console.log('🚀 [AI-Agent] Sending message to n8n workflow:', {
      userId: user.id,
      messageLength: message.length,
      hasCalendarToken: !!calendarToken,
      timestamp: new Date().toISOString()
    })

    // Create conversation ID for memory tracking
    const conversationId = `user-${user.id}-main`

    // Forward request to n8n webhook
    const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Optional: Add authentication header if your n8n webhook requires it
        // 'Authorization': `Bearer ${process.env.N8N_WEBHOOK_SECRET}`
      },
      body: JSON.stringify({
        message: message.trim(),
        conversationId, // For n8n memory tracking
        userId: user.id,
        userName: settings?.userName || 'Friend',
        calendarToken, // For calendar tools
        userSettings: {
          tone: settings?.tone || 'gentle',
          pace: settings?.pace || 'slow',
          timezone: settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        timestamp: new Date().toISOString(),
        source: 'buddy-app'
      })
    })

    // Check if n8n responded successfully
    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text()
      console.error('❌ [AI-Agent] n8n webhook error:', {
        status: n8nResponse.status,
        statusText: n8nResponse.statusText,
        error: errorText
      })
      
      return NextResponse.json(
        { 
          error: 'AI agent temporarily unavailable',
          details: `n8n returned status ${n8nResponse.status}`
        },
        { status: 502 }
      )
    }

    // Parse response from n8n
    const data = await n8nResponse.json()
    
    console.log('✅ [AI-Agent] Received response from n8n:', {
      hasResponse: !!data.output || !!data.response,
      responseLength: (data.output || data.response || '').length
    })

    // Extract the response text
    // n8n might return the response in different fields depending on your workflow
    const responseText = data.output || data.response || data.text || data.message

    if (!responseText) {
      console.error('⚠️ [AI-Agent] No response text in n8n output:', data)
      return NextResponse.json(
        { error: 'AI agent returned empty response' },
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json({
      response: responseText,
      success: true,
      metadata: {
        conversationId,
        timestamp: new Date().toISOString(),
        toolsUsed: data.toolsUsed || [], // If your n8n workflow includes this
        memoryUpdated: true
      }
    })

  } catch (error) {
    console.error('❌ [AI-Agent] Fatal error:', error)
    
    // Determine error type and provide helpful message
    let errorMessage = 'AI agent failed'
    let errorDetails = ''

    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Cannot connect to AI agent'
      errorDetails = 'Check if n8n is running and webhook URL is correct'
    } else if (error instanceof SyntaxError) {
      errorMessage = 'Invalid response from AI agent'
      errorDetails = 'n8n webhook returned invalid JSON'
    } else if (error instanceof Error) {
      errorDetails = error.message
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  const isConfigured = !!process.env.N8N_WEBHOOK_URL
  
  return NextResponse.json({
    status: isConfigured ? 'configured' : 'not configured',
    message: isConfigured 
      ? 'AI agent is ready' 
      : 'N8N_WEBHOOK_URL not set in environment variables',
    timestamp: new Date().toISOString()
  })
}
