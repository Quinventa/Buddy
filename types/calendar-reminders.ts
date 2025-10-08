// Calendar reminder system types
export interface CalendarReminderPreferences {
  id: string
  user_id: string
  default_reminder_minutes: number
  reminders_enabled: boolean
  show_notification: boolean
  speak_reminder: boolean
  remind_for_all_day_events: boolean
  all_day_event_reminder_time: string // Time in HH:MM format
  available_reminder_times: number[] // Array of minutes
  created_at: string
  updated_at: string
}

export interface CalendarEventReminder {
  id: string
  user_id: string
  google_event_id: string
  event_title: string
  event_start_time: string
  event_end_time?: string
  event_description?: string
  event_location?: string
  reminder_time: string
  minutes_before_event: number
  is_triggered: boolean
  triggered_at?: string
  is_dismissed: boolean
  dismissed_at?: string
  reminder_message?: string
  created_at: string
  updated_at: string
}

export interface ReminderTimeOption {
  value: number // minutes
  label: string
  group?: 'minutes' | 'hours' | 'days'
}

// Helper function to get reminder time options
export function getReminderTimeOptions(): ReminderTimeOption[] {
  return [
    { value: 1, label: '1 minute', group: 'minutes' },
    { value: 5, label: '5 minutes', group: 'minutes' },
    { value: 15, label: '15 minutes', group: 'minutes' },
    { value: 30, label: '30 minutes', group: 'minutes' },
    { value: 45, label: '45 minutes', group: 'minutes' },
    { value: 60, label: '1 hour', group: 'hours' },
    { value: 120, label: '2 hours', group: 'hours' },
    { value: 240, label: '4 hours', group: 'hours' },
    { value: 480, label: '8 hours', group: 'hours' },
    { value: 1440, label: '1 day', group: 'days' },
  ]
}

// Helper function to format reminder time
export function formatReminderTime(minutes: number): string {
  if (minutes < 60) {
    return minutes === 1 ? '1 minute' : `${minutes} minutes`
  } else if (minutes < 1440) {
    const hours = minutes / 60
    return hours === 1 ? '1 hour' : `${hours} hours`
  } else {
    const days = minutes / 1440
    return days === 1 ? '1 day' : `${days} days`
  }
}

// Helper function to generate reminder message
export function generateReminderMessage(
  eventTitle: string,
  eventStartTime: Date,
  minutesBefore: number,
  eventLocation?: string
): string {
  const timeText = eventStartTime.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  
  const locationText = eventLocation ? ` at ${eventLocation}` : ''
  const timeUntil = formatReminderTime(minutesBefore)
  
  return `Reminder: "${eventTitle}" starts in ${timeUntil} at ${timeText}${locationText}.`
}