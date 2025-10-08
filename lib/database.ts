import { supabase } from "@/lib/supabase"
import type { BuddySettings, BuddyMessage, UIPreferences } from "@/types/buddy"

export type DatabaseReminder = {
  id: string
  text: string
  scheduled_for: string
  completed: boolean
  created_at: string
}

// Settings operations
export async function loadUserSettings(): Promise<BuddySettings | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] Loading settings for user:", user?.id)

    if (!user) {
      console.log("[v0] No authenticated user found")
      return null
    }

    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle()

        if (error) {
          if (error.code === "PGRST204" && retryCount < maxRetries - 1) {
            console.log(`[v0] Schema cache error, retrying... (${retryCount + 1}/${maxRetries})`)
            retryCount++
            await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second
            continue
          }
          console.error("[v0] Error loading settings:", JSON.stringify(error, null, 2))
          return null
        }

        if (!data) {
          console.log("[v0] No settings found for user, returning defaults")
          return null
        }

        console.log("[v0] Successfully loaded settings:", data)
        console.log("[v0] Raw use_emojis value from database:", data.use_emojis)
        console.log("[v0] Processed useEmojis value:", data.use_emojis !== undefined ? data.use_emojis : true)
        return {
          userName: data.name || "",
          tone: data.tone || "gentle",
          pace: data.pace || "slow",
          useEmojis: data.use_emojis !== undefined ? data.use_emojis : true, // Load from database
          humor: data.humor_level === 1 ? "never" : data.humor_level === 5 ? "often" : "sometimes",
          revealBackstory: data.backstory_enabled ? "natural-fit" : "when-asked",
          backstory: "I'm Buddy, a friendly companion made to chat, listen, and help with simple daily tasks.",
          blockedTopics: data.blocked_topics || ["violence", "graphic injury", "unsafe instructions"],
          aiModel: data.ai_model || "auto",
          theme: data.theme || "auto",
          useVoice: data.voice_enabled || false,
          voiceMode: data.voice_mode || "traditional", // Add voiceMode field
          micDeviceId: data.selected_microphone || "",
          buddyVoiceURI: data.selected_voice || "",
          speechRate: data.speech_rate || 1.0,
          speechPitch: data.speech_pitch || 1.0,
          lipSyncMode: (data.lip_sync_mode as "text" | "voice" | "audio") || "text", // Add lipSyncMode field
          userAvatarUrl: data.user_avatar_url || "",
          buddyAvatarUrl: data.buddy_avatar_url || "",
          fontSize: (data.font_size as any) || "large", // Default to 'large' for elderly users
          timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone, // Add timezone field
        }
      } catch (innerError) {
        if (retryCount < maxRetries - 1) {
          console.log(`[v0] Retry ${retryCount + 1} failed, trying again...`)
          retryCount++
          await new Promise((resolve) => setTimeout(resolve, 1000))
          continue
        }
        throw innerError
      }
    }

    return null
  } catch (error) {
    console.error("[v0] Error loading user settings:", JSON.stringify(error, null, 2))
    return null
  }
}

export async function saveUserSettings(settings: BuddySettings): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] Saving settings for user:", user?.id)

    if (!user) {
      console.log("[v0] No authenticated user found for saving settings")
      return false
    }

    const settingsData = {
      user_id: user.id,
      name: settings.userName,
      tone: settings.tone,
      pace: settings.pace,
      use_emojis: settings.useEmojis, // Now enabled - column should exist
      humor_level: settings.humor === "never" ? 1 : settings.humor === "often" ? 5 : 3,
      backstory_enabled: settings.revealBackstory === "natural-fit",
      blocked_topics: settings.blockedTopics,
      ai_model: settings.aiModel,
      theme: settings.theme,
      voice_enabled: settings.useVoice,
      voice_mode: settings.voiceMode, // Add voiceMode field
      selected_microphone: settings.micDeviceId,
      selected_voice: settings.buddyVoiceURI,
      speech_rate: settings.speechRate,
      speech_pitch: settings.speechPitch,
      user_avatar_url: settings.userAvatarUrl,
      buddy_avatar_url: settings.buddyAvatarUrl,
      timezone: settings.timezone, // Add timezone field
      // font_size: settings.fontSize, // Commented out until column is added to database
      updated_at: new Date().toISOString(),
    }

    console.log("[v0] Attempting to save settings data:", settingsData)

    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        const { error } = await supabase.from("user_settings").upsert(settingsData, { onConflict: "user_id" })

        if (error) {
          if (error.code === "PGRST204" && retryCount < maxRetries - 1) {
            console.log(`[v0] Schema cache error, retrying... (${retryCount + 1}/${maxRetries})`)
            retryCount++
            await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second
            continue
          }
          console.error("[v0] Error saving settings:", JSON.stringify(error, null, 2))
          return false
        }

        console.log("[v0] Successfully saved settings")
        return true
      } catch (innerError) {
        if (retryCount < maxRetries - 1) {
          console.log(`[v0] Retry ${retryCount + 1} failed, trying again...`)
          retryCount++
          await new Promise((resolve) => setTimeout(resolve, 1000))
          continue
        }
        throw innerError
      }
    }

    return false
  } catch (error) {
    console.error("[v0] Error saving user settings:", JSON.stringify(error, null, 2))
    return false
  }
}

// Messages operations
export async function loadUserMessages(): Promise<BuddyMessage[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from("user_messages")
      .select("*")
      .eq("user_id", user.id)
      .order("timestamp", { ascending: true })
      .limit(50) // Limit to last 50 messages

    if (error) {
      console.error("Error loading messages:", error)
      return []
    }

    return data.map((msg) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant",
      content: msg.content,
      createdAt: new Date(msg.timestamp).getTime(),
    }))
  } catch (error) {
    console.error("Error loading user messages:", error)
    return []
  }
}

export async function saveUserMessage(message: BuddyMessage): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase.from("user_messages").insert({
      user_id: user.id,
      role: message.role,
      content: message.content,
      timestamp: new Date(message.createdAt).toISOString(),
    })

    if (error) {
      console.error("Error saving message:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error saving user message:", error)
    return false
  }
}

export async function deleteUserMessagesAfter(messageId: string): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false

    // First, get the timestamp of the message to delete from
    const { data: targetMessage, error: fetchError } = await supabase
      .from("user_messages")
      .select("timestamp")
      .eq("id", messageId)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !targetMessage) {
      console.error("Error finding target message:", fetchError)
      return false
    }

    // Delete all messages from this timestamp onwards
    const { error } = await supabase
      .from("user_messages")
      .delete()
      .eq("user_id", user.id)
      .gte("timestamp", targetMessage.timestamp)

    if (error) {
      console.error("Error deleting messages:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error deleting user messages:", error)
    return false
  }
}

// Reminders operations
export async function loadUserReminders(): Promise<DatabaseReminder[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] Loading reminders for user:", user?.id)

    if (!user) {
      console.log("[v0] No authenticated user found for reminders")
      return []
    }

    const { data, error } = await supabase
      .from("user_reminders")
      .select("*")
      .eq("user_id", user.id)
      .order("scheduled_for", { ascending: true })

    if (error) {
      console.error("[v0] Error loading reminders:", JSON.stringify(error, null, 2))
      return []
    }

    console.log("[v0] Successfully loaded reminders:", data?.length || 0, "items")
    return data || []
  } catch (error) {
    console.error("[v0] Error loading user reminders:", JSON.stringify(error, null, 2))
    return []
  }
}

export async function saveUserReminder(text: string, scheduledFor: Date): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from("user_reminders")
      .insert({
        user_id: user.id,
        text,
        scheduled_for: scheduledFor.toISOString(),
      })
      .select("id")
      .single()

    if (error) {
      console.error("Error saving reminder:", error)
      return null
    }

    return data.id
  } catch (error) {
    console.error("Error saving user reminder:", error)
    return null
  }
}

export async function updateReminderStatus(id: string, completed: boolean): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from("user_reminders")
      .update({
        completed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error updating reminder:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error updating reminder status:", error)
    return false
  }
}

export async function deleteUserReminder(id: string): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase.from("user_reminders").delete().eq("id", id).eq("user_id", user.id)

    if (error) {
      console.error("Error deleting reminder:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error deleting user reminder:", error)
    return false
  }
}

export async function getDueReminders(): Promise<any[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const now = new Date()
    const { data, error } = await supabase
      .from("user_reminders")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", false)
      .lte("scheduled_for", now.toISOString())
      .order("scheduled_for", { ascending: true })

    if (error) {
      console.error("Error getting due reminders:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error getting due reminders:", error)
    return []
  }
}

// UI Preferences operations
export async function loadUIPreferences(): Promise<UIPreferences | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] Loading UI preferences for user:", user?.id)

    if (!user) {
      console.log("[v0] No authenticated user found")
      return null
    }

    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        const { data, error } = await supabase.from("ui_preferences").select("*").eq("user_id", user.id).maybeSingle()

        if (error) {
          if (error.code === "PGRST204" && retryCount < maxRetries - 1) {
            console.log(`[v0] Schema cache error, retrying... (${retryCount + 1}/${maxRetries})`)
            retryCount++
            await new Promise((resolve) => setTimeout(resolve, 1000))
            continue
          }
          console.error("[v0] Error loading UI preferences:", JSON.stringify(error, null, 2))
          return null
        }

        if (!data) {
          console.log("[v0] No UI preferences found for user, returning defaults")
          return null
        }

        console.log("[v0] Successfully loaded UI preferences:", data)
        return {
          showHowToUse: data.show_how_to_use !== undefined ? data.show_how_to_use : true,
          manuallyEnabledGuide: data.manually_enabled_guide !== undefined ? data.manually_enabled_guide : false,
          themePreference: data.theme_preference || "auto",
          sidebarCollapsed: data.sidebar_collapsed || false,
          notificationStyle: data.notification_style || "toast",
          animationEnabled: data.animation_enabled !== undefined ? data.animation_enabled : true,
          compactMode: data.compact_mode || false,
          language: data.language || "en",
        }
      } catch (innerError) {
        if (retryCount < maxRetries - 1) {
          console.log(`[v0] Retry ${retryCount + 1} failed, trying again...`)
          retryCount++
          await new Promise((resolve) => setTimeout(resolve, 1000))
          continue
        }
        throw innerError
      }
    }

    return null
  } catch (error) {
    console.error("[v0] Error loading UI preferences:", JSON.stringify(error, null, 2))
    return null
  }
}

export async function saveUIPreferences(preferences: UIPreferences): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] Saving UI preferences for user:", user?.id)

    if (!user) {
      console.log("[v0] No authenticated user found for saving UI preferences")
      return false
    }

    const preferencesData = {
      user_id: user.id,
      show_how_to_use: preferences.showHowToUse,
      manually_enabled_guide: preferences.manuallyEnabledGuide,
      theme_preference: preferences.themePreference,
      sidebar_collapsed: preferences.sidebarCollapsed,
      notification_style: preferences.notificationStyle,
      animation_enabled: preferences.animationEnabled,
      compact_mode: preferences.compactMode,
      language: preferences.language,
      updated_at: new Date().toISOString(),
    }

    console.log("[v0] Attempting to save UI preferences data:", preferencesData)

    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        const { error } = await supabase.from("ui_preferences").upsert(preferencesData, { onConflict: "user_id" })

        if (error) {
          if (error.code === "PGRST204" && retryCount < maxRetries - 1) {
            console.log(`[v0] Schema cache error, retrying... (${retryCount + 1}/${maxRetries})`)
            retryCount++
            await new Promise((resolve) => setTimeout(resolve, 1000))
            continue
          }
          console.error("[v0] Error saving UI preferences:", JSON.stringify(error, null, 2))
          return false
        }

        console.log("[v0] Successfully saved UI preferences")
        return true
      } catch (innerError) {
        if (retryCount < maxRetries - 1) {
          console.log(`[v0] Retry ${retryCount + 1} failed, trying again...`)
          retryCount++
          await new Promise((resolve) => setTimeout(resolve, 1000))
          continue
        }
        throw innerError
      }
    }

    return false
  } catch (error) {
    console.error("[v0] Error saving UI preferences:", JSON.stringify(error, null, 2))
    return false
  }
}

// Calendar Reminder Preferences Operations
export async function loadCalendarReminderPreferences() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] Loading calendar reminder preferences for user:", user?.id)

    if (!user) {
      console.log("[v0] No authenticated user found")
      return null
    }

    const { data, error } = await supabase
      .from("user_calendar_reminder_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error loading calendar reminder preferences:", JSON.stringify(error, null, 2))
      return null
    }

    if (!data) {
      console.log("[v0] No calendar reminder preferences found, creating defaults")
      try {
        return await createDefaultCalendarReminderPreferences()
      } catch (createError) {
        console.log("[v0] Could not create default preferences (may already exist):", createError)
        // Try to fetch again in case it was created by another process
        const { data: retryData } = await supabase
          .from("user_calendar_reminder_preferences")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle()
        return retryData
      }
    }

    console.log("[v0] Successfully loaded calendar reminder preferences:", data)
    return data
  } catch (error) {
    console.error("[v0] Error loading calendar reminder preferences:", JSON.stringify(error, null, 2))
    return null
  }
}

export async function saveCalendarReminderPreferences(preferences: any) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] Saving calendar reminder preferences for user:", user?.id)

    if (!user) {
      console.log("[v0] No authenticated user found")
      return false
    }

    console.log("[v0] Attempting to save calendar reminder preferences:", preferences)

    const { data, error } = await supabase
      .from("user_calendar_reminder_preferences")
      .upsert({
        user_id: user.id,
        ...preferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving calendar reminder preferences:", JSON.stringify(error, null, 2))
      return false
    }

    console.log("[v0] Successfully saved calendar reminder preferences")
    return true
  } catch (error) {
    console.error("[v0] Error saving calendar reminder preferences:", JSON.stringify(error, null, 2))
    return false
  }
}

async function createDefaultCalendarReminderPreferences() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const defaultPreferences = {
      user_id: user.id,
      default_reminder_minutes: 30,
      reminders_enabled: true,
      show_notification: true,
      speak_reminder: true,
      remind_for_all_day_events: true,
      all_day_event_reminder_time: '09:00:00',
      available_reminder_times: [1, 5, 15, 30, 45, 60, 120, 240, 480, 1440]
    }

    const { data, error } = await supabase
      .from("user_calendar_reminder_preferences")
      .insert(defaultPreferences)
      .select()
      .single()

    if (error) {
      // Check if it's a duplicate key error
      if (error.code === '23505' || error.message.includes('duplicate key')) {
        console.log("[v0] Calendar reminder preferences already exist for user")
        // Fetch existing preferences instead
        const { data: existingData } = await supabase
          .from("user_calendar_reminder_preferences")
          .select("*")
          .eq("user_id", user.id)
          .single()
        return existingData
      }
      console.error("[v0] Error creating default calendar reminder preferences:", JSON.stringify(error, null, 2))
      return null
    }

    console.log("[v0] Created default calendar reminder preferences")
    return data
  } catch (error) {
    console.error("[v0] Error creating default calendar reminder preferences:", JSON.stringify(error, null, 2))
    return null
  }
}

// Calendar Event Reminders Operations
export async function createCalendarEventReminder(reminderData: any) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log("[v0] No authenticated user found")
      return null
    }

    console.log("[v0] Creating calendar event reminder:", reminderData)

    const { data, error } = await supabase
      .from("calendar_event_reminders")
      .insert({
        user_id: user.id,
        ...reminderData
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating calendar event reminder:", JSON.stringify(error, null, 2))
      return null
    }

    console.log("[v0] Successfully created calendar event reminder")
    return data
  } catch (error) {
    console.error("[v0] Error creating calendar event reminder:", JSON.stringify(error, null, 2))
    return null
  }
}

export async function getPendingCalendarReminders() {
  // Add a cache to prevent spam checking
  let lastReminderCheck: number = 0
  const REMINDER_CHECK_COOLDOWN = 5000 // 5 seconds minimum between checks

  try {
    // Rate limiting: Don't check more than once every 5 seconds
    const now = Date.now()
    if (now - lastReminderCheck < REMINDER_CHECK_COOLDOWN) {
      console.log("[v0] ⏭️ Skipping reminder check (cooldown active)")
      return []
    }
    lastReminderCheck = now

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // Reduce logging spam
      return []
    }

    const nowDate = new Date()
    const nowISO = nowDate.toISOString()
    
    // Only log every 10th check to reduce spam
    const shouldLog = Math.random() < 0.1
    if (shouldLog) {
      console.log("[v0] 🔍 Checking for calendar reminders at:", nowISO)
    }

    const { data, error } = await supabase
      .from("calendar_event_reminders")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_triggered", false)
      .eq("is_dismissed", false)
      .lte("reminder_time", nowISO)
      .order("reminder_time", { ascending: true })

    if (error) {
      console.error("[v0] ❌ Error loading pending calendar reminders:", error.code || error.message)
      return []
    }

    // Only log when reminders are found
    if (data && data.length > 0) {
      console.log("[v0] 📅 Found", data.length, "pending reminder(s)")
    }

    return data || []
  } catch (error) {
    console.error("[v0] Error loading pending calendar reminders:", error)
    return []
  }
}

export async function markReminderAsTriggered(reminderId: string) {
  try {
    const { error } = await supabase
      .from("calendar_event_reminders")
      .update({
        is_triggered: true,
        triggered_at: new Date().toISOString()
      })
      .eq("id", reminderId)

    if (error) {
      console.error("[v0] Error marking reminder as triggered:", JSON.stringify(error, null, 2))
      return false
    }

    console.log("[v0] Successfully marked reminder as triggered")
    return true
  } catch (error) {
    console.error("[v0] Error marking reminder as triggered:", JSON.stringify(error, null, 2))
    return false
  }
}

export async function dismissReminder(reminderId: string) {
  try {
    const { error } = await supabase
      .from("calendar_event_reminders")
      .update({
        is_dismissed: true,
        dismissed_at: new Date().toISOString()
      })
      .eq("id", reminderId)

    if (error) {
      console.error("[v0] ❌ Error dismissing reminder:", error.code || error.message)
      return false
    }

    console.log("[v0] ✅ Reminder dismissed")
    return true
  } catch (error) {
    console.error("[v0] Error dismissing reminder:", error)
    return false
  }
}
