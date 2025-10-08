"use client"

import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/translations"
import { useTheme } from "next-themes"
import type { BuddySettings, BuddyMessage, UIPreferences } from "@/types/buddy"
import { Clock, Send, Smile, UserRound, Zap, Bell, Heart, Plus, Trash2, Edit3, Check, X, Calendar, ChevronLeft, ChevronRight, Maximize, Minimize, Mic, MicOff, MessageCircle, Settings } from "lucide-react"
import { ModelStatus } from "@/components/model-status"
import { VoiceInput, type VoiceInputRef } from "@/components/voice-input"
import { RealtimeVoice } from "@/components/realtime-voice"
import { VoiceSettings } from "@/components/voice-settings"
import { UserProfile } from "@/components/user-profile"
import { ConnectionsSettings } from "@/components/connections-settings"
import { CalendarReminderSettings } from "@/components/calendar-reminder-settings"
import { ReminderNotificationsContainer } from "@/components/reminder-notification"
import { GoogleCalendar, GoogleCalendarRef } from "@/components/google-calendar"
import { NotificationPanel, createCalendarReminderNotification, type Notification } from "@/components/notification-panel"
import { FontSizeSelector } from "@/components/font-size-selector"
import { RiveFace } from "@/components/rive-face"
import { Clock as ClockDisplay } from "@/components/clock"
import { getMainFontSize, getHeadingFontSize, getDescriptionFontSize } from "@/lib/font-utils"
import {
  loadUserSettings,
  saveUserSettings,
  loadUserMessages,
  saveUserMessage,
  loadUserReminders,
  saveUserReminder,
  deleteUserReminder,
  getDueReminders,
  updateReminderStatus,
  loadUIPreferences,
  saveUIPreferences,
  deleteUserMessagesAfter,
  dismissReminder,
} from "@/lib/database"
import { supabase } from "@/lib/supabase"
import type { Reminder } from "@/types/reminder" // Import Reminder type
import { 
  getCalendarStatus, 
  createCalendarEvent,
  getGoogleCalendarTimezone,
  type CalendarStatus 
} from "@/lib/calendar-utils"
import { calendarReminderService } from "@/lib/calendar-reminder-service"

const DEFAULT_SETTINGS: BuddySettings = {
  userName: "",
  tone: "gentle",
  pace: "slow",
  useEmojis: true,
  humor: "sometimes",
  revealBackstory: "when-asked",
  backstory:
    "I'm Buddy, a friendly companion made to chat, listen, and help with simple daily tasks. I love gentle stories, music, and making your day a little brighter.",
  blockedTopics: ["violence", "graphic injury", "unsafe instructions"],
  aiModel: "auto",
  theme: "auto", // Default to auto theme (follows system preference)
  useVoice: true, // Enable voice by default
  voiceMode: "traditional", // Default to traditional voice mode
  micDeviceId: "",
  buddyVoiceURI: "",
  speechRate: 0.9, // Slightly slower for elderly users
  speechPitch: 1.0,
  lipSyncMode: "text", // Default to text-based lip-sync (faster and more accurate)
  userAvatarUrl: "",
  buddyAvatarUrl: "",
  fontSize: "large", // Default to large font for elderly users
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Auto-detect system timezone
}

const DEFAULT_UI_PREFERENCES: UIPreferences = {
  showHowToUse: true, // Show the guide by default for new users
  manuallyEnabledGuide: false, // Track if user manually re-enabled guide from settings
  themePreference: "auto",
  sidebarCollapsed: false,
  notificationStyle: "toast",
  animationEnabled: true,
  compactMode: false,
  language: "en", // Default to English
  useEmojis: true, // Temporary storage until database column is added
}

export default function BuddyApp(
  { initialGreeting }: { initialGreeting?: string } = {
    initialGreeting: "Hello there. I’m Buddy. How are you feeling today?",
  },
) {
  const { toast } = useToast()
  const { setTheme } = useTheme()

  const [settings, setSettings] = useState<BuddySettings>(DEFAULT_SETTINGS)
  const [uiPreferences, setUIPreferences] = useState<UIPreferences>(DEFAULT_UI_PREFERENCES)
  const [openSettings, setOpenSettings] = useState(false)
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [currentGuidePage, setCurrentGuidePage] = useState(0)
  const [pendingScheduleRequest, setPendingScheduleRequest] = useState<any>(null)
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus>({
    isConnectedToGoogle: false,
    hasCalendarPermission: false,
    accessToken: null
  })

  const [messages, setMessages] = useState<BuddyMessage[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentPhoneme, setCurrentPhoneme] = useState<string | null>(null)
  const [showVoiceControls, setShowVoiceControls] = useState(false)
  const googleCalendarRef = useRef<GoogleCalendarRef>(null)
  const voiceInputRef = useRef<VoiceInputRef>(null)
  const [isMicActive, setIsMicActive] = useState(false)
  
  // Avatar menu state (must be declared before functions that use them)
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const [isAvatarSpinning, setIsAvatarSpinning] = useState(false)
  const [isAvatarFullscreen, setIsAvatarFullscreen] = useState(false)
  
  // Conversation mode state
  const [isConversationMode, setIsConversationMode] = useState(false)
  const conversationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Notification system
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  
  const handleAvatarClick = () => {
    setIsAvatarSpinning(true)
    setShowAvatarMenu(!showAvatarMenu)
    
    // Stop spinning after animation completes
    setTimeout(() => {
      setIsAvatarSpinning(false)
    }, 600)
  }

  // Close avatar menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showAvatarMenu && !target.closest('[data-avatar-menu]')) {
        setShowAvatarMenu(false)
      }
    }

    if (showAvatarMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showAvatarMenu])

  // Prevent body scrolling when fullscreen avatar is active
  React.useEffect(() => {
    if (isAvatarFullscreen) {
      // Save current scroll position
      const scrollY = window.scrollY
      // Prevent scrolling
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      
      return () => {
        // Restore scrolling
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        // Restore scroll position
        window.scrollTo(0, scrollY)
      }
    }
  }, [isAvatarFullscreen])
  
  const addNotification = React.useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    console.log('🔔 ADD_NOTIFICATION: Received notification:', notification)
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      isRead: false
    }
    
    console.log('🔔 ADD_NOTIFICATION: Created full notification:', newNotification)
    setNotifications(prev => {
      console.log('🔔 ADD_NOTIFICATION: Current notifications count:', prev.length)
      const updated = [newNotification, ...prev]
      console.log('🔔 ADD_NOTIFICATION: New notifications count:', updated.length)
      return updated
    })
    return newNotification.id
  }, [])
  
  const removeNotification = React.useCallback(async (id: string) => {
    console.log("[v0] 🗑️ Removing notification:", id)
    
    // Find the notification to get details
    const notification = notifications.find(n => n.id === id)
    console.log("[v0] 📋 Found notification to remove:", notification?.type, notification?.title)
    
    // If this is a calendar reminder, also dismiss it in the database
    if (notification?.type === 'calendar-reminder' && notification.reminderId) {
      console.log("[v0] 📅 This is a calendar reminder - dismissing in database with ID:", notification.reminderId)
      try {
        const success = await dismissReminder(notification.reminderId)
        if (success) {
          console.log("[v0] ✅ Successfully dismissed calendar reminder in database")
        } else {
          console.error("[v0] ❌ Failed to dismiss calendar reminder in database")
        }
      } catch (error) {
        console.error("[v0] � Error dismissing calendar reminder:", error)
      }
    }
    
    // Remove from UI
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [notifications])

  // Remove the helper function as it's no longer needed
  // const dismissCalendarReminderByTitle = async (eventTitle: string) => { ... }
  
  const markNotificationAsRead = React.useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }, [])
  
  const clearAllNotifications = React.useCallback(() => {
    setNotifications([])
  }, [])
  
  // Translation hook
  const { t } = useTranslation(uiPreferences.language)

  // Guide pages with translations
  const guidePages = [
    {
      emoji: "👋",
      title: t("guideWelcomeTitle"),
      description: t("guideWelcomeDesc"),
      tips: [
        t("guideWelcomeTip1"),
        t("guideWelcomeTip2"),
        t("guideWelcomeTip3")
      ]
    },
    {
      emoji: "💬",
      title: t("guideChatTitle"),
      description: t("guideChatDesc"),
      tips: [
        t("guideChatTip1"),
        t("guideChatTip2"),
        t("guideChatTip3")
      ]
    },
    {
      emoji: "⚙️",
      title: t("guideCustomizeTitle"),
      description: t("guideCustomizeDesc"),
      tips: [
        t("guideCustomizeTip1"),
        t("guideCustomizeTip2"),
        t("guideCustomizeTip3")
      ]
    },
    {
      emoji: "📅",
      title: t("guideCalendarTitle"),
      description: t("guideCalendarDesc"),
      tips: [
        t("guideCalendarTip1"),
        t("guideCalendarTip2"),
        t("guideCalendarTip3")
      ]
    },
    {
      emoji: "🎯",
      title: t("guideActivitiesTitle"),
      description: t("guideActivitiesDesc"),
      tips: [
        t("guideActivitiesTip1"),
        t("guideActivitiesTip2"),
        t("guideActivitiesTip3")
      ]
    },
    {
      emoji: "🎉",
      title: t("guideFinishTitle"),
      description: t("guideFinishDesc"),
      tips: [
        t("guideFinishTip1"),
        t("guideFinishTip2"),
        t("guideFinishTip3")
      ]
    }
  ]

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState("")

  const [reminders, setReminders] = useState<Reminder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const timersRef = useRef<Record<string, number>>({})

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current
      // Only scroll if content overflows the container
      if (container.scrollHeight > container.clientHeight) {
        container.scrollTop = container.scrollHeight
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const checkGoogleConnection = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("user_connected_accounts")
        .select("id")
        .eq("user_id", user.id)
        .eq("provider", "google")
        .eq("is_active", true)
        .single()

      setIsGoogleConnected(!!data)
      console.log("[v0] Google connection status:", !!data)
    } catch (error) {
      console.error("[v0] Error checking Google connection:", error)
      setIsGoogleConnected(false)
    }
  }

  const updateCalendarStatus = async () => {
    try {
      const status = await getCalendarStatus()
      setCalendarStatus(status)
      console.log("[v0] Calendar status:", status)
      
      // If Google Calendar is connected, fetch and set timezone
      if (status.isConnectedToGoogle && status.accessToken) {
        const googleTimezone = await getGoogleCalendarTimezone(status.accessToken)
        if (googleTimezone) {
          console.log("[v0] Setting timezone from Google Calendar:", googleTimezone)
          setSettings(prev => ({ ...prev, timezone: googleTimezone }))
          // Save to database
          await saveUserSettings({ ...settings, timezone: googleTimezone })
        }
      }
    } catch (error) {
      console.error("[v0] Error checking calendar status:", error)
    }
  }

  const refreshGoogleCalendar = async () => {
    try {
      console.log("[v0] Refreshing Google Calendar from parent...")
      await googleCalendarRef.current?.refresh()
    } catch (error) {
      console.error("[v0] Error refreshing Google Calendar:", error)
    }
  }

  // Parse natural language scheduling requests with typo tolerance
  const parseSchedulingRequest = async (userText: string) => {
    const schedulingKeywords = [
      // English (including common misspellings)
      'schedule', 'shedule', 'scedule', 'appointment', 'apointment', 'appointmnt', 
      'meeting', 'meting', 'meetng', 'remind', 'reminde', 'reminder', 'remindder',
      'calendar', 'calender', 'calandar', 'book', 'buk', 'plan', 'plen',
      // Spanish
      'cita', 'sita', 'reunión', 'reunion', 'recordatorio', 'recordatrio', 
      'calendario', 'calendrio', 'programar', 'programaar',
      // French
      'rendez-vous', 'rendez vous', 'réunion', 'reunion', 'rappel', 'rapel', 
      'calendrier', 'calendrer', 'programmer', 'programer',
      // German
      'termin', 'terminn', 'besprechung', 'besprechng', 'erinnerung', 'erinnerng', 
      'kalender', 'kalendder', 'planen', 'plannen',
      // Arabic
      'موعد', 'اجتماع', 'تذكير', 'تقويم', 'جدولة',
    ]

    // Enhanced fuzzy matching function
    const fuzzyMatch = (text: string, keyword: string) => {
      const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ')
      
      // Direct match first
      if (cleanText.includes(keyword.toLowerCase())) return true
      
      // For longer words, allow character differences
      if (keyword.length > 4) {
        const words = cleanText.split(/\s+/)
        for (const word of words) {
          if (Math.abs(word.length - keyword.length) <= 2) {
            let differences = 0
            const maxLength = Math.max(word.length, keyword.length)
            const minLength = Math.min(word.length, keyword.length)
            
            // Count character differences
            for (let i = 0; i < minLength; i++) {
              if (word[i] !== keyword[i]) differences++
            }
            differences += maxLength - minLength
            
            // Allow up to 2 differences for words 5+ chars
            if (differences <= 2) return true
          }
        }
      }
      return false
    }

    const hasSchedulingIntent = schedulingKeywords.some(keyword => 
      fuzzyMatch(userText, keyword)
    )

    if (!hasSchedulingIntent) return null

    // Use AI to extract scheduling details
    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userText: userText
        }),
      })

      if (response.ok) {
        const parsed = await response.json()
        if (parsed.isSchedulingRequest) {
          return parsed
        }
      }
    } catch (error) {
      console.error("Error parsing scheduling request:", error)
    }

    return null
  }

  // Handle scheduling workflow
  const handleSchedulingRequest = async (scheduleData: any) => {
    if (!calendarStatus.hasCalendarPermission) {
      const helpMessage: BuddyMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I'd love to help you schedule that! However, I need access to your Google Calendar first. Please connect your calendar in the settings, and then I can create events for you.",
        createdAt: Date.now(),
      }
      setMessages(prev => [...prev, helpMessage])
      return
    }

    // Apply smart defaults for missing information
    if (scheduleData.missing && scheduleData.missing.length > 0) {
      // Smart defaults
      if (scheduleData.missing.includes('date') && !scheduleData.date) {
        scheduleData.date = 'tomorrow' // Default to tomorrow
      }
      if (scheduleData.missing.includes('time') && !scheduleData.time) {
        scheduleData.time = '10:00' // Default to 10 AM
      }
      if (scheduleData.missing.includes('duration') && !scheduleData.duration) {
        scheduleData.duration = 60 // Default to 1 hour
      }
    }

    // Create the calendar event
    try {
      const { createCalendarEvent } = await import("@/lib/calendar-utils")
      
      // Convert relative dates
      let eventDate = scheduleData.date
      if (scheduleData.date === 'tomorrow') {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        eventDate = tomorrow.toISOString().split('T')[0]
      }
      
      // Default time if not specified
      let eventTime = scheduleData.time || '09:00'
      if (eventTime === 'morning') eventTime = '09:00'
      if (eventTime === 'afternoon') eventTime = '14:00'
      if (eventTime === 'evening') eventTime = '18:00'
      
      const startDateTime = `${eventDate}T${eventTime}:00`
      const endDateTime = new Date(new Date(startDateTime).getTime() + (scheduleData.duration || 60) * 60000).toISOString()

      const eventRequest = {
        summary: scheduleData.title,
        description: scheduleData.description || `Event created by Buddy`,
        startDateTime,
        endDateTime,
        location: scheduleData.location || '',
        guests: scheduleData.guests || []
      }

      const result = await createCalendarEvent(eventRequest, calendarStatus.accessToken!)
      
      if (result.success) {
        // Create user-friendly date display
        const dateDisplay = eventDate === new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0] 
          ? 'tomorrow' 
          : eventDate
        
        const successContent = `✅ Done! I've scheduled "${scheduleData.title}" for ${dateDisplay} at ${eventTime} (1 hour duration)${scheduleData.guests?.length > 0 ? ` and sent invitations to ${scheduleData.guests.length} guest(s)` : ''}. 

📅 You can view and edit this event in your Google Calendar if you need to make any changes!`
        
        const successMessage: BuddyMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: processMessageContent(successContent),
          createdAt: Date.now(),
        }
        setMessages(prev => [...prev, successMessage])
        setPendingScheduleRequest(null)
      } else {
        throw new Error(result.message || 'Unknown error')
      }
    } catch (error) {
      console.error("Error creating calendar event:", error)
      const errorMessage: BuddyMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I'm sorry, I had trouble creating that calendar event. Please make sure your Google Calendar is connected and try again, or you can create the event manually using the calendar widget.",
        createdAt: Date.now(),
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true)

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const dbSettings = await loadUserSettings()
          
          // Set default avatar based on authentication method if no custom avatar is set
          let defaultAvatarUrl = ""
          if (!dbSettings?.userAvatarUrl) {
            // Check if user logged in with Google OAuth
            const isGoogleUser = user.app_metadata?.providers?.includes('google') || 
                                user.user_metadata?.provider === 'google'
            
            if (isGoogleUser && user.user_metadata?.avatar_url) {
              // Use Google profile picture
              defaultAvatarUrl = user.user_metadata.avatar_url
            } else {
              // Use default image for email users
              defaultAvatarUrl = "/placeholder-user.jpg"
            }
          }

          if (dbSettings) {
            console.log('📖 LOAD: Database settings loaded:', dbSettings)
            console.log('📖 LOAD: Database useEmojis value:', dbSettings.useEmojis)
            console.log('📖 LOAD: DEFAULT_SETTINGS useEmojis:', DEFAULT_SETTINGS.useEmojis)
            // Merge database settings with defaults to ensure all properties exist
            const mergedSettings = { ...DEFAULT_SETTINGS, ...dbSettings }
            console.log('📖 LOAD: Merged settings useEmojis:', mergedSettings.useEmojis)
            
            // If no custom avatar is set, use the determined default
            if (!mergedSettings.userAvatarUrl && defaultAvatarUrl) {
              setSettings({ ...mergedSettings, userAvatarUrl: defaultAvatarUrl })
            } else {
              setSettings(mergedSettings)
            }
          } else if (defaultAvatarUrl) {
            console.log('📖 LOAD: No database settings found, using defaults with avatar:', defaultAvatarUrl)
            // First time user - set default avatar
            setSettings(prev => ({ ...prev, userAvatarUrl: defaultAvatarUrl }))
          }

          // Load UI preferences
          const dbUIPreferences = await loadUIPreferences()
          if (dbUIPreferences) {
            console.log('📖 LOAD: Database UI preferences loaded:', dbUIPreferences)
            // Merge database UI preferences with defaults
            const mergedUIPreferences = { ...DEFAULT_UI_PREFERENCES, ...dbUIPreferences }
            setUIPreferences(mergedUIPreferences)
          } else {
            console.log('📖 LOAD: No database UI preferences found, using defaults')
          }

          const dbMessages = await loadUserMessages()
          if (dbMessages.length > 0) {
            // Process messages to remove emojis if setting is disabled
            const processedMessages = dbMessages.map(msg => {
              if (msg.role === "assistant") {
                return {
                  ...msg,
                  content: processMessageContent(msg.content)
                }
              }
              return msg
            })
            setMessages(processedMessages)
            // Set the last message ID to prevent re-saving when loading existing messages
            lastSavedMessageId.current = dbMessages[dbMessages.length - 1]?.id || null
          } else {
            const greetingText = initialGreeting || t("initialGreeting")
            const intro: BuddyMessage = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: processMessageContent(greetingText),
              createdAt: Date.now(),
            }
            setMessages([intro])
            // Save original greeting with emojis to database
            await saveUserMessage({
              ...intro,
              content: greetingText // Save original with emojis
            })
            lastSavedMessageId.current = intro.id
          }

          const dbReminders = await loadUserReminders()
          const convertedReminders: Reminder[] = dbReminders.map((r) => ({
            id: r.id,
            text: r.text,
            minutes: Math.round((new Date(r.scheduled_for).getTime() - new Date(r.created_at).getTime()) / 60000),
            createdAt: new Date(r.created_at).getTime(),
            done: r.completed,
          }))
          setReminders(convertedReminders)
          checkGoogleConnection()
          updateCalendarStatus()
          
          // Start calendar reminder monitoring for this user
          try {
            await calendarReminderService.startMonitoring(user.id, settings.timezone)
            console.log("[v0] Calendar reminder service started for user:", user.id, "with timezone:", settings.timezone)
            
            // Set up periodic checking for triggered reminders (check every 10 seconds for reliability)
            const reminderCheckInterval = setInterval(async () => {
              try {
                console.log("[v0] 🔄 Buddy-app checking for calendar reminders at:", new Date().toISOString())
                const triggeredReminders = await calendarReminderService.processPendingReminders()
                
                console.log("[v0] 📋 Found", triggeredReminders.length, "triggered calendar reminders")
                
                // Create notifications for each triggered reminder
                for (const reminder of triggeredReminders) {
                  const eventTime = new Date(reminder.event_start_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                  
                  const timeUntil = `${reminder.minutes_before_event} minutes`
                  
                  // Create notification in the notification panel
                  const calendarNotification = createCalendarReminderNotification(
                    reminder.event_title,
                    eventTime,
                    timeUntil,
                    reminder.id // Pass the database reminder ID
                  )
                  
                  addNotification(calendarNotification)
                  
                  // Create a chat message from Buddy about the reminder
                  const reminderContent = `🔔 Calendar Reminder: You have "${reminder.event_title}" coming up in ${timeUntil}! The event is scheduled for ${eventTime}.${reminder.event_location ? ` Location: ${reminder.event_location}` : ''}`
                  const reminderChatMessage: BuddyMessage = {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: processMessageContent(reminderContent),
                    createdAt: Date.now(),
                  }
                  
                  // Add the message to chat
                  setMessages(prev => [...prev, reminderChatMessage])
                  
                  // Save the message to database
                  await saveUserMessage(reminderChatMessage)
                  
                  // Make Buddy speak the reminder with proper lip sync
                  console.log("🔊 [CalendarReminder] About to speak reminder:", reminder.event_title)
                  const spokenMessage = `Calendar reminder: You have ${reminder.event_title} in ${timeUntil}. The event is at ${eventTime}.`
                  await speak(spokenMessage)
                  console.log("🔊 [CalendarReminder] Finished speaking reminder")
                  
                  console.log("[v0] Created notification and chat message for calendar reminder:", reminder.event_title)
                }
              } catch (error) {
                console.error("[v0] Error processing calendar reminders:", error)
              }
            }, 10000) // Check every 10 seconds for more reliable triggering
            
            // Also check immediately and manually for testing
            setTimeout(async () => {
              try {
                const triggeredReminders = await calendarReminderService.checkNow(user.id, settings.timezone)
                console.log("[v0] Manual check found", triggeredReminders.length, "triggered reminders")
              } catch (error) {
                console.error("[v0] Error in manual check:", error)
              }
            }, 5000) // Check after 5 seconds
            
            // Store interval for cleanup
            ;(window as any).reminderCheckInterval = reminderCheckInterval

            // Add visibility change listener to check reminders when tab becomes active
            const handleVisibilityChange = async () => {
              if (document.visibilityState === 'visible') {
                console.log("[v0] 👁️ Tab became visible - checking for calendar reminders")
                try {
                  const triggeredReminders = await calendarReminderService.processPendingReminders()
                  console.log("[v0] 🔄 Visibility check found", triggeredReminders.length, "triggered reminders")
                  
                  // Process any triggered reminders immediately
                  for (const reminder of triggeredReminders) {
                    const eventTime = new Date(reminder.event_start_time).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                    
                    const timeUntil = `${reminder.minutes_before_event} minutes`
                    
                    // Create notification in the notification panel
                    const calendarNotification = createCalendarReminderNotification(
                      reminder.event_title,
                      eventTime,
                      timeUntil,
                      reminder.id // Pass the database reminder ID
                    )
                    
                    addNotification(calendarNotification)
                    
                    // Create a chat message from Buddy about the reminder
                    const reminderMessage = `${settings.useEmojis ? '🔔 ' : ''}Calendar Reminder: You have "${reminder.event_title}" coming up in ${timeUntil}! The event is scheduled for ${eventTime}.${reminder.event_location ? ` Location: ${reminder.event_location}` : ''}`
                    const reminderChatMessage: BuddyMessage = {
                      id: crypto.randomUUID(),
                      role: "assistant",
                      content: reminderMessage,
                      createdAt: Date.now(),
                    }
                    
                    // Add the message to chat
                    setMessages(prev => [...prev, reminderChatMessage])
                    
                    // Save the message to database
                    await saveUserMessage(reminderChatMessage)
                    
                    // Make Buddy speak the reminder with proper lip sync
                    console.log("🔊 [CalendarReminder-Visibility] About to speak reminder:", reminder.event_title)
                    const spokenMessage = `Calendar reminder: You have ${reminder.event_title} in ${timeUntil}. The event is at ${eventTime}.`
                    await speak(spokenMessage)
                    console.log("🔊 [CalendarReminder-Visibility] Finished speaking reminder")
                    
                    console.log("[v0] ✅ Processed visibility-triggered reminder:", reminder.event_title)
                  }
                } catch (error) {
                  console.error("[v0] Error in visibility change reminder check:", error)
                }
              }
            }
            
            document.addEventListener('visibilitychange', handleVisibilityChange)
            
            // Store for cleanup
            ;(window as any).reminderVisibilityHandler = handleVisibilityChange
          } catch (error) {
            console.error("[v0] Failed to start calendar reminder service:", error)
          }
        } else {
          const intro: BuddyMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: initialGreeting || "Hello there. I’m Buddy. How are you feeling today?",
            createdAt: Date.now(),
          }
          setMessages([intro])
        }
      } catch (error) {
        console.error("Error loading user data:", error)
        const intro: BuddyMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: initialGreeting || "Hello there. I’m Buddy. How are you feeling today?",
          createdAt: Date.now(),
        }
        setMessages([intro])
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [initialGreeting])

  // Helper function to remove emojis from text
  const removeEmojis = React.useCallback((text: string): string => {
    // Remove all emojis and emoji-related characters
    return text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}\u{231A}-\u{231B}\u{23E9}-\u{23FA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3030}\u{303D}\u{3297}\u{3299}\u{00A9}\u{00AE}\u{203C}\u{2049}\u{2122}\u{2139}\u{2194}-\u{2199}\u{21A9}-\u{21AA}\u{24C2}\u{2B50}\u{2B55}]/gu, '')
      .replace(/[\uD800-\uDFFF]/g, '') // Remove unpaired surrogate halves
      .replace(/\s+/g, ' ') // Clean up extra spaces
      .trim()
  }, [])

  // Helper function to process message content based on emoji settings
  const processMessageContent = React.useCallback((content: string): string => {
    if (!settings.useEmojis) {
      return removeEmojis(content)
    }
    return content
  }, [settings.useEmojis, removeEmojis])

  // Sync theme setting with next-themes (but only when user changes it manually)
  useEffect(() => {
    // Only set theme if it's different from what next-themes already has
    // This prevents hydration issues on initial load
    if (settings.theme && settings.theme !== "auto") {
      setTheme(settings.theme)
    } else if (settings.theme === "auto") {
      setTheme("system")
    }
  }, [settings.theme, setTheme])

  // Cleanup calendar reminder service on unmount
  useEffect(() => {
    return () => {
      // Stop calendar reminder monitoring
      calendarReminderService.stopMonitoring()
      
      // Clear reminder check interval
      if ((window as any).reminderCheckInterval) {
        clearInterval((window as any).reminderCheckInterval)
        delete (window as any).reminderCheckInterval
      }
      
      // Remove visibility change listener
      if ((window as any).reminderVisibilityHandler) {
        document.removeEventListener('visibilitychange', (window as any).reminderVisibilityHandler)
        delete (window as any).reminderVisibilityHandler
      }
      
      console.log("[v0] Calendar reminder service cleanup completed")
    }
  }, [])

  useEffect(() => {
    if (!isLoading) {
      console.log('💾 SETTINGS: Saving user settings:', settings)
      saveUserSettings(settings)
    }
  }, [settings, isLoading])

  useEffect(() => {
    if (!isLoading) {
      console.log('💾 UI_PREFS: Saving UI preferences:', uiPreferences)
      saveUIPreferences(uiPreferences)
    }
  }, [uiPreferences, isLoading])

  // Reload messages when emoji setting changes to apply emoji removal properly
  useEffect(() => {
    if (!isLoading) {
      const reloadMessages = async () => {
        console.log('🔄 Emoji setting changed, reloading messages from database...')
        const dbMessages = await loadUserMessages()
        if (dbMessages.length > 0) {
          // Process messages based on current emoji setting
          const processedMessages = dbMessages.map(msg => {
            if (msg.role === "assistant") {
              return {
                ...msg,
                content: processMessageContent(msg.content)
              }
            }
            return msg
          })
          setMessages(processedMessages)
        }
      }
      reloadMessages()
    }
  }, [settings.useEmojis, isLoading, processMessageContent])

  // Track the last saved message to avoid duplicates
  const lastSavedMessageId = useRef<string | null>(null)

  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      // Only save if this is a new message (different ID than last saved)
      if (lastMessage && lastMessage.id !== lastSavedMessageId.current) {
        saveUserMessage(lastMessage)
        lastSavedMessageId.current = lastMessage.id
      }
    }
  }, [messages, isLoading])

  // Update reminder display every minute to show current time remaining
  useEffect(() => {
    const interval = setInterval(() => {
      if (reminders.length > 0) {
        // Force a re-render by updating the state
        setReminders(prev => [...prev])
      }
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [reminders.length])

  const nameOrFriend = useMemo(() => {
    return settings.userName?.trim() ? settings.userName.trim() : "friend"
  }, [settings.userName, t])

  // Enhanced speak function with better voice handling
  const speak = React.useCallback(
    async (text: string) => {
      console.log("🔊 [Speak] Function called with text:", text.substring(0, 50) + "...")
      console.log("🔊 [Speak] useVoice setting:", settings.useVoice)
      console.log("🔊 [Speak] speechSynthesis available:", "speechSynthesis" in window)
      console.log("🔊 [Speak] isConversationMode:", isConversationMode)
      
      // IMPORTANT: Always set isSpeaking to true at start, even if voice is disabled
      // This ensures conversation mode can track when message processing is complete
      setIsSpeaking(true)
      
      if (!settings.useVoice || !("speechSynthesis" in window)) {
        console.log("🔊 [Speak] Voice disabled or not supported - simulating speech delay")
        // Simulate a speaking delay so conversation mode can function
        await new Promise(resolve => setTimeout(resolve, 1000))
        setIsSpeaking(false)
        console.log("🔊 [Speak] Simulated speech complete - isSpeaking set to false")
        return
      }

      console.log("🔊 [Speak] Proceeding with speech synthesis...")
      
      try {
        const { EnhancedSpeechSynthesis, selectBestVoice } = await import("@/lib/voice-utils")
        const speechSynthesis = EnhancedSpeechSynthesis.getInstance()
        
        console.log("🔊 [Speak] Setting up callbacks...")
        // Set up state change callback
        speechSynthesis.setStateChangeCallback(setIsSpeaking)
        
        // Set up phoneme change callback for lip-sync
        speechSynthesis.setPhonemeChangeCallback(setCurrentPhoneme)
        
        const voices = window.speechSynthesis.getVoices()
        console.log("🔊 [Speak] Available voices:", voices.length)
        
        let selectedVoice: SpeechSynthesisVoice | null = null
        
        // Try to use user's selected voice first
        if (settings.buddyVoiceURI) {
          selectedVoice = voices.find((voice) => voice.voiceURI === settings.buddyVoiceURI) || null
          console.log("Using user selected voice:", selectedVoice?.name)
        }
        
        // Fall back to smart voice selection
        if (!selectedVoice) {
          selectedVoice = selectBestVoice(voices)
          console.log("Using auto-selected voice:", selectedVoice?.name)
          
          // Auto-update settings with the best voice found
          if (selectedVoice && !settings.buddyVoiceURI) {
            setSettings(prev => ({ ...prev, buddyVoiceURI: selectedVoice!.voiceURI }))
          }
        }
        
        // Speak with enhanced synthesis
        await speechSynthesis.speak(text, {
          voice: selectedVoice || undefined,
          rate: settings.speechRate,
          pitch: settings.speechPitch,
          volume: 1.0,
          interrupt: true, // Always interrupt previous speech for responsiveness
          lipSyncMode: settings.lipSyncMode || "text" // Use user's preferred lip-sync mode
        })
        
        console.log("🔊 [Speak] Speech synthesis completed successfully")
        
      } catch (error) {
        console.error("Enhanced speech synthesis error:", error)
        setIsSpeaking(false)
        
        // Fallback to basic speech synthesis
        try {
          window.speechSynthesis.cancel()
          const utterance = new SpeechSynthesisUtterance(text)
          const voices = window.speechSynthesis.getVoices()
          
          const selectedVoice = voices.find((voice) => voice.voiceURI === settings.buddyVoiceURI) ||
                               voices.find((v) => v.lang.startsWith("en") && v.localService) ||
                               voices[0]
          
          if (selectedVoice) utterance.voice = selectedVoice
          utterance.rate = settings.speechRate
          utterance.pitch = settings.speechPitch
          
          utterance.onstart = () => setIsSpeaking(true)
          utterance.onend = () => setIsSpeaking(false)
          utterance.onerror = () => setIsSpeaking(false)
          
          window.speechSynthesis.speak(utterance)
        } catch (fallbackError) {
          console.error("Fallback speech synthesis failed:", fallbackError)
          toast({
            title: "Voice Output Error",
            description: "Could not speak the message. Please check your voice settings.",
            variant: "destructive",
          })
          setIsSpeaking(false)
        }
      }
    },
    [settings.useVoice, settings.buddyVoiceURI, settings.speechRate, settings.speechPitch, settings.lipSyncMode, toast, setSettings, isConversationMode],
  )

  // Check for due reminders and create notifications
  useEffect(() => {
    const checkDueReminders = async () => {
      try {
        const dueReminders = await getDueReminders()
        console.log('🔔 REMINDER_CHECK: Found', dueReminders.length, 'due reminders')
        
        // Process reminders sequentially to ensure proper speaking
        for (const reminder of dueReminders) {
          console.log('🔔 REMINDER_TRIGGER: Processing reminder:', reminder.text)
          
          // Create notification for the reminder
          const reminderNotification = {
            title: 'Reminder',
            message: reminder.text,
            type: 'general' as const,
            eventName: reminder.text,
            eventTime: new Date(reminder.scheduled_for).toISOString(),
          }
          
          // Add to notification panel
          addNotification(reminderNotification)
          
          // Create chat message
          const reminderChatMessage: BuddyMessage = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            role: 'assistant',
            content: `🔔 Reminder: ${reminder.text}`,
            createdAt: Date.now()
          }
          
          // Add to messages and save
          setMessages(prev => [...prev, reminderChatMessage])
          await saveUserMessage(reminderChatMessage)
          
          // Voice announcement with proper lip sync
          console.log('🔊 [Reminder] About to speak reminder:', reminder.text)
          await speak(`Reminder: ${reminder.text}`)
          console.log('🔊 [Reminder] Finished speaking reminder')
          
          // Mark reminder as completed
          await updateReminderStatus(reminder.id, true)
          
          // Remove from the local reminders list
          setReminders(prev => prev.filter(r => r.id !== reminder.id))
          
          console.log('🔔 REMINDER_COMPLETE: Processed reminder for:', reminder.text)
        }
      } catch (error) {
        console.error('🔔 REMINDER_ERROR: Error checking due reminders:', error)
      }
    }

    // Check immediately
    checkDueReminders()
    
    // Then check every 30 seconds
    const interval = setInterval(checkDueReminders, 30000)
    
    return () => clearInterval(interval)
  }, [addNotification, setMessages, saveUserMessage, speak, setReminders])

  // Test notification function
  const handleTestNotification = React.useCallback(() => {
    console.log('🧪 TEST: Starting test notification...')
    const eventTime = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
    
    const testReminder = {
      title: 'Test Reminder',
      message: 'This is a test notification to check if the system is working properly.',
      type: 'calendar-reminder' as const,
      eventName: 'Test Event',
      eventTime: eventTime.toISOString(), // Convert to string for notification
      eventLocation: 'Home Office'
    }

    console.log('🧪 TEST: Created reminder object:', testReminder)

    // Add notification using the existing function
    const notificationId = addNotification(testReminder)
    console.log('🧪 TEST: Added notification with ID:', notificationId)

    // Create chat message
    const testMessage: BuddyMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      role: 'assistant',
      content: `🔔 Reminder: You have "${testReminder.eventName}" scheduled at ${eventTime.toLocaleTimeString()} in ${testReminder.eventLocation}. Don't forget!`,
      createdAt: Date.now()
    }

    console.log('🧪 TEST: Created chat message:', testMessage)

    // Add to messages and save
    setMessages(prev => {
      console.log('🧪 TEST: Adding message to chat, current length:', prev.length)
      return [...prev, testMessage]
    })
    
    console.log('🧪 TEST: Saving message to database...')
    saveUserMessage(testMessage)

    // Voice announcement
    console.log('🧪 TEST: Triggering voice announcement...')
    speak(testMessage.content)

    console.log('🧪 TEST: Test notification complete!')
  }, [addNotification, setMessages, saveUserMessage, speak])

  function violatesBlockedTopics(text: string) {
    const needles = settings.blockedTopics.map((t) => t.toLowerCase().trim()).filter(Boolean)
    const hay = text.toLowerCase()
    return needles.some((n) => n && hay.includes(n))
  }

  async function sendMessage(userText: string) {
    if (!userText.trim()) return
    if (isSending) return

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel()
    }

    if (violatesBlockedTopics(userText)) {
      const redirectMessage =
        "Let’s keep things light and safe. How about we chat about a happy memory, a favorite song, or the weather today?"
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content: userText.trim(), createdAt: Date.now() },
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: redirectMessage,
          createdAt: Date.now(),
        },
      ])
      await speak(redirectMessage)
      setInput("")
      return
    }

    const newUserMsg: BuddyMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userText.trim(),
      createdAt: Date.now(),
    }
    setMessages((prev) => [...prev, newUserMsg])
    setInput("")
    setIsSending(true)

    // Check for cancellation or correction of pending scheduling
    if (pendingScheduleRequest) {
      const cancelWords = ['cancel', 'nevermind', 'never mind', 'stop', 'forget it', 'no thanks', 'abort']
      const isCancellation = cancelWords.some(word => 
        userText.toLowerCase().includes(word.toLowerCase())
      )
      
      if (isCancellation) {
        setPendingScheduleRequest(null)
        const cancelMessage: BuddyMessage = {
          id: crypto.randomUUID(),
          role: "assistant", 
          content: "No problem! I've cancelled that scheduling request. Feel free to ask me for anything else! 😊",
          createdAt: Date.now(),
        }
        setMessages(prev => [...prev, cancelMessage])
        setIsSending(false)
        return
      }
    }

    // Check for scheduling requests
    const schedulingResult = await parseSchedulingRequest(userText.trim())
    if (schedulingResult?.isSchedulingRequest) {
      await handleSchedulingRequest(schedulingResult)
      setIsSending(false)
      return
    }

    try {
      const res = await fetch("/api/ai-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText.trim(),
          settings
        }),
      })
      if (!res.ok) {
        const fallbackText =
          "I’m here with you. Let’s take a gentle breath together. Would you like a cozy story, a light joke, or help with a small task?"
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: fallbackText, createdAt: Date.now() },
        ])
        await speak(fallbackText)
        return
      }
      const data = (await res.json()) as { response: string; success: boolean }
      
      // Save original response with emojis to database for later retrieval
      const originalResponse = data.response
      // Display processed response (with or without emojis based on setting)
      const displayResponse = processMessageContent(data.response)
      
      console.log('🎭 Emoji Setting - useEmojis:', settings.useEmojis)
      console.log('🎭 Original Response:', originalResponse)
      console.log('🎭 Display Response:', displayResponse)
      
      // Create message with display content
      const newMessage: BuddyMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: displayResponse,
        createdAt: Date.now(),
      }
      
      setMessages((prev) => [...prev, newMessage])
      
      // But save original content with emojis to database
      await saveUserMessage({
        ...newMessage,
        content: originalResponse // Save original with emojis
      })
      
      console.log("📢 [SendMessage] About to call speak with:", displayResponse.substring(0, 50) + "...")
      await speak(displayResponse)
      console.log("📢 [SendMessage] Speak function completed")
    } catch {
      const fallbackText =
        "I’m here with you. Let’s take a gentle breath together. Would you like a cozy story, a light joke, or help with a small task?"
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: fallbackText, createdAt: Date.now() },
      ])
      await speak(fallbackText)
    } finally {
      setIsSending(false)
    }
  }

  async function addQuickReminder(text: string, minutes: number) {
    const scheduledFor = new Date(Date.now() + minutes * 60000)

    const reminderId = await saveUserReminder(text, scheduledFor)

    if (reminderId) {
      const r: Reminder = {
        id: reminderId,
        text,
        minutes,
        createdAt: Date.now(),
      }
      setReminders((prev) => [r, ...prev])

      const confirmationMessage = `Okay. I'll remind you in ${minutes} minutes: ${text}`
      const assistantMessage: BuddyMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: confirmationMessage,
        createdAt: Date.now(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      speak(confirmationMessage)
    } else {
      toast({
        title: "Error",
        description: "Could not save reminder. Please try again.",
        variant: "destructive",
      })
    }
  }

  function addMessageFromSuggestion(text: string) {
    void sendMessage(text)
  }

  // Calculate time remaining for a reminder
  function getTimeRemaining(reminder: Reminder): string {
    const now = Date.now()
    const scheduledTime = reminder.createdAt + (reminder.minutes * 60 * 1000)
    const timeDiff = scheduledTime - now
    
    if (timeDiff <= 0) {
      return "Due now!"
    }
    
    const minutes = Math.floor(timeDiff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) {
      return `${days}d ${hours % 24}h left`
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m left`
    } else {
      return `${minutes}m left`
    }
  }

  const suggestionChips = [
    {
      label: t("tellLightJoke"),
      onClick: () => addMessageFromSuggestion(t("tellLightJokeRequest")),
    },
    { label: t("shareCozyStory"), onClick: () => addMessageFromSuggestion(t("shareCozyStoryRequest")) },
    {
      label: t("gentleBreathing"),
      onClick: () => addMessageFromSuggestion(t("gentleBreathingRequest")),
    },
    { label: t("weatherChat"), onClick: () => addMessageFromSuggestion(t("weatherChatRequest")) },
  ]

  // Handler for voice input - directly calls sendMessage
  // Not using useCallback to ensure it always has the latest sendMessage reference
  const handleVoiceInput = async (transcribedText: string) => {
    console.log("Voice input received:", transcribedText)
    if (transcribedText.trim()) {
      try {
        await sendMessage(transcribedText.trim())
      } catch (error) {
        console.error("Error sending voice message:", error)
        // Ensure isSending is reset on error
        setIsSending(false)
        toast({
          title: "Message Failed",
          description: "Failed to send your message. Please try again.",
          variant: "destructive"
        })
      }
    }
  }

  // Function to toggle conversation mode
  const toggleConversationMode = () => {
    if (isConversationMode) {
      // Stop conversation mode
      setIsConversationMode(false)
      if (conversationTimeoutRef.current) {
        clearTimeout(conversationTimeoutRef.current)
        conversationTimeoutRef.current = null
      }
      
      // Stop voice input if it's currently active
      if (voiceInputRef.current?.isCurrentlyListening()) {
        console.log("🛑 [ConversationMode] Stopping voice input")
        voiceInputRef.current.stopListening()
      }
      
      toast({
        title: "Conversation Ended",
        description: "Automatic conversation mode stopped.",
      })
    } else {
      // Start conversation mode
      setIsConversationMode(true)
      toast({
        title: "Conversation Started",
        description: "I'm ready to chat! Just start speaking.",
      })
      // Trigger the voice input to start listening
      setTimeout(() => {
        if (voiceInputRef.current) {
          console.log("🎤 [ConversationMode] Starting voice input via ref")
          voiceInputRef.current.startListening()
        }
      }, 500)
    }
  }

  // Monitor when Buddy finishes speaking to restart voice input in conversation mode
  React.useEffect(() => {
    console.log("🔄 [ConversationMode] Effect triggered:", {
      isConversationMode,
      isSpeaking,
      isSending,
      isMicActive
    })
    
    // Only restart if:
    // 1. Conversation mode is active
    // 2. Buddy is not speaking or sending
    // 3. Microphone is not already active (to avoid interrupting ongoing listening)
    if (isConversationMode && !isSpeaking && !isSending && !isMicActive) {
      console.log("🔄 [ConversationMode] Conditions met, scheduling voice restart in 1.5s...")
      // Wait a bit after Buddy stops speaking, then restart voice input
      conversationTimeoutRef.current = setTimeout(() => {
        if (isConversationMode && voiceInputRef.current) {
          console.log("🔄 [ConversationMode] Restarting voice input after bot response via ref")
          voiceInputRef.current.startListening()
        } else {
          console.log("🔄 [ConversationMode] Conversation mode no longer active or ref not available, skipping restart")
        }
      }, 1500) // 1.5 second delay after Buddy stops speaking
    } else {
      console.log("🔄 [ConversationMode] Conditions not met, not restarting voice")
    }
    
    return () => {
      if (conversationTimeoutRef.current) {
        clearTimeout(conversationTimeoutRef.current)
      }
    }
  }, [isSpeaking, isSending, isMicActive, isConversationMode])

  const deleteMessage = async (messageId: string) => {
    const messageIndex = messages.findIndex((m) => m.id === messageId)
    if (messageIndex === -1) return

    // Delete this message and all messages after it
    const messagesToKeep = messages.slice(0, messageIndex)
    setMessages(messagesToKeep)

    // Delete from database
    try {
      await deleteUserMessagesAfter(messageId)
      toast({
        title: "Messages deleted",
        description: "Message and all following messages have been removed.",
      })
    } catch (error) {
      console.error("Error deleting messages:", error)
      toast({
        title: "Error",
        description: "Could not delete messages. Please try again.",
        variant: "destructive",
      })
    }
  }

  const startEditingMessage = (messageId: string, currentText: string) => {
    setEditingMessageId(messageId)
    setEditingText(currentText)
  }

  const saveEditedMessage = async () => {
    if (!editingMessageId || !editingText.trim()) return

    const messageIndex = messages.findIndex((m) => m.id === editingMessageId)
    if (messageIndex === -1) return

    // Update the message
    const updatedMessage = { ...messages[messageIndex], content: editingText.trim() }
    const messagesUpToEdit = messages.slice(0, messageIndex + 1)
    messagesUpToEdit[messageIndex] = updatedMessage

    setMessages(messagesUpToEdit)
    setEditingMessageId(null)
    setEditingText("")

    // Delete messages after the edited one from database
    try {
      await deleteUserMessagesAfter(editingMessageId)

      // Save the updated message
      await saveUserMessage(updatedMessage)

      // If it's a user message, generate a new AI response
      if (updatedMessage.role === "user") {
        setIsSending(true)
        try {
          const res = await fetch("/api/buddy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              settings,
              messages: messagesUpToEdit.slice(-12),
            }),
          })

          if (res.ok) {
            const data = (await res.json()) as { text: string }
            
            // Process response to remove emojis if the setting is disabled
            const responseText = processMessageContent(data.text)
            
            const newAssistantMessage: BuddyMessage = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: responseText,
              createdAt: Date.now(),
            }
            setMessages((prev) => [...prev, newAssistantMessage])
            speak(responseText)
          }
        } catch (error) {
          console.error("Error generating new response:", error)
        } finally {
          setIsSending(false)
        }
      }

      toast({
        title: "Message updated",
        description: "Message has been edited and following messages removed.",
      })
    } catch (error) {
      console.error("Error updating message:", error)
      toast({
        title: "Error",
        description: "Could not update message. Please try again.",
        variant: "destructive",
      })
    }
  }

  const cancelEditing = () => {
    setEditingMessageId(null)
    setEditingText("")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your Buddy...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-background text-foreground ${getMainFontSize(settings.fontSize)}`}>
      {/* Refresh Notice */}
      <div className="fixed top-0 left-0 right-0 z-40 flex justify-center pt-2">
        <p className="text-xs text-muted-foreground/50 text-center px-4">
          Please refresh the page if you encounter any problems
        </p>
      </div>
      
      {/* Fixed Overlay Avatar with Menu */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 hidden lg:block">
        <div className="relative flex items-center gap-4" data-avatar-menu>
          {/* Avatar */}
          <button
            onClick={handleAvatarClick}
            className={`transition-transform duration-600 hover:scale-105 ${
              isAvatarSpinning ? 'animate-spin-fast' : ''
            }`}
          >
            <Avatar className="h-16 w-16 xl:h-20 xl:w-20 border-4 border-primary/20 shadow-2xl bg-background cursor-pointer hover:border-primary/40 transition-colors">
              <AvatarImage 
                src={settings.buddyAvatarUrl || "/smiling-buddy-avatar.png"} 
                alt="Buddy's face" 
                className="object-cover"
              />
              <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-blue-400 to-purple-600 text-white">
                BD
              </AvatarFallback>
            </Avatar>
          </button>
          
          {/* Options Menu */}
          <div className={`flex flex-col gap-2 transition-all duration-500 ease-out ${
            showAvatarMenu 
              ? 'opacity-100 translate-x-0 scale-100' 
              : 'opacity-0 -translate-x-4 scale-95 pointer-events-none'
          }`}>
            {/* Settings - Top */}
            <Button
              size="sm"
              variant="outline"
              className="bg-background/80 backdrop-blur-sm hover:bg-primary/10 transition-colors shadow-lg"
              onClick={() => {
                setShowAvatarMenu(false)
                setOpenSettings(true)
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            
            {/* Option 2 - Middle (shifted to the right) */}
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                className="bg-background/80 backdrop-blur-sm hover:bg-primary/10 transition-colors shadow-lg transform translate-x-4"
                onClick={() => {
                  setShowAvatarMenu(false)
                  toast({ title: "Option 2", description: "You clicked option 2!" })
                }}
              >
                Option 2
              </Button>
            </div>
            
            {/* Option 3 - Bottom */}
            <Button
              size="sm"
              variant="outline"
              className="bg-background/80 backdrop-blur-sm hover:bg-primary/10 transition-colors shadow-lg"
              onClick={() => {
                setShowAvatarMenu(false)
                toast({ title: "Option 3", description: "You clicked option 3!" })
              }}
            >
              Option 3
            </Button>
          </div>
        </div>
      </div>
      
      <div className="max-w-full mx-auto p-4 space-y-4">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={settings.buddyAvatarUrl || "/smiling-buddy-avatar.png"} alt="Buddy avatar" />
              <AvatarFallback>BD</AvatarFallback>
            </Avatar>
            <div>
              <h1 className={`font-semibold ${getHeadingFontSize(settings.fontSize)}`}>Buddy</h1>
              <p className={`text-muted-foreground ${getDescriptionFontSize(settings.fontSize)}`}>{t("companionDescription")}</p>
              <p className={`text-muted-foreground ${getDescriptionFontSize(settings.fontSize)}`}>Created by Mohamad Sawan</p>
            </div>
          </div>
        <div className="flex items-center gap-2">
          {/* Clock Display */}
          <ClockDisplay timezone={settings.timezone} className="hidden sm:flex" />
          
          {/* Debug: Show notification count */}
          {process.env.NODE_ENV === 'development' && (
            <span className="text-xs text-muted-foreground">Debug: {notifications.length} notifications</span>
          )}
          
          {/* Notification Panel */}
          <NotificationPanel 
            language={uiPreferences.language}
            fontSize={settings.fontSize}
            notifications={notifications}
            onNotificationSpoken={(notification) => {
              // Speech is now handled in the main reminder processing
              // This callback can be used for other notification types if needed
              console.log("[v0] Notification panel callback triggered:", notification.title)
            }}
            onAddNotification={addNotification}
            onRemoveNotification={removeNotification}
            onClearAll={clearAllNotifications}
            onMarkAsRead={markNotificationAsRead}
          />
          
          {/* Language Selector */}
          <Select
            value={uiPreferences.language}
            onValueChange={(value: "en" | "nl") => setUIPreferences(s => ({ ...s, language: value }))}
          >
            <SelectTrigger className="w-32 h-9">
              <SelectValue>
                {uiPreferences.language === "en" ? "🇺🇸 English" : "🇳🇱 Dutch"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="en">🇺🇸 English</SelectItem>
                <SelectItem value="nl">🇳🇱 Dutch</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          
          <UserProfile 
            onOpenSettings={() => setOpenSettings(true)} 
            userAvatarUrl={settings.userAvatarUrl}
            language={uiPreferences.language}
          />
          <Sheet open={openSettings} onOpenChange={setOpenSettings}>
            <SheetContent side="right" className="w-full max-w-md flex flex-col">
              <SheetHeader className="flex-shrink-0">
                <SheetTitle>{t('appName')} {t('settings')}</SheetTitle>
                <SheetDescription>Personalize Buddy's style and safety.</SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto mt-4">
                <div className="space-y-5 pb-4">
                  <div className="space-y-2">
                    <Label htmlFor="userName" className={getMainFontSize(settings.fontSize)}>{t('yourName')}</Label>
                    <Input
                      id="userName"
                      className={getMainFontSize(settings.fontSize)}
                      placeholder={t("namePlaceholder")}
                      value={settings.userName}
                      onChange={(e) => setSettings((s) => ({ ...s, userName: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tone">{t("tone")}</Label>
                      <Select
                        value={settings.tone}
                        onValueChange={(v) => setSettings((s) => ({ ...s, tone: v as BuddySettings["tone"] }))}
                      >
                        <SelectTrigger id="tone">
                          <SelectValue placeholder={t("chooseTone")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>{t("tone")}</SelectLabel>
                            <SelectItem value="gentle">{t("gentle")}</SelectItem>
                            <SelectItem value="cheerful">{t("cheerful")}</SelectItem>
                            <SelectItem value="calm">{t("calm")}</SelectItem>
                            <SelectItem value="formal">{t("formal")}</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pace">{t("pace")}</Label>
                      <Select
                        value={settings.pace}
                        onValueChange={(v) => setSettings((s) => ({ ...s, pace: v as BuddySettings["pace"] }))}
                      >
                        <SelectTrigger id="pace">
                          <SelectValue placeholder={t("choosePace")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>{t("pace")}</SelectLabel>
                            <SelectItem value="very-slow">{t("verySlow")}</SelectItem>
                            <SelectItem value="slow">{t("slow")}</SelectItem>
                            <SelectItem value="normal">{t("normal")}</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone" className={getMainFontSize(settings.fontSize)}>Timezone</Label>
                    <p className={`text-muted-foreground text-xs ${getDescriptionFontSize(settings.fontSize)}`}>
                      {isGoogleConnected ? "🔗 Auto-synced with Google Calendar" : "Select your timezone for accurate reminders"}
                    </p>
                    <Select
                      value={settings.timezone}
                      onValueChange={(v) => setSettings((s) => ({ ...s, timezone: v }))}
                      disabled={isGoogleConnected}
                    >
                      <SelectTrigger id="timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <SelectGroup>
                          <SelectLabel>Popular Timezones</SelectLabel>
                          <SelectItem value="America/New_York">Eastern Time (US)</SelectItem>
                          <SelectItem value="America/Chicago">Central Time (US)</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time (US)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time (US)</SelectItem>
                          <SelectItem value="Europe/London">London (UK)</SelectItem>
                          <SelectItem value="Europe/Paris">Paris (France)</SelectItem>
                          <SelectItem value="Europe/Berlin">Berlin (Germany)</SelectItem>
                          <SelectItem value="Asia/Dubai">Dubai (UAE)</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo (Japan)</SelectItem>
                          <SelectItem value="Asia/Shanghai">Shanghai (China)</SelectItem>
                          <SelectItem value="Australia/Sydney">Sydney (Australia)</SelectItem>
                          <SelectItem value="Pacific/Auckland">Auckland (New Zealand)</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>All Timezones</SelectLabel>
                          {Intl.supportedValuesOf('timeZone').map(tz => (
                            <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label htmlFor="useEmojis" className={getMainFontSize(settings.fontSize)}>{t("useGentleEmojis")}</Label>
                      <p className={`text-muted-foreground ${getDescriptionFontSize(settings.fontSize)}`}>{t("addWarmTouch")}</p>
                    </div>
                    <Switch
                      id="useEmojis"
                      checked={settings.useEmojis}
                      onCheckedChange={async (v) => {
                        // Update settings state immediately
                        setSettings((s) => ({ ...s, useEmojis: v }))
                        
                        // Save to database
                        try {
                          await saveUserSettings({ ...settings, useEmojis: v })
                          toast({
                            title: "Settings saved",
                            description: `Gentle emojis ${v ? 'enabled' : 'disabled'}`,
                          })
                        } catch (error) {
                          console.error('Failed to save emoji setting:', error)
                          toast({
                            title: "Error",
                            description: "Failed to save emoji setting",
                            variant: "destructive"
                          })
                          // Revert state on error
                          setSettings((s) => ({ ...s, useEmojis: !v }))
                          setUIPreferences((s) => ({ ...s, useEmojis: !v }))
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="humor">{t("humor")}</Label>
                    <Select
                      value={settings.humor}
                      onValueChange={(v) => setSettings((s) => ({ ...s, humor: v as BuddySettings["humor"] }))}
                    >
                      <SelectTrigger id="humor">
                        <SelectValue placeholder={t("humorPreference")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>{t("humor")}</SelectLabel>
                          <SelectItem value="never">{t("never")}</SelectItem>
                          <SelectItem value="sometimes">{t("sometimes")}</SelectItem>
                          <SelectItem value="often">{t("often")}</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aiModel">{t("aiModel")}</Label>
                    <Select
                      value={settings.aiModel}
                      onValueChange={(v) => setSettings((s) => ({ ...s, aiModel: v as BuddySettings["aiModel"] }))}
                    >
                      <SelectTrigger id="aiModel">
                        <SelectValue placeholder={t("chooseAiModel")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>{t("aiModel")}</SelectLabel>
                          <SelectItem value="auto">{t("autoBestAvailable")}</SelectItem>
                          <SelectItem value="grok-3">Grok-3 (xAI)</SelectItem>
                          <SelectItem value="gpt-4o">GPT-4o (OpenAI)</SelectItem>
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini (OpenAI)</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <VoiceSettings
                    settings={settings}
                    language={uiPreferences.language}
                    onSettingsChange={(newPartialSettings) => setSettings((s) => ({ ...s, ...newPartialSettings }))}
                  />

                  {/* Test Notification Button */}
                  <div className="rounded-lg border p-3">
                    <div className="space-y-2">
                      <Label>{t('testNotifications')}</Label>
                      <p className={`text-muted-foreground ${getDescriptionFontSize(settings.fontSize)}`}>
                        {t('testNotificationDesc')}
                      </p>
                      <Button 
                        onClick={handleTestNotification}
                        variant="outline" 
                        size="sm"
                        className="w-full"
                      >
                        {t('testReminderButton')}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className={getHeadingFontSize(settings.fontSize)}>{t('interfacePreferences')}</Label>
                    <div className="space-y-3">
                      {/* Font Size Selector */}
                      <div className="rounded-lg border p-3">
                        <FontSizeSelector
                          currentSize={settings.fontSize}
                          onSizeChange={(size) => setSettings((s) => ({ ...s, fontSize: size }))}
                        />
                      </div>

                      {/* Theme Selector */}
                      <div className="rounded-lg border p-3">
                        <div className="space-y-3">
                          <div>
                            <Label className={getMainFontSize(settings.fontSize)}>{t('theme')}</Label>
                            <p className={`text-muted-foreground ${getDescriptionFontSize(settings.fontSize)}`}>{t('themeDescription')}</p>
                          </div>
                          <Select
                            value={settings.theme}
                            onValueChange={async (value: "light" | "dark" | "auto") => {
                              setSettings((s) => ({ ...s, theme: value }))
                              
                              // Apply theme immediately
                              if (value === "auto") {
                                setTheme("system")
                              } else {
                                setTheme(value)
                              }
                              
                              // Save to database
                              try {
                                await saveUserSettings({ ...settings, theme: value })
                                toast({
                                  title: t("settingsSaved"),
                                  description: `Theme updated to ${value}`,
                                })
                              } catch (error) {
                                console.error('Failed to save theme setting:', error)
                                toast({
                                  title: t("error"),
                                  description: "Failed to save theme setting",
                                  variant: "destructive"
                                })
                                // Revert on error
                                setSettings((s) => ({ ...s, theme: settings.theme }))
                                if (settings.theme === "auto") {
                                  setTheme("system")
                                } else {
                                  setTheme(settings.theme)
                                }
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">{t('themeAuto')}</SelectItem>
                              <SelectItem value="light">{t('themeLight')}</SelectItem>
                              <SelectItem value="dark">{t('themeDark')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <Label htmlFor="showHowToUse" className={getMainFontSize(settings.fontSize)}>{t('showHowToUseGuide')}</Label>
                          <p className={`text-muted-foreground ${getDescriptionFontSize(settings.fontSize)}`}>{t('showHowToUseGuideDesc')}</p>
                        </div>
                        <Switch
                          id="showHowToUse"
                          checked={uiPreferences.showHowToUse}
                          onCheckedChange={(v) => setUIPreferences((s) => ({ 
                            ...s, 
                            showHowToUse: v,
                            manuallyEnabledGuide: v ? true : s.manuallyEnabledGuide // Set flag when manually enabled
                          }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="language" className={getMainFontSize(settings.fontSize)}>{t('language')}</Label>
                        <Select
                          value={uiPreferences.language}
                          onValueChange={(value: "en" | "nl") => setUIPreferences(s => ({ ...s, language: value }))}
                        >
                          <SelectTrigger id="language">
                            <SelectValue placeholder={t("chooseLanguage")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>{t('language')}</SelectLabel>
                              <SelectItem value="en">🇺🇸 {t('languageEnglish')}</SelectItem>
                              <SelectItem value="nl">🇳🇱 {t('languageDutch')}</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('connections')}</Label>
                    <ConnectionsSettings
                      language={uiPreferences.language}
                      onConnectionChange={() => {
                        console.log("[v0] Connection changed, refreshing data...")
                        checkGoogleConnection()
                        updateCalendarStatus()
                        // Refresh Google Calendar when connection changes
                        setTimeout(() => {
                          refreshGoogleCalendar()
                        }, 500)
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <CalendarReminderSettings />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="userAvatar">{t("yourProfilePicture")}</Label>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={settings.userAvatarUrl || "/placeholder-user.jpg"} alt="Your avatar" />
                          <AvatarFallback>
                            <UserRound className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Input
                            id="userAvatar"
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                const url = URL.createObjectURL(file)
                                setSettings((s) => ({ ...s, userAvatarUrl: url }))
                                toast({
                                  title: t("profilePictureUpdated"),
                                  description: t("avatarChanged"),
                                })
                              }
                            }}
                          />
                          {settings.userAvatarUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 bg-transparent"
                              onClick={() => {
                                setSettings((s) => ({ ...s, userAvatarUrl: "" }))
                                toast({
                                  title: t("avatarReset"),
                                  description: t("usingDefaultAvatar"),
                                })
                              }}
                            >
                              {t("resetToDefault")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="buddyAvatar">{t("buddyProfilePicture")}</Label>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={settings.buddyAvatarUrl || "/smiling-buddy-avatar.png"}
                            alt="Buddy's avatar"
                          />
                          <AvatarFallback>BD</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Input
                            id="buddyAvatar"
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                const url = URL.createObjectURL(file)
                                setSettings((s) => ({ ...s, buddyAvatarUrl: url }))
                                toast({
                                  title: t("buddyPictureUpdated"),
                                  description: t("buddyAvatarChanged"),
                                })
                              }
                            }}
                          />
                          {settings.buddyAvatarUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 bg-transparent"
                              onClick={() => {
                                setSettings((s) => ({ ...s, buddyAvatarUrl: "" }))
                                toast({
                                  title: t("buddyAvatarReset"),
                                  description: t("usingDefaultBuddyAvatar"),
                                })
                              }}
                            >
                              {t("resetToDefault")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="revealBackstory">{t("backstoryLabel")}</Label>
                    <Select
                      value={settings.revealBackstory}
                      onValueChange={(v) =>
                        setSettings((s) => ({ ...s, revealBackstory: v as BuddySettings["revealBackstory"] }))
                      }
                    >
                      <SelectTrigger id="revealBackstory">
                        <SelectValue placeholder={t("backstoryBehavior")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>{t("backstoryMention")}</SelectLabel>
                          <SelectItem value="when-asked">{t("onlyWhenAsked")}</SelectItem>
                          <SelectItem value="natural-fit">{t("onlyIfFitsNaturally")}</SelectItem>
                          <SelectItem value="never">{t("never")}</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backstory">{t("backstoryText")}</Label>
                    <Textarea
                      id="backstory"
                      rows={3}
                      value={settings.backstory}
                      onChange={(e) => setSettings((s) => ({ ...s, backstory: e.target.value }))}
                    />
                  </div>

                  {/* Permissions Section */}
                  <div className="space-y-3 pt-4 border-t">
                    <Label className="text-base font-semibold">Permissions</Label>
                    <p className="text-sm text-muted-foreground">
                      Manage app permissions for calendar access
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium text-sm">Google Calendar</p>
                            <p className="text-xs text-muted-foreground">
                              {calendarStatus.hasCalendarPermission 
                                ? "✅ Permission granted" 
                                : "⚠️ Permission not granted"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {calendarStatus.hasCalendarPermission ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  try {
                                    const { data: { user } } = await supabase.auth.getUser()
                                    if (!user) return
                                    
                                    // Delete the connected account to revoke permission
                                    await supabase
                                      .from('user_connected_accounts')
                                      .delete()
                                      .eq('user_id', user.id)
                                      .eq('provider', 'google')
                                    
                                    toast({
                                      title: "Permission Removed",
                                      description: "Google Calendar permission has been revoked.",
                                    })
                                    
                                    checkGoogleConnection()
                                    updateCalendarStatus()
                                    refreshGoogleCalendar()
                                  } catch (error) {
                                    console.error("Error removing permission:", error)
                                    toast({
                                      title: "Error",
                                      description: "Failed to remove permission.",
                                      variant: "destructive"
                                    })
                                  }
                                }}
                              >
                                Remove
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={async () => {
                                  try {
                                    const { error } = await supabase.auth.signInWithOAuth({
                                      provider: 'google',
                                      options: {
                                        redirectTo: `${window.location.origin}/auth/callback?connection=calendar`,
                                        scopes: 'openid email profile https://www.googleapis.com/auth/calendar',
                                        queryParams: {
                                          access_type: 'offline',
                                          prompt: 'consent',
                                        },
                                      },
                                    })
                                    
                                    if (error) {
                                      toast({
                                        title: "Error",
                                        description: "Failed to regrant permission.",
                                        variant: "destructive"
                                      })
                                    }
                                  } catch (error) {
                                    console.error("Error regranting permission:", error)
                                  }
                                }}
                              >
                                Regrant
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={async () => {
                                try {
                                  const { error } = await supabase.auth.signInWithOAuth({
                                    provider: 'google',
                                    options: {
                                      redirectTo: `${window.location.origin}/auth/callback?connection=calendar`,
                                      scopes: 'openid email profile https://www.googleapis.com/auth/calendar',
                                      queryParams: {
                                        access_type: 'offline',
                                        prompt: 'consent',
                                      },
                                    },
                                  })
                                  
                                  if (error) {
                                    toast({
                                      title: "Error",
                                      description: "Failed to grant permission.",
                                      variant: "destructive"
                                    })
                                  }
                                } catch (error) {
                                  console.error("Error granting permission:", error)
                                }
                              }}
                            >
                              Grant Permission
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="blocked">{t("blockedTopics")}</Label>
                    <Input
                      id="blocked"
                      placeholder={t("harmfulContentPlaceholder")}
                      value={settings.blockedTopics.join(", ")}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          blockedTopics: e.target.value
                            .split(",")
                            .map((x) => x.trim())
                            .filter(Boolean),
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
              <SheetFooter className="flex-shrink-0 mt-4">
                <div className={`w-full rounded-lg bg-accent text-accent-foreground px-3 py-2 ${getDescriptionFontSize(settings.fontSize)}`}>
                  Buddy will avoid medical, financial, and legal advice, and keep chats kind and age-friendly.
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-3 xl:grid-cols-3">
        <Card className="col-span-1">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Smile className="h-5 w-5 text-emerald-600" />
                {t("chatWithBuddy")}
              </CardTitle>
              <ModelStatus model={settings.aiModel} />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div
              ref={chatContainerRef}
              className="h-[40vh] w-full overflow-y-auto rounded-md border bg-card text-card-foreground p-3 sm:h-[50vh] lg:h-[55vh] xl:h-[60vh]"
              aria-live="polite"
              aria-label="Conversation"
            >
              <ul className="space-y-3">
                {messages.map((m, index) => (
                  <li key={m.id} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                    {m.role === "assistant" && (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={settings.buddyAvatarUrl || "/warm-smiling-face.png"} alt="Buddy" />
                        <AvatarFallback>BD</AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex flex-col gap-1 max-w-[90%]">
                      {editingMessageId === m.id ? (
                        <div className="flex flex-col gap-2">
                          <Textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="min-h-[60px]"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveEditedMessage}>
                              <Check className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEditing}>
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div
                            className={cn(
                              `rounded-2xl px-3 py-2 leading-relaxed relative group ${getMainFontSize(settings.fontSize)}`,
                              m.role === "user" 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {m.role === "assistant" && settings.userName ? (
                              <span className="sr-only">{`${settings.userName}, `}</span>
                            ) : null}
                            <span>{m.content}</span>

                            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              {m.role === "user" && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-6 w-6 p-0"
                                  onClick={() => startEditingMessage(m.id, m.content)}
                                  title="Edit message"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                              )}
                              {index > 0 && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-6 w-6 p-0"
                                  onClick={() => deleteMessage(m.id)}
                                  title="Delete message and all following"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    {m.role === "user" && (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={settings.userAvatarUrl || "/placeholder-user.jpg"} alt="You" />
                        <AvatarFallback>
                          <UserRound className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </li>
                ))}
                <div ref={messagesEndRef} />
              </ul>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {suggestionChips.map((s) => (
                <Button key={s.label} variant="secondary" className="rounded-full" size="sm" onClick={s.onClick}>
                  <Zap className="mr-2 h-4 w-4" />
                  {s.label}
                </Button>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex flex-row items-center gap-4 pt-2 flex-wrap">
            {settings.voiceMode === "traditional" ? (
              <>
                <VoiceInput
                  ref={voiceInputRef}
                  onVoiceInput={handleVoiceInput}
                  isSending={isSending || isSpeaking}
                  voiceSettings={settings}
                  onSpeechStart={() => setIsMicActive(true)}
                  onSpeechEnd={() => setIsMicActive(false)}
                  language={uiPreferences.language}
                  isConversationMode={isConversationMode}
                />
                <Button
                  variant={isConversationMode ? "destructive" : "default"}
                  size="lg"
                  onClick={toggleConversationMode}
                  className={cn(
                    "flex items-center gap-2 transition-all duration-200 flex-shrink-0",
                    isConversationMode && "animate-pulse"
                  )}
                  disabled={isSending || isSpeaking}
                  title={isConversationMode ? "Stop Conversation" : "Start Conversation"}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">{isConversationMode ? "Stop" : "Start"} Conversation</span>
                  <span className="sm:hidden">{isConversationMode ? "Stop" : "Talk"}</span>
                </Button>
              </>
            ) : (
              <>
                <RealtimeVoice
                  onMessage={handleVoiceInput}
                  isSending={isSending || isSpeaking}
                  settings={settings}
                  onSpeechStart={() => setIsMicActive(true)}
                  onSpeechEnd={() => setIsMicActive(false)}
                  onFallbackToTraditional={() => {
                    // Switch to traditional voice mode when realtime fails
                    const updatedSettings = { ...settings, voiceMode: 'traditional' as const }
                    setSettings(updatedSettings)
                    void saveUserSettings(updatedSettings)
                  }}
                  language={uiPreferences.language}
                />
                <Button
                  variant={isConversationMode ? "destructive" : "default"}
                  size="lg"
                  onClick={toggleConversationMode}
                  className={cn(
                    "flex items-center gap-2 transition-all duration-200 flex-shrink-0",
                    isConversationMode && "animate-pulse"
                  )}
                  disabled={isSending || isSpeaking}
                  title={isConversationMode ? "Stop Conversation" : "Start Conversation"}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">{isConversationMode ? "Stop" : "Start"} Conversation</span>
                  <span className="sm:hidden">{isConversationMode ? "Stop" : "Talk"}</span>
                </Button>
              </>
            )}
            <Input
              className={getMainFontSize(settings.fontSize)}
              placeholder={t("typeHerePlaceholderWithName").replace("{name}", nameOrFriend)}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  void sendMessage(input)
                }
              }}
              aria-label={t("typeHerePlaceholder")}
              disabled={isMicActive || isSpeaking || editingMessageId !== null}
            />
            <Button
              className={getMainFontSize(settings.fontSize)}
              onClick={() => void sendMessage(input)}
              disabled={isSending || isMicActive || isSpeaking || editingMessageId !== null}
              size="sm"
            >
              <Send className="mr-2 h-4 w-4" />
              {isSending ? t('sending') : t('send')}
            </Button>
          </CardFooter>
          
          {/* Animated How to Use Button - only show if enabled in settings */}
          {uiPreferences.showHowToUse && (
            <div className="flex justify-center px-4 pb-4 mt-2">
              <Button
                onClick={() => setShowGuide(true)}
                className="group relative bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 hover:from-purple-600 hover:via-pink-600 hover:to-indigo-600 text-white font-semibold py-2.5 px-6 sm:py-3 sm:px-8 rounded-full transform transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-pulse hover:animate-none w-full sm:w-auto"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity duration-300 animate-pulse"></div>
                <div className="relative flex items-center gap-2 justify-center">
                  <span className={getMainFontSize(settings.fontSize)}>✨</span>
                  <span className={`font-medium ${getMainFontSize(settings.fontSize)}`}>{t("howToUse")}</span>
                  <span className={`animate-bounce ${getMainFontSize(settings.fontSize)}`}>📚</span>
                </div>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </Button>
            </div>
          )}
        </Card>

        {/* Middle Column - Rive Face Animation */}
        <div className={cn(
          "col-span-1 lg:col-span-1",
          isAvatarFullscreen && "hidden"
        )}>
          <div className="relative h-[45vh] sm:h-[55vh] md:h-[65vh] lg:h-[80vh] w-full bg-gradient-to-b from-muted/10 to-muted/30 rounded-xl overflow-hidden flex items-center justify-center shadow-lg">
            <RiveFace 
              currentPhoneme={currentPhoneme}
              isSpeaking={isSpeaking}
              className="w-full h-full object-contain"
            />
            
            {/* Status Indicator - Top Right */}
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 z-20">
              <div className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full backdrop-blur-sm transition-all duration-300 shadow-lg",
                isSpeaking || isSending || isMicActive
                  ? "bg-red-500/95 text-white shadow-red-500/50 animate-pulse"
                  : "bg-green-500/95 text-white shadow-green-500/50"
              )}>
                {isSpeaking || isSending || isMicActive ? (
                  <MicOff className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-pulse" />
                ) : (
                  <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
                <span className="text-xs sm:text-sm font-semibold">
                  {isSpeaking || isSending || isMicActive ? "Listening..." : "Ready"}
                </span>
              </div>
            </div>
            
            {/* Fullscreen Button - Bottom Right */}
            <Button
              variant="secondary"
              size="icon"
              className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 md:bottom-4 md:right-4 z-20 h-9 w-9 sm:h-11 sm:w-11 rounded-full shadow-xl hover:scale-110 transition-all duration-200 bg-background/95 backdrop-blur-sm"
              onClick={() => setIsAvatarFullscreen(true)}
              title="Fullscreen"
            >
              <Maximize className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            
            {/* Conversation Button - Bottom Center */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 sm:bottom-3 md:bottom-4 z-20">
              <Button
                variant={isConversationMode ? "destructive" : "default"}
                onClick={toggleConversationMode}
                disabled={isSending || isSpeaking}
                className={cn(
                  "shadow-xl hover:scale-105 transition-all duration-200 backdrop-blur-sm font-semibold",
                  isConversationMode ? "bg-red-600 hover:bg-red-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white",
                  isConversationMode && "animate-pulse"
                )}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">
                  {isConversationMode ? "Stop Conversation" : "Start Conversation"}
                </span>
                <span className="sm:hidden">
                  {isConversationMode ? "Stop" : "Talk"}
                </span>
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4 col-span-1">
          <GoogleCalendar 
            ref={googleCalendarRef}
            isConnected={isGoogleConnected} 
            onConnect={() => setOpenSettings(true)}
            language={uiPreferences.language}
            fontSize={settings.fontSize}
            onRefresh={() => {
              console.log("[v0] Google Calendar refreshed")
              // You can add additional refresh logic here if needed
            }}
          />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className={`flex items-center gap-2 ${getHeadingFontSize(settings.fontSize)}`}>
                <Heart className="h-5 w-5 text-rose-600" />
                {t("gentleActivities")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addMessageFromSuggestion(t("seatedStretchRequest"))}
                  className={`justify-start h-auto py-2 px-3 text-left whitespace-normal ${getMainFontSize(settings.fontSize)}`}
                >
                  <span className="flex items-center gap-2">
                    🪑 <span>{t("seatedStretch")}</span>
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addMessageFromSuggestion(t("gratitudeExerciseRequest"))}
                  className={`justify-start h-auto py-2 px-3 text-left whitespace-normal ${getMainFontSize(settings.fontSize)}`}
                >
                  <span className="flex items-center gap-2">
                    🙏 <span>{t("gratitudeExercise")}</span>
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addMessageFromSuggestion(t("memoryPromptRequest"))}
                  className={`justify-start h-auto py-2 px-3 text-left whitespace-normal ${getMainFontSize(settings.fontSize)}`}
                >
                  <span className="flex items-center gap-2">
                    💭 <span>{t("memoryPrompt")}</span>
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addMessageFromSuggestion(t("breathingExerciseRequest"))}
                  className={`justify-start h-auto py-2 px-3 text-left whitespace-normal ${getMainFontSize(settings.fontSize)}`}
                >
                  <span className="flex items-center gap-2">
                    🫁 <span>{t("breathingExercise")}</span>
                  </span>
                </Button>
              </div>
              <p className={`text-muted-foreground text-center ${getDescriptionFontSize(settings.fontSize)}`}>
                {t("safetyNotice")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                {t("calendarSuggestions")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => addMessageFromSuggestion(t("doctorAppointmentRequest"))}
                  className={`justify-start h-auto py-2 px-3 text-left whitespace-normal ${getMainFontSize(settings.fontSize)}`}
                >
                  <span className="flex items-center gap-2">
                    {t("doctorAppointment")}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addMessageFromSuggestion(t("familyCallRequest"))}
                  className={`justify-start h-auto py-2 px-3 text-left whitespace-normal ${getMainFontSize(settings.fontSize)}`}
                >
                  <span className="flex items-center gap-2">
                    {t("familyCall")}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addMessageFromSuggestion("Schedule a grocery shopping trip for Friday morning")}
                  className={`justify-start h-auto py-2 px-3 text-left whitespace-normal ${getMainFontSize(settings.fontSize)}`}
                >
                  <span className="flex items-center gap-2">
                    🛒 <span>Grocery shopping</span>
                  </span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addMessageFromSuggestion(t("medicationTimeRequest"))}
                  className={`justify-start h-auto py-2 px-3 text-left whitespace-normal ${getMainFontSize(settings.fontSize)}`}
                >
                  <span className="flex items-center gap-2">
                    💊 <span>{t("medicationTime")}</span>
                  </span>
                </Button>
              </div>
              <p className={`text-muted-foreground text-center ${getDescriptionFontSize(settings.fontSize)}`}>
                {t("scheduleEventsHint")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className={`flex items-center gap-2 ${getHeadingFontSize(settings.fontSize)}`}>
                <Clock className="h-5 w-5 text-amber-600" />
                {t("reminders")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ReminderForm onAdd={(text, minutes) => addQuickReminder(text, minutes)} t={t} settings={settings} />
              <div className="space-y-2">
                {reminders.length === 0 ? (
                  <p className={`text-muted-foreground ${getDescriptionFontSize(settings.fontSize)}`}>{t("noRemindersYet")}</p>
                ) : (
                  reminders.map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-lg border p-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={r.done ? "secondary" : "default"}>{r.done ? t("done") : t("scheduled")}</Badge>
                        <span className={cn(`${getMainFontSize(settings.fontSize)}`, r.done && "line-through text-muted-foreground")}>{r.text}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-muted-foreground ${getDescriptionFontSize(settings.fontSize)}`}>{getTimeRemaining(r)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            const success = await deleteUserReminder(r.id)
                            if (success) {
                              setReminders((prev) => prev.filter((x) => x.id !== r.id))
                            } else {
                              toast({
                                title: "Error",
                                description: "Could not delete reminder. Please try again.",
                                variant: "destructive",
                              })
                            }
                          }}
                          aria-label="Delete reminder"
                          title="Delete reminder"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Reminder Suggestions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className={`flex items-center gap-2 ${getHeadingFontSize(settings.fontSize)}`}>
                <Plus className="h-4 w-4 text-amber-600" />
                {t("quickReminders")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="outline"
                  onClick={() => addQuickReminder(t("drinkWaterRequest"), 30)}
                  className={`justify-start ${getMainFontSize(settings.fontSize)}`}
                >
                  {t("drinkWater")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addQuickReminder(t("takeWalkRequest"), 60)}
                  className={`justify-start ${getMainFontSize(settings.fontSize)}`}
                >
                  {t("takeWalk")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addQuickReminder(t("takeMedicationRequest"), 15)}
                  className={`justify-start ${getMainFontSize(settings.fontSize)}`}
                >
                  {t("takeMedication")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addQuickReminder(t("doStretchingRequest"), 45)}
                  className={`justify-start ${getMainFontSize(settings.fontSize)}`}
                >
                  {t("doStretching")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addQuickReminder("Call a friend or family", 120)}
                  className={`justify-start ${getMainFontSize(settings.fontSize)}`}
                >
                  📞 Call someone (2 hours)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addQuickReminder("Take a rest break", 90)}
                  className={`justify-start ${getMainFontSize(settings.fontSize)}`}
                >
                  😴 Rest break (1.5 hours)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fullscreen Avatar Overlay */}
      {isAvatarFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-white dark:bg-slate-950 overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800"></div>
          
          {/* Avatar Container - Full Height */}
          <div className="relative w-full h-full min-h-screen flex items-center justify-center">
            <div className="w-full h-full max-w-[95vw] max-h-[95vh] flex items-center justify-center">
              <RiveFace 
                currentPhoneme={currentPhoneme}
                isSpeaking={isSpeaking}
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* Status Indicator - Top Right */}
            <div className="absolute top-4 right-4 sm:top-5 sm:right-5 md:top-6 md:right-6 lg:top-8 lg:right-8 z-30">
              <div className={cn(
                "flex items-center gap-2 sm:gap-2.5 md:gap-3 px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-full backdrop-blur-md transition-all duration-300 shadow-2xl",
                isSpeaking || isSending || isMicActive
                  ? "bg-red-500/95 text-white shadow-red-500/50 animate-pulse"
                  : "bg-green-500/95 text-white shadow-green-500/50"
              )}>
                {isSpeaking || isSending || isMicActive ? (
                  <MicOff className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 animate-pulse" />
                ) : (
                  <Mic className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8" />
                )}
                <span className="text-sm sm:text-base md:text-lg lg:text-xl font-bold">
                  {isSpeaking || isSending || isMicActive ? "Listening..." : "Ready to Talk"}
                </span>
              </div>
            </div>
            
            {/* Exit Fullscreen Button - Top Left */}
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 left-4 sm:top-5 sm:left-5 md:top-6 md:left-6 lg:top-8 lg:left-8 z-30 h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 lg:h-18 lg:w-18 rounded-full shadow-2xl hover:scale-110 transition-all duration-200 bg-background/95 backdrop-blur-md hover:bg-background"
              onClick={() => setIsAvatarFullscreen(false)}
              title="Exit Fullscreen"
            >
              <Minimize className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-9 lg:w-9" />
            </Button>
            
            {/* Conversation Button - Bottom Center */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 sm:bottom-10 md:bottom-12 lg:bottom-16 z-30">
              <Button
                variant={isConversationMode ? "destructive" : "default"}
                size="lg"
                onClick={toggleConversationMode}
                disabled={isSending || isSpeaking}
                className={cn(
                  "shadow-2xl hover:scale-105 transition-all duration-200 backdrop-blur-md px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-5 text-base sm:text-lg md:text-xl font-semibold",
                  isConversationMode ? "bg-red-600 hover:bg-red-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white",
                  isConversationMode && "animate-pulse"
                )}
              >
                <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 mr-2 sm:mr-3" />
                <span className="hidden sm:inline">
                  {isConversationMode ? "Stop Conversation" : "Start Conversation"}
                </span>
                <span className="sm:hidden">
                  {isConversationMode ? "Stop" : "Talk"}
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Beautiful How-to-Use Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            {/* Animated Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
              <div className="absolute top-1/4 right-8 w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-lg opacity-40 animate-bounce" style={{animationDelay: '1s'}}></div>
              <div className="absolute bottom-8 left-8 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full blur-xl opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>
            </div>

            {/* Header with Close Button */}
            <div className="relative flex items-center justify-between p-6 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <div className="text-3xl animate-bounce">📚</div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {t("howToUseBuddy")}
                </h2>
                <div className="text-3xl animate-pulse">✨</div>
              </div>
              <Button
                onClick={() => setShowGuide(false)}
                variant="ghost"
                size="sm"
                className="hover:bg-red-100 hover:text-red-600 transition-all duration-200 hover:scale-110"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Guide Content */}
            <div className="relative h-96 overflow-hidden">
              {guidePages.map((page, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 p-8 transition-all duration-700 ease-in-out ${
                    index === currentGuidePage
                      ? 'translate-x-0 opacity-100'
                      : index < currentGuidePage
                      ? '-translate-x-full opacity-0'
                      : 'translate-x-full opacity-0'
                  }`}
                >
                  <div className="h-full flex flex-col justify-center items-center text-center space-y-6">
                    <div className="text-6xl animate-bounce" style={{animationDelay: `${index * 0.2}s`}}>
                      {page.emoji}
                    </div>
                    <h3 className="text-2xl font-bold text-foreground animate-in slide-in-from-top duration-500">
                      {page.title}
                    </h3>
                    <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed animate-in slide-in-from-bottom duration-700">
                      {page.description}
                    </p>
                    {page.tips && (
                      <div className="bg-card/70 backdrop-blur rounded-2xl p-4 space-y-2 animate-in fade-in duration-1000">
                        {page.tips.map((tip, tipIndex) => (
                          <div key={tipIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="text-amber-500">💡</span>
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="relative flex items-center justify-between p-6 border-t border-purple-100 bg-white/50 backdrop-blur">
              <Button
                onClick={() => setCurrentGuidePage(Math.max(0, currentGuidePage - 1))}
                disabled={currentGuidePage === 0}
                variant="outline"
                className="hover:scale-105 transition-transform duration-200"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              {/* Page Indicators */}
              <div className="flex gap-2">
                {guidePages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentGuidePage(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-125 ${
                      index === currentGuidePage
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  />
                ))}
              </div>
              
              <Button
                onClick={() => {
                  if (currentGuidePage < guidePages.length - 1) {
                    setCurrentGuidePage(currentGuidePage + 1)
                  } else {
                    setShowGuide(false)
                    // Only hide the guide button if user didn't manually enable it from settings
                    if (!uiPreferences.manuallyEnabledGuide) {
                      setUIPreferences((s) => ({ ...s, showHowToUse: false }))
                    }
                  }
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:scale-105 transition-all duration-200"
              >
                {currentGuidePage === guidePages.length - 1 ? (
                  <>
                    Finish
                    <span className="ml-1">🎉</span>
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Reminder Notifications - DISABLED: handled by NotificationPanel instead */}
      {/* 
      <ReminderNotificationsContainer
        speakReminders={true}
      />
      */}
      <Toaster />
      </div>
    </div>
  )
}

function ReminderForm({ onAdd, t, settings }: { onAdd: (text: string, minutes: number) => void, t: (key: any) => string, settings: any }) {
  const [text, setText] = useState("")
  const [minutes, setMinutes] = useState<number | "">("")
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault()
        if (!text.trim() || !minutes || minutes <= 0) return
        onAdd(text.trim(), Number(minutes))
        setText("")
        setMinutes("")
      }}
    >
      <Input
        placeholder={t("reminderPlaceholder")}
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Reminder text"
        className={getMainFontSize(settings.fontSize)}
      />
      <Input
        placeholder={t("minutesPlaceholder")}
        inputMode="numeric"
        value={minutes}
        onChange={(e) => {
          const v = e.target.value
          if (v === "") setMinutes("")
          else {
            const n = Number(v.replace(/\D/g, ""))
            setMinutes(isNaN(n) ? "" : n)
          }
        }}
        className={`sm:max-w-[100px] ${getMainFontSize(settings.fontSize)}`}
        aria-label="Minutes from now"
      />
      <Button type="submit" className={getMainFontSize(settings.fontSize)}>
        <Plus className="mr-2 h-4 w-4" />
        Add
      </Button>
    </form>
  )
}




