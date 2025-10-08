// Calendar event monitoring and reminder scheduling service
import { supabase } from "@/lib/supabase"
import { 
  loadCalendarReminderPreferences, 
  createCalendarEventReminder, 
  getPendingCalendarReminders,
  markReminderAsTriggered 
} from "@/lib/database"
import { generateReminderMessage } from "@/types/calendar-reminders"
import type { CalendarReminderPreferences, CalendarEventReminder } from "@/types/calendar-reminders"

interface GoogleCalendarEvent {
  id: string
  summary: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  description?: string
  location?: string
}

export class CalendarReminderService {
  private static instance: CalendarReminderService
  private monitoringInterval: NodeJS.Timeout | null = null
  private isMonitoring = false
  private currentUserId: string | null = null
  private userTimezone: string = 'UTC'

  static getInstance(): CalendarReminderService {
    if (!CalendarReminderService.instance) {
      CalendarReminderService.instance = new CalendarReminderService()
    }
    return CalendarReminderService.instance
  }

  // Start monitoring calendar events for the current user
  async startMonitoring(userId: string, timezone: string = 'UTC'): Promise<void> {
    if (this.isMonitoring) {
      console.log('[CALENDAR-REMINDER] Already monitoring')
      return
    }

    console.log('[CALENDAR-REMINDER] Starting calendar event monitoring for user:', userId, 'with timezone:', timezone)
    this.isMonitoring = true
    this.currentUserId = userId
    this.userTimezone = timezone

    // Check for new events immediately
    await this.checkAndScheduleReminders(userId, timezone)

    // Set up periodic checking (every 2 minutes for more responsive reminders)
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkAndScheduleReminders(userId, timezone)
        await this.processPendingReminders()
      } catch (error) {
        console.error('[CALENDAR-REMINDER] Error in monitoring interval:', error)
      }
    }, 2 * 60 * 1000) // 2 minutes

    console.log('[CALENDAR-REMINDER] Monitoring started')
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    this.isMonitoring = false
    console.log('[CALENDAR-REMINDER] Monitoring stopped')
  }

  // Check upcoming calendar events and schedule reminders
  private async checkAndScheduleReminders(userId: string, timezone: string = 'UTC'): Promise<void> {
    try {
      console.log('[CALENDAR-REMINDER] Checking for upcoming events to schedule reminders...')

      // Get user's reminder preferences
      const preferences = await loadCalendarReminderPreferences()
      if (!preferences || !preferences.reminders_enabled) {
        console.log('[CALENDAR-REMINDER] Reminders disabled for user')
        return
      }

      // Get upcoming calendar events from Google Calendar
      const events = await this.getUpcomingCalendarEvents(userId)
      console.log('[CALENDAR-REMINDER] Found', events.length, 'upcoming events')

      for (const event of events) {
        await this.scheduleRemindersForEvent(event, preferences, timezone)
      }
    } catch (error) {
      console.error('[CALENDAR-REMINDER] Error checking and scheduling reminders:', error)
    }
  }

  // Get upcoming calendar events from Google Calendar API
  private async getUpcomingCalendarEvents(userId: string): Promise<GoogleCalendarEvent[]> {
    try {
      // Get user's Google access token
      const { data: account } = await supabase
        .from('user_connected_accounts')
        .select('access_token, refresh_token, expires_at')
        .eq('user_id', userId)
        .eq('provider', 'google')
        .eq('is_active', true)
        .single()

      if (!account || !account.access_token) {
        console.log('[CALENDAR-REMINDER] No Google Calendar access token found')
        return []
      }

      // Check if token needs refresh
      const now = new Date()
      const expiresAt = new Date(account.expires_at)
      if (now >= expiresAt && account.refresh_token) {
        console.log('[CALENDAR-REMINDER] Access token expired, attempting refresh...')
        try {
          const refreshResponse = await fetch('/api/auth/refresh-google-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken: account.refresh_token }),
          })
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json()
            console.log('[CALENDAR-REMINDER] Token refresh successful')
            // Use the new access token for this request
            account.access_token = refreshData.access_token
          } else {
            const errorText = await refreshResponse.text()
            console.error('[CALENDAR-REMINDER] Token refresh failed:', {
              status: refreshResponse.status,
              statusText: refreshResponse.statusText,
              error: errorText
            })
            console.error('[CALENDAR-REMINDER] ⚠️ Please check: 1) GOOGLE_CLIENT_SECRET in .env, 2) Refresh token is valid, 3) User needs to re-authenticate')
            return []
          }
        } catch (refreshError) {
          console.error('[CALENDAR-REMINDER] Token refresh error:', refreshError)
          return []
        }
      } else if (now >= expiresAt) {
        console.log('[CALENDAR-REMINDER] Access token expired and no refresh token available')
        return []
      }

      // Get events from Google Calendar API
      const timeMin = new Date().toISOString()
      const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Next 7 days

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${encodeURIComponent(timeMin)}&` +
        `timeMax=${encodeURIComponent(timeMax)}&` +
        `singleEvents=true&` +
        `orderBy=startTime&` +
        `maxResults=50`,
        {
          headers: {
            'Authorization': `Bearer ${account.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        console.error('[CALENDAR-REMINDER] Failed to fetch calendar events:', response.status, response.statusText)
        return []
      }

      const data = await response.json()
      return data.items || []
    } catch (error) {
      console.error('[CALENDAR-REMINDER] Error fetching calendar events:', error)
      return []
    }
  }

  // Schedule reminders for a specific event
  private async scheduleRemindersForEvent(
    event: GoogleCalendarEvent, 
    preferences: CalendarReminderPreferences,
    timezone: string = 'UTC'
  ): Promise<void> {
    try {
      // Skip events without start time
      if (!event.start.dateTime && !event.start.date) {
        return
      }

      const isAllDayEvent = !!event.start.date && !event.start.dateTime
      
      // Skip all-day events if user doesn't want reminders for them
      if (isAllDayEvent && !preferences.remind_for_all_day_events) {
        return
      }

      let eventStartTime: Date

      if (isAllDayEvent) {
        // For all-day events, use the user's preferred reminder time IN THEIR TIMEZONE
        // Parse the date and convert to user's timezone
        const eventDate = new Date(event.start.date + 'T00:00:00')
        const [hours, minutes] = preferences.all_day_event_reminder_time.split(':')
        
        // Create date string in user's timezone
        const dateStr = eventDate.toLocaleDateString('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' })
        const [month, day, year] = dateStr.split('/')
        const timeStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`
        
        eventStartTime = new Date(timeStr)
        console.log('[CALENDAR-REMINDER] All-day event reminder time in timezone', timezone, ':', eventStartTime.toISOString())
      } else {
        // For timed events, parse the datetime (already in ISO format with timezone info)
        eventStartTime = new Date(event.start.dateTime!)
        console.log('[CALENDAR-REMINDER] Timed event start in timezone', event.start.timeZone || 'UTC', ':', eventStartTime.toISOString())
      }

      // Calculate reminder time
      const reminderTime = new Date(eventStartTime.getTime() - (preferences.default_reminder_minutes * 60 * 1000))
      const now = new Date()
      
      console.log('[CALENDAR-REMINDER] Event details:', {
        eventTitle: event.summary,
        eventStartTime: eventStartTime.toISOString(),
        eventStartLocal: eventStartTime.toLocaleString('en-US', { timeZone: timezone }),
        reminderTime: reminderTime.toISOString(),
        reminderTimeLocal: reminderTime.toLocaleString('en-US', { timeZone: timezone }),
        minutesBefore: preferences.default_reminder_minutes,
        currentTime: now.toISOString(),
        currentTimeLocal: now.toLocaleString('en-US', { timeZone: timezone }),
        isPast: reminderTime <= now
      })

      // Skip if reminder time is in the past (with 1 minute buffer)
      if (reminderTime < new Date(now.getTime() - 60000)) {
        console.log('[CALENDAR-REMINDER] ⏭️ Skipping reminder - time already passed:', event.summary)
        return
      }

      // Check if we already have a reminder for this event
      const { data: existingReminder } = await supabase
        .from('calendar_event_reminders')
        .select('id')
        .eq('google_event_id', event.id)
        .eq('minutes_before_event', preferences.default_reminder_minutes)
        .single()

      if (existingReminder) {
        console.log('[CALENDAR-REMINDER] Reminder already exists for event:', event.summary)
        return
      }

      // Generate reminder message
      const reminderMessage = generateReminderMessage(
        event.summary || 'Untitled Event',
        eventStartTime,
        preferences.default_reminder_minutes,
        event.location
      )

      // Create the reminder
      const reminderData = {
        google_event_id: event.id,
        event_title: event.summary || 'Untitled Event',
        event_start_time: eventStartTime.toISOString(),
        event_end_time: event.end?.dateTime || event.end?.date || null,
        event_description: event.description || null,
        event_location: event.location || null,
        reminder_time: reminderTime.toISOString(),
        minutes_before_event: preferences.default_reminder_minutes,
        reminder_message: reminderMessage
      }

      const result = await createCalendarEventReminder(reminderData)
      if (result) {
        console.log('[CALENDAR-REMINDER] ✅ Successfully created reminder for event:', event.summary)
        console.log('[CALENDAR-REMINDER] 📅 Event time:', eventStartTime.toLocaleString('en-US', { timeZone: timezone }))
        console.log('[CALENDAR-REMINDER] ⏰ Reminder will trigger at:', reminderTime.toLocaleString('en-US', { timeZone: timezone }))
        console.log('[CALENDAR-REMINDER] ⏱️ Minutes before:', preferences.default_reminder_minutes)
      } else {
        console.error('[CALENDAR-REMINDER] ❌ Failed to create reminder for event:', event.summary)
      }
    } catch (error) {
      console.error('[CALENDAR-REMINDER] ❌ Error scheduling reminder for event:', event.summary, error)
    }
  }

  // Process pending reminders (trigger notifications)
  async processPendingReminders(): Promise<CalendarEventReminder[]> {
    try {
      console.log('[CALENDAR-REMINDER] Checking for pending reminders at:', new Date().toISOString())
      const pendingReminders = await getPendingCalendarReminders()
      console.log('[CALENDAR-REMINDER] Found', pendingReminders.length, 'pending reminders')

      if (pendingReminders.length > 0) {
        console.log('[CALENDAR-REMINDER] Pending reminders details:', pendingReminders.map(r => ({
          id: r.id,
          event_title: r.event_title,
          reminder_time: r.reminder_time,
          minutes_before: r.minutes_before_event,
          is_triggered: r.is_triggered
        })))
      }

      const triggeredReminders: CalendarEventReminder[] = []

      for (const reminder of pendingReminders) {
        try {
          console.log('[CALENDAR-REMINDER] Processing reminder:', reminder.event_title, 'scheduled for:', reminder.reminder_time)
          // Mark reminder as triggered
          await markReminderAsTriggered(reminder.id)
          triggeredReminders.push(reminder)
          console.log('[CALENDAR-REMINDER] ✅ Successfully triggered reminder:', reminder.event_title)
        } catch (error) {
          console.error('[CALENDAR-REMINDER] ❌ Error triggering reminder:', reminder.id, error)
        }
      }

      if (triggeredReminders.length > 0) {
        console.log('[CALENDAR-REMINDER] 🔔 Total reminders triggered:', triggeredReminders.length)
      }

      return triggeredReminders
    } catch (error) {
      console.error('[CALENDAR-REMINDER] Error processing pending reminders:', error)
      return []
    }
  }

  // Manual check for immediate testing
  async checkNow(userId: string, timezone: string = 'UTC'): Promise<CalendarEventReminder[]> {
    console.log('[CALENDAR-REMINDER] Manual check requested with timezone:', timezone)
    await this.checkAndScheduleReminders(userId, timezone)
    return await this.processPendingReminders()
  }
}

// Export singleton instance
export const calendarReminderService = CalendarReminderService.getInstance()