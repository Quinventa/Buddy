import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [OAUTH-TEST] Testing Google OAuth configuration...')
    
    // Check environment variables
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
    
    const config = {
      hasClientId: !!googleClientId,
      hasClientSecret: !!googleClientSecret,
      clientIdLength: googleClientId?.length || 0,
      clientSecretLength: googleClientSecret?.length || 0,
      clientIdPrefix: googleClientId?.substring(0, 10) + '...',
      environment: process.env.NODE_ENV
    }
    
    console.log('📋 [OAUTH-TEST] Configuration:', config)
    
    // Test with a dummy refresh token to see error format
    const testRefreshBody = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: 'dummy_token',
      client_id: googleClientId!,
      client_secret: googleClientSecret!,
    })
    
    console.log('🧪 [OAUTH-TEST] Testing Google token endpoint with dummy data...')
    
    const testRefreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: testRefreshBody,
    })
    
    const testRefreshData = await testRefreshResponse.json()
    console.log('🧪 [OAUTH-TEST] Test refresh response:', {
      status: testRefreshResponse.status,
      error: testRefreshData.error,
      errorDescription: testRefreshData.error_description
    })
    
    return NextResponse.json({
      success: true,
      config,
      testRefresh: {
        status: testRefreshResponse.status,
        error: testRefreshData.error,
        errorDescription: testRefreshData.error_description,
        note: 'This should show invalid_grant error for dummy token - if you see invalid_client, the OAuth credentials are wrong'
      }
    })
    
  } catch (error) {
    console.error('❌ [OAUTH-TEST] Test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : error
    }, { status: 500 })
  }
}