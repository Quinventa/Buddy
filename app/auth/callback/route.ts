//file was called page.tsx
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const connection = searchParams.get("connection") // For account connections
  let next = searchParams.get("next") ?? "/"

  console.log("[v0] OAuth callback - Code:", code ? "present" : "missing")
  console.log("[v0] OAuth callback - Connection type:", connection)

  if (!next.startsWith("/")) {
    next = "/"
  }

  if (code) {
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
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      },
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      console.log("[v0] OAuth callback - Session established successfully")

      // If this is a connection request, handle it differently
      if (connection === "google") {
        // Store the connection in the database
        const { user, session } = data
        if (user && session.provider_token) {
          try {
            // Calculate proper expiration time (Google tokens typically expire in 1 hour)
            const expiresAt = session.expires_at 
              ? new Date(session.expires_at * 1000).toISOString()
              : new Date(Date.now() + 3600 * 1000).toISOString()

            await supabase.from("user_connected_accounts").upsert({
              user_id: user.id,
              provider: "google",
              provider_user_id: user.user_metadata.sub,
              email: user.email,
              name: user.user_metadata.full_name,
              avatar_url: user.user_metadata.avatar_url,
              access_token: session.provider_token,
              refresh_token: session.provider_refresh_token,
              expires_at: expiresAt,
              connected_at: new Date().toISOString(),
              last_used_at: new Date().toISOString(),
              is_active: true,
            })
            console.log("[v0] Google account connection saved successfully with expiration:", expiresAt)
          } catch (dbError) {
            console.error("[v0] Error saving Google connection:", dbError)
          }
        }
        return NextResponse.redirect(`${origin}/?connected=google`)
      }

      // Regular sign-in flow - also save Google connection if it's a Google sign-in
      const { user, session } = data
      const isGoogleSignIn = user?.app_metadata?.provider === 'google' || 
                            user?.user_metadata?.iss?.includes('accounts.google.com')
      
      if (isGoogleSignIn && user) {
        try {
          console.log("[v0] Google sign-in detected, auto-saving to connected_accounts")
          console.log("[v0] Has provider_token:", !!session.provider_token)
          console.log("[v0] Has provider_refresh_token:", !!session.provider_refresh_token)
          
          const expiresAt = session.expires_at 
            ? new Date(session.expires_at * 1000).toISOString()
            : new Date(Date.now() + 3600 * 1000).toISOString()

          // Check if connection already exists
          const { data: existingConnection } = await supabase
            .from("user_connected_accounts")
            .select("id, access_token, refresh_token")
            .eq("user_id", user.id)
            .eq("provider", "google")
            .single()

          if (existingConnection) {
            // Update existing connection with new tokens if available
            if (session.provider_token || session.provider_refresh_token) {
              const updateData: any = {
                last_used_at: new Date().toISOString(),
                is_active: true,
              }
              
              if (session.provider_token) {
                updateData.access_token = session.provider_token
                updateData.expires_at = expiresAt
              }
              
              if (session.provider_refresh_token) {
                updateData.refresh_token = session.provider_refresh_token
              }

              await supabase
                .from("user_connected_accounts")
                .update(updateData)
                .eq("id", existingConnection.id)
              
              console.log("[v0] Updated existing Google connection from sign-in")
            }
          } else {
            // Create new connection
            await supabase.from("user_connected_accounts").insert({
              user_id: user.id,
              provider: "google",
              provider_user_id: user.user_metadata.sub || user.id,
              email: user.email,
              name: user.user_metadata.full_name || user.user_metadata.name || user.email?.split('@')[0],
              avatar_url: user.user_metadata.avatar_url || user.user_metadata.picture,
              access_token: session.provider_token || null,
              refresh_token: session.provider_refresh_token || null,
              expires_at: expiresAt,
              connected_at: new Date().toISOString(),
              last_used_at: new Date().toISOString(),
              is_active: true,
            })
            console.log("[v0] ✅ Auto-created Google connection from sign-in")
          }
        } catch (dbError) {
          console.error("[v0] ❌ Error auto-saving Google sign-in connection:", dbError)
          // Don't fail the login if we can't save the connection
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocalEnv = process.env.NODE_ENV === "development"

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }

    console.error("[v0] OAuth callback error:", error)
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/sign-in?error=oauth_callback_error`)
}
