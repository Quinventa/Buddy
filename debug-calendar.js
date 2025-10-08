// Debug script to test calendar status
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function debugCalendarStatus() {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // 1. Check if user is signed in
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('1. User check:', { user: user?.email, error: userError })
    
    if (!user) {
      console.log('No user signed in')
      return
    }
    
    // 2. Check connected accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('user_connected_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')
    
    console.log('2. Connected accounts:', { 
      count: accounts?.length, 
      accounts: accounts?.map(a => ({ email: a.email, hasToken: !!a.access_token })),
      error: accountsError 
    })
    
    if (accounts?.[0]?.access_token) {
      // 3. Test calendar API access
      const token = accounts[0].access_token
      console.log('3. Testing calendar API with token:', token.substring(0, 20) + '...')
      
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      console.log('4. Calendar API response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log('5. Calendar API error:', errorText)
      }
    }
    
  } catch (error) {
    console.error('Debug error:', error)
  }
}

debugCalendarStatus()
