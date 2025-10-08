// Calendar integration utilities for buddy chat
import { createClient } from "@/lib/supabase"

interface CalendarEventRequest {
  summary: string
  description?: string
  startDateTime: string
  endDateTime: string
  location?: string
}

export interface CalendarStatus {
  isConnectedToGoogle: boolean
  hasCalendarPermission: boolean
  accessToken: string | null
}

// Check user's calendar connection status
export async function getCalendarStatus(): Promise<CalendarStatus> {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        isConnectedToGoogle: false,
        hasCalendarPermission: false,
        accessToken: null
      }
    }

    const isGoogleAuthUser = user.app_metadata?.provider === 'google' || 
                            user.user_metadata?.iss?.includes('accounts.google.com')
    
    // Get current session data
    const { data: session } = await supabase.auth.getSession()
    const sessionAccessToken = session?.session?.provider_token
    const sessionRefreshToken = session?.session?.provider_refresh_token

    // First, check for a stored Google connection in the database
    let connectedAccount = null
    try {
      const { data, error } = await supabase
        .from('user_connected_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .eq('is_active', true)
        .single()
      
      if (error) {
        console.log('[v0] Connected accounts table not accessible:', error.message)
        // Table might not exist or have permission issues - continue with session token
      } else {
        connectedAccount = data
      }
    } catch (dbError) {
      console.log('[v0] Database error accessing connected accounts:', dbError)
      // Continue without stored connection data
    }

    let accessToken: string | null = null

    if (connectedAccount && connectedAccount.access_token) {
      // Check if the stored token is still valid
      const now = new Date()
      const expiresAt = new Date(connectedAccount.expires_at)
      
      if (expiresAt > now) {
        accessToken = connectedAccount.access_token
      } else if (connectedAccount.refresh_token) {
        // Try to refresh the token
        try {
          console.log('[v0] Attempting to refresh Google token:', {
            hasRefreshToken: !!connectedAccount.refresh_token,
            tokenLength: connectedAccount.refresh_token?.length || 0,
            expiresAt: connectedAccount.expires_at
          })
          const refreshResult = await refreshGoogleToken(connectedAccount.refresh_token)
          if (refreshResult.success && refreshResult.access_token) {
            accessToken = refreshResult.access_token
            
            // Update the stored token
            try {
              await supabase
                .from('user_connected_accounts')
                .update({
                  access_token: refreshResult.access_token,
                  expires_at: new Date(Date.now() + (refreshResult.expires_in || 3600) * 1000).toISOString(),
                  last_used_at: new Date().toISOString()
                })
                .eq('id', connectedAccount.id)
            } catch (updateError) {
              console.log('[v0] Could not update stored token:', updateError)
              // Continue with refreshed token even if we can't store it
            }
          }
        } catch (refreshError) {
          console.error('[v0] Failed to refresh Google token:', refreshError)
        }
      } else {
        console.log('[v0] No refresh token available for Google account')
      }
    }

    // If no stored token but user signed in with Google, use session token
    if (!accessToken && sessionAccessToken && isGoogleAuthUser) {
      accessToken = sessionAccessToken
      
      // If user signed in with Google but we don't have a stored connection, create one
      if (!connectedAccount && sessionRefreshToken) {
        try {
          const expiresAt = session?.session?.expires_at 
            ? new Date(session.session.expires_at * 1000).toISOString()
            : new Date(Date.now() + 3600 * 1000).toISOString()

          await supabase.from("user_connected_accounts").upsert({
            user_id: user.id,
            provider: "google",
            provider_user_id: user.user_metadata.sub || user.id,
            email: user.email,
            name: user.user_metadata.full_name || user.email,
            avatar_url: user.user_metadata.avatar_url,
            access_token: sessionAccessToken,
            refresh_token: sessionRefreshToken,
            expires_at: expiresAt,
            connected_at: new Date().toISOString(),
            last_used_at: new Date().toISOString(),
            is_active: true,
          })
          console.log("[v0] Auto-saved Google connection from sign-in session")
        } catch (dbError) {
          console.log("[v0] Could not auto-save Google connection (table may not exist):", dbError)
          // Continue without saving to database - use session token
        }
      }
    }

    const isConnectedToGoogle = Boolean(connectedAccount) || isGoogleAuthUser

    if (!accessToken) {
      return {
        isConnectedToGoogle,
        hasCalendarPermission: false,
        accessToken: null
      }
    }

    // Test if we can access calendar API
    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      const hasPermission = response.ok
      
      // Update last_used_at if we have a stored connection
      if (connectedAccount && hasPermission) {
        try {
          await supabase
            .from('user_connected_accounts')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', connectedAccount.id)
        } catch (updateError) {
          console.log('[v0] Could not update last_used_at:', updateError)
          // Continue - this is not critical
        }
      }

      return {
        isConnectedToGoogle,
        hasCalendarPermission: hasPermission,
        accessToken: hasPermission ? accessToken : null
      }
    } catch (error) {
      return {
        isConnectedToGoogle,
        hasCalendarPermission: false,
        accessToken: null
      }
    }
  } catch (error) {
    console.error('Error checking calendar status:', error)
    return {
      isConnectedToGoogle: false,
      hasCalendarPermission: false,
      accessToken: null
    }
  }
}

// Refresh Google access token using refresh token
async function refreshGoogleToken(refreshToken: string): Promise<{
  success: boolean
  access_token?: string
  expires_in?: number
  error?: string
}> {
  try {
    const response = await fetch('/api/auth/refresh-google-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || `HTTP ${response.status}` }
    }

    const data = await response.json()
    return {
      success: true,
      access_token: data.access_token,
      expires_in: data.expires_in || 3600
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Create a calendar event
export async function createCalendarEvent(
  eventData: CalendarEventRequest, 
  accessToken: string
): Promise<{ success: boolean; message: string; eventId?: string }> {
  try {
    const calendarEventData = {
      summary: eventData.summary,
      description: eventData.description,
      start: {
        dateTime: new Date(eventData.startDateTime).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: new Date(eventData.endDateTime).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      location: eventData.location
    }

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(calendarEventData)
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Failed to create event: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
    }

    const createdEvent = await response.json()
    return {
      success: true,
      message: `Event "${eventData.summary}" created successfully!`,
      eventId: createdEvent.id
    }
  } catch (error) {
    console.error('Error creating calendar event:', error)
    return {
      success: false,
      message: `Failed to create calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// Get Google Calendar timezone setting
export async function getGoogleCalendarTimezone(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/settings/timezone',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    )

    if (!response.ok) {
      console.error('[v0] Failed to fetch Google Calendar timezone:', response.status)
      return null
    }

    const data = await response.json()
    console.log('[v0] Fetched Google Calendar timezone:', data.value)
    return data.value
  } catch (error) {
    console.error('[v0] Error fetching Google Calendar timezone:', error)
    return null
  }
}
