// API endpoint for refreshing Google tokens
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    console.log('🔄 [TOKEN-REFRESH] POST request received')
    
    const requestBody = await request.json()
    console.log('📝 [TOKEN-REFRESH] Request body:', requestBody)
    
    const { refreshToken } = requestBody

    console.log('🔍 [TOKEN-REFRESH] Extracted refresh token:', { 
      hasRefreshToken: !!refreshToken, 
      refreshTokenLength: refreshToken?.length || 0,
      refreshTokenPreview: refreshToken ? refreshToken.substring(0, 20) + '...' : 'null'
    })

    if (!refreshToken) {
      console.log('❌ [TOKEN-REFRESH] Error: No refresh token provided')
      return NextResponse.json({ error: "Refresh token is required" }, { status: 400 })
    }

    console.log('🌐 [TOKEN-REFRESH] Environment check:', {
      hasClientId: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      clientIdLength: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.length || 0
    })

    const tokenRequestBody = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    })

    console.log('📤 [TOKEN-REFRESH] Sending request to Google OAuth:', {
      url: 'https://oauth2.googleapis.com/token',
      bodyParams: Object.fromEntries(tokenRequestBody.entries())
    })

    // Refresh the Google token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenRequestBody,
    })

    console.log('📥 [TOKEN-REFRESH] Google response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.log('❌ [TOKEN-REFRESH] Google token refresh failed:', { 
        status: response.status, 
        statusText: response.statusText, 
        errorData,
        headers: Object.fromEntries(response.headers.entries())
      })
      return NextResponse.json(
        { error: "Failed to refresh token", details: errorData }, 
        { status: response.status }
      )
    }

    const tokenData = await response.json()
    console.log('✅ [TOKEN-REFRESH] Token refresh successful:', {
      hasAccessToken: !!tokenData.access_token,
      accessTokenLength: tokenData.access_token?.length || 0,
      expiresIn: tokenData.expires_in
    })

    // Update the stored token in the database
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              // Ignore cookies errors in Server Components
            }
          },
        },
      },
    )

    const { data: { user } } = await supabase.auth.getUser()
    console.log('👤 [TOKEN-REFRESH] User check:', {
      hasUser: !!user,
      userId: user?.id
    })
    
    if (user) {
      const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString()
      
      console.log('💾 [TOKEN-REFRESH] Updating database:', {
        userId: user.id,
        expiresAt,
        hasAccessToken: !!tokenData.access_token
      })
      
      const { data, error } = await supabase
        .from('user_connected_accounts')
        .update({
          access_token: tokenData.access_token,
          expires_at: expiresAt,
          last_used_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('provider', 'google')

      if (error) {
        console.log('❌ [TOKEN-REFRESH] Database update error:', error)
      } else {
        console.log('✅ [TOKEN-REFRESH] Database updated successfully:', data)
      }
    }

    console.log('🎉 [TOKEN-REFRESH] Sending success response')
    return NextResponse.json({
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in || 3600,
      success: true
    })

  } catch (error) {
    console.error('💥 [TOKEN-REFRESH] Unexpected error:', error)
    console.error('💥 [TOKEN-REFRESH] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
}
