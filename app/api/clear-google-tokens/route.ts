import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 [CLEAR-TOKENS] Starting Google token cleanup...')
    
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
      }, { status: 401 })
    }

    console.log('👤 [CLEAR-TOKENS] Clearing tokens for user:', user.id)

    // Delete Google connected accounts for this user
    const { data, error } = await supabase
      .from('user_connected_accounts')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', 'google')

    if (error) {
      console.error('❌ [CLEAR-TOKENS] Error clearing tokens:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to clear tokens',
        details: error
      }, { status: 500 })
    }

    console.log('✅ [CLEAR-TOKENS] Successfully cleared Google tokens')

    return NextResponse.json({
      success: true,
      message: 'Google connections cleared. Please sign out and sign back in to get calendar permissions.',
      clearedConnections: data
    })

  } catch (error) {
    console.error('❌ [CLEAR-TOKENS] Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}