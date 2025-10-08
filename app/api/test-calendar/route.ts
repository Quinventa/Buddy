import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [CALENDAR-TEST] Testing full Google Calendar functionality...')
    
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
        message: 'Please sign in with Google to test calendar functionality'
      }, { status: 401 })
    }

    console.log('👤 [CALENDAR-TEST] Testing for user:', user.id)

    // Check connected accounts
    const { data: connectedAccounts, error: accountsError } = await supabase
      .from('user_connected_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')

    const googleAccount = connectedAccounts?.[0]
    
    if (!googleAccount) {
      return NextResponse.json({
        success: false,
        error: 'No Google account connected',
        message: 'Please connect your Google account first',
        recommendations: [
          'Sign out and sign back in with Google',
          'Ensure Supabase OAuth scopes include calendar permissions'
        ]
      })
    }

    console.log('🔗 [CALENDAR-TEST] Found Google account:', {
      id: googleAccount.id,
      email: googleAccount.email,
      hasAccessToken: !!googleAccount.access_token,
      hasRefreshToken: !!googleAccount.refresh_token,
      expiresAt: googleAccount.expires_at
    })

    // Test token validity by accessing calendar
    let accessToken = googleAccount.access_token
    const now = new Date()
    const expiresAt = new Date(googleAccount.expires_at)
    
    if (now >= expiresAt) {
      console.log('🔄 [CALENDAR-TEST] Token expired, attempting refresh...')
      
      if (!googleAccount.refresh_token) {
        return NextResponse.json({
          success: false,
          error: 'Access token expired and no refresh token available',
          message: 'Please sign out and sign back in with Google',
          tokenStatus: 'expired_no_refresh'
        })
      }

      // Try to refresh the token
      try {
        const refreshResponse = await fetch(`${request.nextUrl.origin}/api/auth/refresh-google-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: googleAccount.refresh_token }),
        })
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          accessToken = refreshData.access_token
          console.log('✅ [CALENDAR-TEST] Token refresh successful')
        } else {
          const errorData = await refreshResponse.json()
          return NextResponse.json({
            success: false,
            error: 'Token refresh failed',
            message: 'The refresh token may be expired. Please sign out and sign back in.',
            details: errorData,
            tokenStatus: 'refresh_failed'
          })
        }
      } catch (refreshError) {
        return NextResponse.json({
          success: false,
          error: 'Token refresh error',
          details: refreshError,
          tokenStatus: 'refresh_error'
        })
      }
    }

    // Test calendar access
    console.log('📅 [CALENDAR-TEST] Testing calendar access...')
    
    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const calendarAccess = calendarResponse.ok
    let calendarError = null
    
    if (!calendarAccess) {
      const errorData = await calendarResponse.json().catch(() => ({ error: 'Unknown error' }))
      calendarError = {
        status: calendarResponse.status,
        error: errorData
      }
      console.error('❌ [CALENDAR-TEST] Calendar access failed:', calendarError)
    } else {
      console.log('✅ [CALENDAR-TEST] Calendar access successful')
    }

    // Test calendar events list
    let eventsAccess = false
    let eventsError = null
    
    if (calendarAccess) {
      console.log('📋 [CALENDAR-TEST] Testing events access...')
      
      const eventsResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=5',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      eventsAccess = eventsResponse.ok
      
      if (!eventsAccess) {
        const errorData = await eventsResponse.json().catch(() => ({ error: 'Unknown error' }))
        eventsError = {
          status: eventsResponse.status,
          error: errorData
        }
        console.error('❌ [CALENDAR-TEST] Events access failed:', eventsError)
      } else {
        const eventsData = await eventsResponse.json()
        console.log('✅ [CALENDAR-TEST] Events access successful, found', eventsData.items?.length || 0, 'events')
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      googleAccount: {
        email: googleAccount.email,
        hasAccessToken: !!googleAccount.access_token,
        hasRefreshToken: !!googleAccount.refresh_token,
        tokenExpired: now >= expiresAt,
        expiresAt: googleAccount.expires_at
      },
      tests: {
        calendarAccess,
        eventsAccess,
        tokenRefresh: now >= expiresAt ? 'tested' : 'not_needed'
      },
      errors: {
        calendarError,
        eventsError
      },
      recommendations: [
        ...(calendarAccess ? [] : ['Calendar access failed - check OAuth scopes in Supabase']),
        ...(eventsAccess ? [] : ['Events access failed - check calendar.events scope']),
        ...(!googleAccount.refresh_token ? ['No refresh token - users need to re-authenticate'] : [])
      ]
    })

  } catch (error) {
    console.error('❌ [CALENDAR-TEST] Test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : error
    }, { status: 500 })
  }
}