import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [TOKEN-DEBUG] Debugging token refresh issue...')
    
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
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated',
        details: userError
      })
    }

    console.log('👤 [TOKEN-DEBUG] User found:', user.id)

    // Check connected accounts
    const { data: connectedAccounts, error: accountsError } = await supabase
      .from('user_connected_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')

    console.log('🔗 [TOKEN-DEBUG] Connected accounts:', {
      count: connectedAccounts?.length || 0,
      accounts: connectedAccounts?.map(acc => ({
        id: acc.id,
        email: acc.email,
        hasAccessToken: !!acc.access_token,
        hasRefreshToken: !!acc.refresh_token,
        accessTokenLength: acc.access_token?.length || 0,
        refreshTokenLength: acc.refresh_token?.length || 0,
        expiresAt: acc.expires_at,
        isActive: acc.is_active
      }))
    })

    // Get session info
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('🎫 [TOKEN-DEBUG] Session info:', {
      hasSession: !!session,
      provider: session?.user?.app_metadata?.provider,
      hasProviderToken: !!session?.provider_token,
      hasProviderRefreshToken: !!session?.provider_refresh_token,
      providerTokenLength: session?.provider_token?.length || 0,
      providerRefreshTokenLength: session?.provider_refresh_token?.length || 0
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        provider: user.app_metadata?.provider
      },
      connectedAccounts: connectedAccounts?.map(acc => ({
        id: acc.id,
        email: acc.email,
        hasAccessToken: !!acc.access_token,
        hasRefreshToken: !!acc.refresh_token,
        accessTokenLength: acc.access_token?.length || 0,
        refreshTokenLength: acc.refresh_token?.length || 0,
        expiresAt: acc.expires_at,
        isActive: acc.is_active
      })),
      session: {
        hasSession: !!session,
        provider: session?.user?.app_metadata?.provider,
        hasProviderToken: !!session?.provider_token,
        hasProviderRefreshToken: !!session?.provider_refresh_token,
        providerTokenLength: session?.provider_token?.length || 0,
        providerRefreshTokenLength: session?.provider_refresh_token?.length || 0
      }
    })

  } catch (error) {
    console.error('❌ [TOKEN-DEBUG] Debug failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      details: error
    }, { status: 500 })
  }
}