"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, X, Clock, MapPin, Calendar, Volume2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { dismissReminder } from "@/lib/database"
import { calendarReminderService } from "@/lib/calendar-reminder-service"
import { useTranslation } from "@/lib/translations"
import type { CalendarEventReminder } from "@/types/calendar-reminders"

interface ReminderNotificationProps {
  reminder: CalendarEventReminder
  onDismiss: (reminderId: string) => void
  speakReminder?: boolean
}

export function ReminderNotification({ 
  reminder, 
  onDismiss, 
  speakReminder = true
}: ReminderNotificationProps) {
  const { toast } = useToast()
  const { t } = useTranslation()
  const [isDismissing, setIsDismissing] = React.useState(false)
  const hasSpoken = React.useRef(false)

  // Speak the reminder when component mounts
  React.useEffect(() => {
    if (speakReminder && !hasSpoken.current && reminder.reminder_message) {
      hasSpoken.current = true
      speakText(reminder.reminder_message)
    }
  }, [speakReminder, reminder.reminder_message])

  const speakText = async (text: string) => {
    try {
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel()
        
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 0.9
        utterance.pitch = 1.0
        utterance.volume = 0.8
        
        // Set language based on current language setting
        const currentLanguage = localStorage.getItem('buddy-language') || 'en'
        utterance.lang = currentLanguage === 'nl' ? 'nl-NL' : 'en-US'
        
        window.speechSynthesis.speak(utterance)
        console.log('[REMINDER] Speaking reminder:', text)
      }
    } catch (error) {
      console.error('[REMINDER] Error speaking reminder:', error)
    }
  }

  const handleDismiss = async () => {
    console.log("[REMINDER] 🚀 Starting dismissal for reminder:", reminder.id)
    setIsDismissing(true)
    try {
      console.log("[REMINDER] 📞 Calling dismissReminder function...")
      const success = await dismissReminder(reminder.id)
      console.log("[REMINDER] 📋 Dismiss result:", success)
      
      if (success) {
        console.log("[REMINDER] ✅ Dismissal successful, calling onDismiss...")
        onDismiss(reminder.id)
        toast({
          title: t("reminderDismissed"),
          description: `${t("dismissedReminderFor")} "${reminder.event_title}"`,
        })
        console.log("[REMINDER] 🎉 Reminder fully dismissed!")
      } else {
        console.error("[REMINDER] ❌ Database dismiss returned false")
        throw new Error("Failed to dismiss reminder - database returned false")
      }
    } catch (error) {
      console.error('[REMINDER] 💥 Error dismissing reminder:', error)
      toast({
        title: t("error"),
        description: t("failedToDismissReminder"),
        variant: "destructive"
      })
    } finally {
      // Always reset the dismissing state
      setIsDismissing(false)
    }
  }

  const handleSpeak = () => {
    if (reminder.reminder_message) {
      speakText(reminder.reminder_message)
    }
  }

  const formatEventTime = (timeString: string) => {
    const date = new Date(timeString)
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatEventDate = (timeString: string) => {
    const date = new Date(timeString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return t("today")
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t("tomorrow")
    } else {
      return date.toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto border-orange-200 bg-orange-50 shadow-lg animate-in slide-in-from-top-2 duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg text-orange-900">
              {t("eventReminder")}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            disabled={isDismissing}
            className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Event Title */}
        <div>
          <h3 className="font-semibold text-orange-900 text-base">
            {reminder.event_title}
          </h3>
        </div>

        {/* Event Time */}
        <div className="flex items-center gap-2 text-sm text-orange-700">
          <Clock className="h-4 w-4" />
          <span>
            {formatEventDate(reminder.event_start_time)} {t("at")} {formatEventTime(reminder.event_start_time)}
          </span>
        </div>

        {/* Event Location */}
        {reminder.event_location && (
          <div className="flex items-center gap-2 text-sm text-orange-700">
            <MapPin className="h-4 w-4" />
            <span>{reminder.event_location}</span>
          </div>
        )}

        {/* Reminder Message */}
        {reminder.reminder_message && (
          <div className="p-3 bg-white rounded-md border border-orange-200">
            <p className="text-sm text-gray-700">{reminder.reminder_message}</p>
          </div>
        )}

        {/* Time until event */}
        <div className="flex items-center justify-center">
          <Badge variant="outline" className="border-orange-300 text-orange-700 bg-white">
            <Calendar className="h-3 w-3 mr-1" />
            {reminder.minutes_before_event === 1 
              ? t("oneMinuteUntilEvent")
              : `${reminder.minutes_before_event} ${t("minutesUntilEvent")}`
            }
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSpeak}
            className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            <Volume2 className="h-4 w-4 mr-2" />
            {t("repeatReminder")}
          </Button>
          <Button
            onClick={handleDismiss}
            disabled={isDismissing}
            size="sm"
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isDismissing ? t("dismissingButton") : t("gotItButton")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Container component for managing multiple reminders
interface ReminderNotificationsContainerProps {
  speakReminders?: boolean
}

export function ReminderNotificationsContainer({ 
  speakReminders = true
}: ReminderNotificationsContainerProps) {
  const [reminders, setReminders] = React.useState<CalendarEventReminder[]>([])
  const [userId, setUserId] = React.useState<string | null>(null)
  const checkInterval = React.useRef<NodeJS.Timeout | null>(null)

  // Get user ID
  React.useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
        }
      } catch (error) {
        console.error('[REMINDER] Error getting user:', error)
      }
    }
    
    getUser()
  }, [])

  // Check for new reminders every minute
  React.useEffect(() => {
    if (!userId) return

    const checkForReminders = async () => {
      try {
        console.log("[REMINDER] 🔍 Checking for new reminders...")
        const newReminders = await calendarReminderService.processPendingReminders()
        console.log("[REMINDER] 📋 Found", newReminders.length, "new reminders from service")
        
        if (newReminders.length > 0) {
          setReminders(prev => {
            // Filter out reminders that are already in the current list to avoid duplicates
            const existingIds = new Set(prev.map(r => r.id))
            const trulyNewReminders = newReminders.filter(r => !existingIds.has(r.id))
            
            console.log("[REMINDER] ✅ Adding", trulyNewReminders.length, "truly new reminders (filtered out", newReminders.length - trulyNewReminders.length, "duplicates)")
            
            if (trulyNewReminders.length > 0) {
              return [...prev, ...trulyNewReminders]
            }
            return prev
          })
        }
      } catch (error) {
        console.error('[REMINDER] Error checking for reminders:', error)
      }
    }

    // Check immediately
    checkForReminders()

    // Set up interval to check every minute
    checkInterval.current = setInterval(checkForReminders, 60000)

    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current)
      }
    }
  }, [userId])

  const handleDismissReminder = (reminderId: string) => {
    console.log("[REMINDER] 🗑️ Dismissing reminder from container:", reminderId)
    setReminders(prev => {
      const filtered = prev.filter(r => r.id !== reminderId)
      console.log("[REMINDER] 📊 Reminder count after dismissal:", filtered.length)
      return filtered
    })
  }

  if (reminders.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
      {reminders.map((reminder) => (
        <ReminderNotification
          key={reminder.id}
          reminder={reminder}
          onDismiss={handleDismissReminder}
          speakReminder={speakReminders}
        />
      ))}
    </div>
  )
}