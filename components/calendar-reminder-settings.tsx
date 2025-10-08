"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Clock, Bell, BellOff, Calendar, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/lib/translations"
import { loadCalendarReminderPreferences, saveCalendarReminderPreferences } from "@/lib/database"
import { getReminderTimeOptions, formatReminderTime } from "@/types/calendar-reminders"
import type { CalendarReminderPreferences } from "@/types/calendar-reminders"

interface CalendarReminderSettingsProps {
  // No props needed - uses translation hook internally
}

export function CalendarReminderSettings(): React.ReactElement {
  const { toast } = useToast()
  const { t } = useTranslation()
  const [preferences, setPreferences] = React.useState<CalendarReminderPreferences | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  const reminderTimeOptions = getReminderTimeOptions()

  // Load preferences on component mount
  React.useEffect(() => {
    const loadPreferences = async () => {
      console.log('[CalendarReminderSettings] Starting to load preferences...')
      setLoading(true)
      
      try {
        // Shorter timeout and direct call without race condition
        const data = await loadCalendarReminderPreferences()
        console.log('[CalendarReminderSettings] Loaded preferences:', data)
        
        if (data) {
          setPreferences(data)
        } else {
          console.log('[CalendarReminderSettings] No data returned, setting default preferences')
          // Set some default preferences if none are found
          const defaultPrefs: CalendarReminderPreferences = {
            id: '',
            user_id: '',
            default_reminder_minutes: 30,
            reminders_enabled: true,
            show_notification: true,
            speak_reminder: false,
            remind_for_all_day_events: false,
            all_day_event_reminder_time: "09:00",
            available_reminder_times: [5, 10, 15, 30, 60],
            created_at: '',
            updated_at: ''
          }
          setPreferences(defaultPrefs)
        }
      } catch (error) {
        console.error('[CalendarReminderSettings] Error loading preferences:', error)
        
        // Always set default preferences on any error
        const defaultPrefs: CalendarReminderPreferences = {
          id: '',
          user_id: '',
          default_reminder_minutes: 15,
          reminders_enabled: true,
          show_notification: true,
          speak_reminder: false,
          remind_for_all_day_events: false,
          all_day_event_reminder_time: "09:00",
          available_reminder_times: [5, 10, 15, 30, 60],
          created_at: '',
          updated_at: ''
        }
        setPreferences(defaultPrefs)
        
        // Show error toast but don't block UI
        toast({
          title: "Connection Issue",
          description: "Using default calendar settings. Settings may not save properly.",
          variant: "destructive"
        })
      } finally {
        console.log('[CalendarReminderSettings] Finished loading, setting loading to false')
        setLoading(false)
      }
    }

    loadPreferences()
  }, [toast])

  const handleSave = async () => {
    if (!preferences) return

    setSaving(true)
    try {
      const success = await saveCalendarReminderPreferences(preferences)
      if (success) {
        toast({
          title: "Settings Saved",
          description: "Your calendar reminder preferences have been updated",
        })
      } else {
        throw new Error("Failed to save preferences")
      }
    } catch (error) {
      console.error('Error saving calendar reminder preferences:', error)
      toast({
        title: "Error",
        description: "Failed to save calendar reminder settings",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const updatePreference = (key: keyof CalendarReminderPreferences, value: any) => {
    if (!preferences) return
    
    setPreferences(prev => prev ? {
      ...prev,
      [key]: value
    } : null)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t("calendarReminders")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            {t("calendarReminders")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("failedToLoadReminderSettings")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t("calendarReminders")}
        </CardTitle>
        <CardDescription>
          {t("calendarRemindersDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Reminders */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">{t("enableCalendarReminders")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("enableRemindersDesc")}
            </p>
          </div>
          <Switch
            checked={preferences.reminders_enabled}
            onCheckedChange={(checked) => updatePreference('reminders_enabled', checked)}
          />
        </div>

        {preferences.reminders_enabled && (
          <>
            {/* Default Reminder Time */}
            <div className="space-y-2">
              <Label className="text-base">{t("defaultReminderTime")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("defaultReminderTimeDesc")}
              </p>
              <Select
                value={preferences.default_reminder_minutes.toString()}
                onValueChange={(value) => updatePreference('default_reminder_minutes', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reminderTimeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {t(option.value === 1 ? "oneMinute" : 
                         option.value === 5 ? "fiveMinutes" :
                         option.value === 15 ? "fifteenMinutes" :
                         option.value === 30 ? "thirtyMinutes" :
                         option.value === 45 ? "fortyFiveMinutes" :
                         option.value === 60 ? "oneHour" :
                         option.value === 120 ? "twoHours" :
                         option.value === 240 ? "fourHours" :
                         option.value === 480 ? "eightHours" :
                         option.value === 1440 ? "oneDay" : "unknown")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notification Methods */}
            <div className="space-y-4">
              <Label className="text-base">{t("notificationMethods")}</Label>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">{t("showVisualNotifications")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("displayRemindersOnScreen")}
                  </p>
                </div>
                <Switch
                  checked={preferences.show_notification}
                  onCheckedChange={(checked) => updatePreference('show_notification', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">{t("speakReminders")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("haveBuddySpeakReminders")}
                  </p>
                </div>
                <Switch
                  checked={preferences.speak_reminder}
                  onCheckedChange={(checked) => updatePreference('speak_reminder', checked)}
                />
              </div>
            </div>

            {/* All-Day Events */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">{t("allDayEventReminders")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("allDayEventRemindersDesc")}
                  </p>
                </div>
                <Switch
                  checked={preferences.remind_for_all_day_events}
                  onCheckedChange={(checked) => updatePreference('remind_for_all_day_events', checked)}
                />
              </div>

              {preferences.remind_for_all_day_events && (
                <div className="space-y-2">
                  <Label className="text-sm">{t("reminderTimeForAllDay")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("reminderTimeForAllDayDesc")}
                  </p>
                  <Input
                    type="time"
                    value={preferences.all_day_event_reminder_time}
                    onChange={(e) => updatePreference('all_day_event_reminder_time', e.target.value)}
                    className="w-32"
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t("saving")}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t("saveSettings")}
              </>
            )}
          </Button>
        </div>

        {/* Current Settings Summary */}
        {preferences.reminders_enabled && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t("currentSettingsSummary")}
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• {t("defaultReminder")}: {formatReminderTime(preferences.default_reminder_minutes)} {t("beforeEvents")}</li>
              <li>• {t("visualNotifications")}: {preferences.show_notification ? t("enabled") : t("disabled")}</li>
              <li>• {t("spokenReminders")}: {preferences.speak_reminder ? t("enabled") : t("disabled")}</li>
              <li>• {t("allDayEvents")}: {preferences.remind_for_all_day_events ? `${t("enabled")} (${preferences.all_day_event_reminder_time})` : t("disabled")}</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}