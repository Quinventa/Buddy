"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase"
import { useTranslation } from "@/lib/translations"
import { FontSize } from "@/types/buddy"
import { getMainFontSize, getHeadingFontSize, getDescriptionFontSize } from "@/lib/font-utils"
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  MapPin, 
  User, 
  ChevronLeft, 
  ChevronRight,
  Unlock,
  AlertCircle,
  RefreshCw
} from "lucide-react"
import { 
  format, 
  parseISO, 
  isToday, 
  isTomorrow, 
  addDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths
} from "date-fns"

interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
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
  location?: string
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus: string
  }>
  status: string
  htmlLink: string
}

interface GoogleCalendarProps {
  isConnected: boolean
  onConnect: () => void
  onRefresh?: () => void
  language: "en" | "nl"
  fontSize: FontSize
}

export interface GoogleCalendarRef {
  refresh: () => Promise<void>
}

export const GoogleCalendar = React.forwardRef<GoogleCalendarRef, GoogleCalendarProps>(
  ({ isConnected, onConnect, onRefresh, language, fontSize }, ref) => {
  const { toast } = useToast()
  const { t } = useTranslation(language)
  const [events, setEvents] = React.useState<GoogleCalendarEvent[]>([])
  const [loading, setLoading] = React.useState(false)
  const [isLoggedInWithGoogle, setIsLoggedInWithGoogle] = React.useState(false)
  const [hasCalendarPermission, setHasCalendarPermission] = React.useState(false)
  const [accessToken, setAccessToken] = React.useState<string | null>(null)
  const [showNewEventDialog, setShowNewEventDialog] = React.useState(false)
  const [showEditEventDialog, setShowEditEventDialog] = React.useState(false)
  const [editingEvent, setEditingEvent] = React.useState<GoogleCalendarEvent | null>(null)
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date())
  const [newEvent, setNewEvent] = React.useState({
    summary: "",
    description: "",
    start: "",
    end: "",
    location: "",
    guests: [] as string[]
  })
  const [editEvent, setEditEvent] = React.useState({
    summary: "",
    description: "",
    start: "",
    end: "",
    location: "",
    guests: [] as string[]
  })
  const [guestInput, setGuestInput] = React.useState("")
  const supabase = createClient()

  // Refresh calendar data
  const refreshCalendarData = React.useCallback(async () => {
    console.log("[v0] Refreshing calendar data...")
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoggedInWithGoogle(false)
        setHasCalendarPermission(false)
        setAccessToken(null)
        setEvents([])
        return
      }

      // Check Google auth status
      const isGoogleAuth = user.app_metadata?.provider === 'google' || 
                          user.user_metadata?.iss?.includes('accounts.google.com')
      setIsLoggedInWithGoogle(isGoogleAuth)

      // Check calendar permissions using the utility function
      const { getCalendarStatus } = await import("@/lib/calendar-utils")
      const calendarStatus = await getCalendarStatus()
      
      setHasCalendarPermission(calendarStatus.hasCalendarPermission)
      setAccessToken(calendarStatus.accessToken)

      // Load events if we have permissions
      if (calendarStatus.hasCalendarPermission && calendarStatus.accessToken) {
        // Fetch events directly
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=50&singleEvents=true&orderBy=startTime`,
          {
            headers: {
              'Authorization': `Bearer ${calendarStatus.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (response.status === 401) {
          setHasCalendarPermission(false)
          toast({
            title: t("permissionExpired"),
            description: t("permissionExpiredDesc"),
            variant: "destructive"
          })
          return
        }

        if (response.ok) {
          const data = await response.json()
          setEvents(data.items || [])
          toast({
            title: language === 'nl' ? "Succesvol" : "Success",
            description: language === 'nl' ? "Agenda succesvol vernieuwd" : "Calendar refreshed successfully",
            duration: 2000,
          })
        } else {
          throw new Error(`Calendar API error: ${response.status}`)
        }
      } else {
        setEvents([])
      }
      
      // Call onRefresh callback if provided
      onRefresh?.()
    } catch (error) {
      console.error("[v0] Error refreshing calendar data:", error)
      toast({
        title: t("error"),
        description: language === 'nl' ? "Kan agenda niet vernieuwen" : "Unable to refresh calendar",
        variant: "destructive"
      })
    } finally {
      // Always reset loading state
      setLoading(false)
    }
  }, [supabase, onRefresh, t, toast, language])

  // Expose refresh function to parent component
  React.useImperativeHandle(ref, () => ({
    refresh: refreshCalendarData
  }), [refreshCalendarData])

  // Check if user is already logged in on mount and load events
  React.useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const isGoogleAuth = user.app_metadata?.provider === 'google' || 
                              user.user_metadata?.iss?.includes('accounts.google.com')
          setIsLoggedInWithGoogle(isGoogleAuth)
          
          if (isGoogleAuth) {
            // Check for access token and permissions
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.provider_token) {
              setAccessToken(session.provider_token)
              
              // Test calendar access
              const response = await fetch(
                'https://www.googleapis.com/calendar/v3/calendars/primary',
                {
                  headers: {
                    'Authorization': `Bearer ${session.provider_token}`,
                  }
                }
              )
              
              setHasCalendarPermission(response.ok)
              
              // Load events if we have permissions
              if (response.ok) {
                // Fetch events directly
                const eventsResponse = await fetch(
                  `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=50&singleEvents=true&orderBy=startTime`,
                  {
                    headers: {
                      'Authorization': `Bearer ${session.provider_token}`,
                      'Content-Type': 'application/json'
                    }
                  }
                )
                
                if (eventsResponse.ok) {
                  const data = await eventsResponse.json()
                  setEvents(data.items || [])
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("[v0] Error checking auth status:", error)
      }
    }
    
    checkAuthStatus()
  }, [supabase])

  // Set up authentication state listener (only refresh on sign-in)
  React.useEffect(() => {
    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] Auth state changed:", event, !!session)
      
      if (event === 'SIGNED_IN') {
        // User signed in - refresh calendar data
        console.log("[v0] User signed in, refreshing calendar...")
        await refreshCalendarData()
      } else if (event === 'SIGNED_OUT') {
        // User signed out - clear calendar data
        console.log("[v0] User signed out, clearing calendar data...")
        setIsLoggedInWithGoogle(false)
        setHasCalendarPermission(false)
        setAccessToken(null)
        setEvents([])
      }
    })

    // Cleanup listener
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, refreshCalendarData])

  // Request calendar permissions separately
  const requestCalendarPermissions = async () => {
    try {
      setLoading(true)
      
      if (!isLoggedInWithGoogle) {
        toast({
          title: t("googleAccountRequired"),
          description: t("googleAccountRequiredDesc"),
          variant: "destructive"
        })
        return
      }

      // Redirect to Google OAuth with calendar scopes
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
        console.error("[v0] Calendar permission error:", error)
        toast({
          title: t("permissionRequestFailed"),
          description: error.message || t("failedToRequestPermissions"),
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("[v0] Error requesting calendar permissions:", error)
      toast({
        title: t("permissionError"),
        description: t("unexpectedPermissionError"),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Check for calendar permissions after OAuth
  React.useEffect(() => {
    const checkCalendarPermission = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.provider_token) {
          setAccessToken(session.provider_token)
          
          // Test calendar access
          const response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary',
            {
              headers: {
                'Authorization': `Bearer ${session.provider_token}`,
              }
            }
          )
          
          setHasCalendarPermission(response.ok)
        }
      } catch (error) {
        console.error("[v0] Error checking calendar permission:", error)
      }
    }

    if (isLoggedInWithGoogle) {
      checkCalendarPermission()
    }
  }, [isLoggedInWithGoogle, t, toast])

  // Generate calendar grid
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = event.start.dateTime ? 
        parseISO(event.start.dateTime) : 
        parseISO(event.start.date!)
      return isSameDay(eventDate, date)
    })
  }

  // Load calendar events from Google Calendar API
  const loadCalendarEvents = async () => {
    if (!hasCalendarPermission || !accessToken) return

    setLoading(true)
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${new Date().toISOString()}&maxResults=50&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.status === 401) {
        toast({
          title: t("permissionExpired"),
          description: t("permissionExpiredDesc"),
          variant: "destructive"
        })
        setHasCalendarPermission(false)
        return
      }

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.status}`)
      }

      const data = await response.json()
      setEvents(data.items || [])
      
    } catch (error) {
      console.error("[v0] Error loading calendar events:", error)
      toast({
        title: t("calendarLoadFailed"),
        description: t("unableToLoadEvents"),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Create new calendar event
  const createEvent = async () => {
    console.log('[v0] CreateEvent called with:', { 
      summary: newEvent.summary, 
      start: newEvent.start, 
      end: newEvent.end 
    })

    // Check for missing fields individually
    const missingFields = []
    if (!newEvent.summary) missingFields.push("title")
    if (!newEvent.start) missingFields.push("start time")
    if (!newEvent.end) missingFields.push("end time")
    
    if (missingFields.length > 0) {
      console.log('[v0] Missing required fields validation triggered:', missingFields)
      
      let description = "Please fill in the "
      if (missingFields.length === 1) {
        description += `event ${missingFields[0]}.`
      } else if (missingFields.length === 2) {
        description += `event ${missingFields[0]} and ${missingFields[1]}.`
      } else {
        description += `event ${missingFields[0]}, ${missingFields[1]}, and ${missingFields[2]}.`
      }
      
      toast({
        title: "Missing Information",
        description: description,
        className: "border-destructive bg-destructive/10 text-destructive"
      })
      return
    }

    // Validate that end time is not before start time
    const startTime = new Date(newEvent.start)
    const endTime = new Date(newEvent.end)
    console.log('[v0] Time validation:', { 
      startTime: startTime.toISOString(), 
      endTime: endTime.toISOString(),
      endIsBeforeStart: endTime <= startTime
    })
    
    if (endTime <= startTime) {
      console.log('[v0] End time before start time validation triggered')
      
      toast({
        title: "⚠️ Invalid Time Range",
        description: "End time cannot be before start time.",
        // variant: "destructive",  // Try default variant
        className: "border-destructive bg-destructive/10 text-destructive" // Custom red styling
      })
      
      console.log('[v0] Regular toast called with custom red styling')
      return
    }

    if (!hasCalendarPermission || !accessToken) {
      toast({
        title: t("permissionRequestFailed"),
        description: t("calendarAccessRequired"),
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      
      const eventData = {
        summary: newEvent.summary,
        description: newEvent.description,
        start: {
          dateTime: new Date(newEvent.start).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: new Date(newEvent.end).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        location: newEvent.location,
        attendees: newEvent.guests.map(email => ({ email }))
      }

      console.log('[v0] Creating calendar event with data:', {
        ...eventData,
        accessTokenLength: accessToken?.length || 0
      })

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventData)
        }
      )

      console.log('[v0] Calendar event creation response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('[v0] Calendar event creation failed:', {
          status: response.status,
          error: errorData,
          eventData: {
            ...eventData,
            // Don't log the full access token
            accessTokenLength: accessToken?.length || 0
          }
        })
        throw new Error(`Failed to create event: ${response.status} - ${errorData.error?.message || errorData.error || 'Unknown error'}`)
      }

      const createdEvent = await response.json()
      
      toast({
        title: t("eventCreatedSuccessfully"),
        description: `"${newEvent.summary}" has been added to your calendar${newEvent.guests.length > 0 ? ` and invitations sent to ${newEvent.guests.length} guest(s)` : ''}`,
      })

      setShowNewEventDialog(false)
      setNewEvent({ summary: "", description: "", start: "", end: "", location: "", guests: [] })
      setGuestInput("")
      
      // Add the new event to the existing events list immediately for better UX
      setEvents(prev => [...prev, createdEvent])
      
    } catch (error) {
      console.error("[v0] Error creating event:", error)
      toast({
        title: t("eventCreationFailed"),
        description: t("unableToCreateEvent"),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Delete calendar event
  const deleteEvent = async (eventId: string) => {
    if (!hasCalendarPermission || !accessToken) {
      toast({
        title: t("permissionRequestFailed"),
        description: t("calendarAccessRequiredDelete"),
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to delete event: ${response.status}`)
      }

      setEvents(prev => prev.filter(event => event.id !== eventId))
      
      toast({
        title: t("eventDeleted"),
        description: t("eventDeletedDesc"),
      })
    } catch (error) {
      console.error("[v0] Error deleting event:", error)
      toast({
        title: t("eventDeletionFailed"),
        description: t("unableToDeleteEvent"),
        variant: "destructive"
      })
    }
  }

  // Open edit dialog with event data
  const openEditEvent = (event: GoogleCalendarEvent) => {
    setEditingEvent(event)
    
    // Convert event data to form format
    const startDateTime = event.start.dateTime 
      ? format(parseISO(event.start.dateTime), "yyyy-MM-dd'T'HH:mm")
      : format(parseISO(event.start.date!), "yyyy-MM-dd'T'09:00")
    
    const endDateTime = event.end.dateTime
      ? format(parseISO(event.end.dateTime), "yyyy-MM-dd'T'HH:mm")
      : format(parseISO(event.end.date!), "yyyy-MM-dd'T'17:00")
    
    setEditEvent({
      summary: event.summary || "",
      description: event.description || "",
      start: startDateTime,
      end: endDateTime,
      location: event.location || "",
      guests: event.attendees?.map(a => a.email) || []
    })
    
    setShowEditEventDialog(true)
  }

  // Update existing event
  const updateEvent = async () => {
    if (!editingEvent) return
    
    // Check for missing fields individually
    const missingFields = []
    if (!editEvent.summary) missingFields.push("title")
    if (!editEvent.start) missingFields.push("start time")
    if (!editEvent.end) missingFields.push("end time")
    
    if (missingFields.length > 0) {
      console.log('[v0] Missing required fields validation triggered:', missingFields)
      
      toast({
        title: t("missingInformation"),
        description: t("fillRequiredFields"),
        className: "border-destructive bg-destructive/10 text-destructive"
      })
      return
    }

    // Validate that end time is not before start time
    const startTime = new Date(editEvent.start)
    const endTime = new Date(editEvent.end)
    if (endTime <= startTime) {
      console.log('[v0] End time before start time validation triggered for edit')
      
      toast({
        title: t("invalidTimeRange"),
        description: t("endTimeBeforeStartTime"),
        className: "border-destructive bg-destructive/10 text-destructive"
      })
      return
    }

    if (!hasCalendarPermission || !accessToken) {
      toast({
        title: t("permissionRequestFailed"),
        description: t("calendarAccessRequired"),
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      
      const eventData = {
        summary: editEvent.summary,
        description: editEvent.description,
        start: {
          dateTime: new Date(editEvent.start).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: new Date(editEvent.end).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        location: editEvent.location,
        attendees: editEvent.guests.map(email => ({ email }))
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${editingEvent.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventData)
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Calendar event update failed:", {
          status: response.status,
          error: errorData,
          eventData,
          accessTokenLength: accessToken?.length || 0
        })
        throw new Error(`Failed to update event: ${response.status} - ${errorData.error?.message || errorData.error || 'Unknown error'}`)
      }

      const updatedEvent = await response.json()
      
      toast({
        title: t("eventUpdated"),
        description: t("eventUpdatedDesc"),
      })

      setShowEditEventDialog(false)
      setEditingEvent(null)
      setEditEvent({ summary: "", description: "", start: "", end: "", location: "", guests: [] })
      
      // Update the event in the existing events list
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? updatedEvent : e))
      
    } catch (error) {
      console.error("[v0] Error updating event:", error)
      toast({
        title: t("eventUpdateFailed"),
        description: t("unableToUpdateEvent"),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Format event date/time for display
  const formatEventTime = (event: GoogleCalendarEvent) => {
    const startDate = event.start.dateTime ? parseISO(event.start.dateTime) : parseISO(event.start.date!)
    const endDate = event.end.dateTime ? parseISO(event.end.dateTime) : parseISO(event.end.date!)
    
    if (event.start.date) {
      // All-day event
      if (isToday(startDate)) return t("todayAllDay")
      if (isTomorrow(startDate)) return t("tomorrowAllDay")
      return format(startDate, `MMM d (${t("allDay")})`)
    }
    
    // Timed event
    const timeStr = `${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`
    if (isToday(startDate)) return `Today ${timeStr}`
    if (isTomorrow(startDate)) return `Tomorrow ${timeStr}`
    return `${format(startDate, "MMM d")} ${timeStr}`
  }

  // Show connection prompt for users without Google account
  if (!isLoggedInWithGoogle) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <Calendar className="h-12 w-12 mx-auto text-neutral-400 mb-2" />
          <CardTitle className={getHeadingFontSize(fontSize)}>{t("googleCalendar")}</CardTitle>
          <CardDescription className={getDescriptionFontSize(fontSize)}>{t("googleAccountRequiredDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button 
            onClick={onConnect} 
            size="sm"
            className={getMainFontSize(fontSize)}
          >
            {t("connectGoogleCalendar")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Show calendar permission request for Google users without calendar access
  if (isLoggedInWithGoogle && !hasCalendarPermission) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Calendar className="h-10 w-10 text-neutral-400 mr-2" />
            <Unlock className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className={getHeadingFontSize(fontSize)}>{t("connectGoogleCalendar")}</CardTitle>
          <CardDescription className={getDescriptionFontSize(fontSize)}>
            {t("grantCalendarPermissions")}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-3">
          <div className={`text-muted-foreground bg-muted p-3 rounded-lg ${getDescriptionFontSize(fontSize)}`}>
            <AlertCircle className="h-4 w-4 inline mr-1" />
            {t("calendarPermissionInfo")}
          </div>
          <Button 
            onClick={requestCalendarPermissions} 
            disabled={loading}
            size="sm"
          >
            {loading ? t("requestingAccess") : t("connectGoogleCalendar")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Show full calendar interface
  return (
    <Card className="w-full min-h-[600px]">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <CardTitle className={getHeadingFontSize(fontSize)}>{t("googleCalendar")}</CardTitle>
            </div>
            <Badge variant="secondary" className={`bg-accent text-accent-foreground w-fit ${getDescriptionFontSize(fontSize)}`}>
              ✓ Connected
            </Badge>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={refreshCalendarData}
              disabled={loading}
              className={`whitespace-nowrap ${getMainFontSize(fontSize)}`}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              {loading ? t("refreshing") : t("refresh")}
            </Button>
            
            {/* Reminders Button */}
            <Button 
              size="sm" 
              variant="outline" 
              className={`whitespace-nowrap ${getMainFontSize(fontSize)}`}
              onClick={() => {
                toast({
                  title: t("reminders"),
                  description: language === 'nl' ? "Herinneringen functie komt binnenkort!" : "Reminders feature coming soon!",
                  duration: 2000,
                })
              }}
            >
              <Clock className="h-3 w-3 mr-1" />
              {t("reminders")}
            </Button>
            
            <Dialog open={showNewEventDialog} onOpenChange={setShowNewEventDialog}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className={`whitespace-nowrap ${getMainFontSize(fontSize)}`}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {t("newEvent")}
                </Button>
              </DialogTrigger>
              <DialogContent>
              <DialogHeader>
                <DialogTitle className={getHeadingFontSize(fontSize)}>{t("createEvent")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className={getMainFontSize(fontSize)}>{t("eventTitle")}</Label>
                  <Input
                    id="title"
                    value={newEvent.summary}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, summary: e.target.value }))}
                    placeholder={t("meetingTitlePlaceholder")}
                  />
                </div>
                <div>
                  <Label htmlFor="description">{t("description")} ({t("optional")})</Label>
                  <Input
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t("meetingDescPlaceholder")}
                  />
                </div>
                <div>
                  <Label htmlFor="location">{t("locationOptional")}</Label>
                  <Input
                    id="location"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                    placeholder={t("meetingLocationPlaceholder")}
                  />
                </div>
                
                {/* Guests Section */}
                <div>
                  <Label htmlFor="guests">Guests (optional)</Label>
                  <div className="space-y-2">
                    <Input
                      id="guests"
                      value={guestInput}
                      onChange={(e) => setGuestInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && guestInput.trim()) {
                          e.preventDefault()
                          const email = guestInput.trim()
                          if (email.includes('@') && !newEvent.guests.includes(email)) {
                            setNewEvent(prev => ({ ...prev, guests: [...prev.guests, email] }))
                            setGuestInput("")
                          }
                        }
                      }}
                      placeholder={t("guestEmailPlaceholder")}
                    />
                    {newEvent.guests.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {newEvent.guests.map((guest, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="text-xs flex items-center gap-1"
                          >
                            <User className="h-3 w-3" />
                            {guest}
                            <button
                              type="button"
                              onClick={() => {
                                setNewEvent(prev => ({ 
                                  ...prev, 
                                  guests: prev.guests.filter((_, i) => i !== index) 
                                }))
                              }}
                              className="ml-1 hover:text-red-600"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start">{t("eventTime")} - {t("start")}</Label>
                    <Input
                      id="start"
                      type="datetime-local"
                      value={newEvent.start}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end">{t("eventTime")} - {t("end")}</Label>
                    <Input
                      id="end"
                      type="datetime-local"
                      value={newEvent.end}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowNewEventDialog(false)}>
                    {t("cancel")}
                  </Button>
                  <Button size="sm" onClick={createEvent} disabled={loading}>
                    {loading ? t("creating") : t("createEvent")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Event Dialog */}
          <Dialog open={showEditEventDialog} onOpenChange={setShowEditEventDialog}>
            <DialogContent className={`sm:max-w-[500px] ${getMainFontSize(fontSize)}`}>
              <DialogHeader>
                <DialogTitle className={getHeadingFontSize(fontSize)}>{t("editEvent")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editTitle" className={getMainFontSize(fontSize)}>{t("eventTitle")}</Label>
                  <Input
                    id="editTitle"
                    value={editEvent.summary}
                    onChange={(e) => setEditEvent(prev => ({ ...prev, summary: e.target.value }))}
                    placeholder={t("eventTitle")}
                  />
                </div>
                <div>
                  <Label htmlFor="editDescription">{t("eventDescription")} (optional)</Label>
                  <Input
                    id="editDescription"
                    value={editEvent.description}
                    onChange={(e) => setEditEvent(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t("eventDescription")}
                  />
                </div>
                <div>
                  <Label htmlFor="editLocation">{t("locationOptional")}</Label>
                  <Input
                    id="editLocation"
                    value={editEvent.location}
                    onChange={(e) => setEditEvent(prev => ({ ...prev, location: e.target.value }))}
                    placeholder={t("meetingLocationPlaceholder")}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editStart">{t("start")}</Label>
                    <Input
                      id="editStart"
                      type="datetime-local"
                      value={editEvent.start}
                      onChange={(e) => setEditEvent(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editEnd">{t("end")}</Label>
                    <Input
                      id="editEnd"
                      type="datetime-local"
                      value={editEvent.end}
                      onChange={(e) => setEditEvent(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowEditEventDialog(false)}>
                    {t("cancel")}
                  </Button>
                  <Button size="sm" onClick={updateEvent} disabled={loading}>
                    {loading ? t("updating") : t("updateEvent")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-3">
          {/* Week Header */}
          <div className="grid grid-cols-7 gap-2 text-center text-sm font-semibold text-neutral-700 pb-2 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-2">{day}</div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {generateCalendarDays().map((date, index) => {
              const dayEvents = getEventsForDate(date)
              const isCurrentMonth = isSameMonth(date, currentMonth)
              const isSelected = isSameDay(date, selectedDate)
              const isToday = isSameDay(date, new Date())
              
              return (
                <div
                  key={index}
                  className={`
                    min-h-[120px] p-3 border rounded cursor-pointer transition-colors text-sm
                    ${isCurrentMonth ? 'bg-background' : 'bg-muted text-muted-foreground'}
                    ${isSelected ? 'ring-2 ring-blue-500' : ''}
                    ${isToday ? 'bg-primary/20 border-primary' : 'border-border'}
                    hover:bg-muted
                  `}
                  onClick={() => setSelectedDate(date)}
                >
                  <div className={`text-center font-medium ${isToday ? 'font-bold text-primary' : ''}`}>
                    {format(date, 'd')}
                  </div>
                  <div className="space-y-1 mt-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="text-xs bg-primary text-primary-foreground rounded px-1.5 py-0.5 truncate"
                        title={event.summary}
                      >
                        {event.summary}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground font-medium">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Date Events */}
        <div className="mt-6 border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">
              Events for {format(selectedDate, 'EEEE, MMMM d')}
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={loadCalendarEvents}
              disabled={loading}
            >
              {loading ? t("loading") : t("refresh")}
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading events...</p>
            </div>
          ) : getEventsForDate(selectedDate).length === 0 ? (
            <div className="text-center py-4 text-neutral-500">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
              <p className="text-sm">{t("noEventsSelected")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {getEventsForDate(selectedDate).map((event) => (
                <div key={event.id} className="border rounded-lg p-3 bg-card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm text-card-foreground">{event.summary}</h5>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {event.start.dateTime ? 
                              `${format(parseISO(event.start.dateTime), 'h:mm a')} - ${format(parseISO(event.end.dateTime!), 'h:mm a')}` :
                              'All day'
                            }
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditEvent(event)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEvent(event.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
