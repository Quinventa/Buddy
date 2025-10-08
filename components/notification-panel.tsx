"use client"
import * as React from "react"
import { Bell, X, Calendar, Clock, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useTranslation } from "@/lib/translations"
import { format, parseISO } from "date-fns"
import { FontSize } from "@/types/buddy"
import { getMainFontSize, getHeadingFontSize, getDescriptionFontSize } from "@/lib/font-utils"

export interface Notification {
  id: string
  type: 'calendar-reminder' | 'general'
  title: string
  message: string
  eventName?: string
  eventTime?: string
  timeUntil?: string
  reminderId?: string // Database ID for calendar reminders
  timestamp: Date
  isRead: boolean
}

interface NotificationPanelProps {
  language: "en" | "nl"
  fontSize: FontSize
  notifications: Notification[]
  onNotificationSpoken?: (notification: Notification) => void
  onAddNotification?: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => string
  onRemoveNotification?: (id: string) => void
  onClearAll?: () => void
  onMarkAsRead?: (id: string) => void
}

export function NotificationPanel({ 
  language, 
  fontSize,
  notifications, 
  onNotificationSpoken,
  onAddNotification,
  onRemoveNotification,
  onClearAll,
  onMarkAsRead
}: NotificationPanelProps) {
  const { t } = useTranslation(language)
  const [isOpen, setIsOpen] = React.useState(false)

  // Add a new notification
  const addNotification = React.useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      isRead: false
    }
    
    onAddNotification?.(notification)
    
    // Trigger speech if callback provided
    onNotificationSpoken?.(newNotification)
    
    return newNotification.id
  }, [onAddNotification, onNotificationSpoken])

  // Remove a notification
  const removeNotification = React.useCallback((id: string) => {
    onRemoveNotification?.(id)
  }, [onRemoveNotification])

  // Mark notification as read
  const markAsRead = React.useCallback((id: string) => {
    onMarkAsRead?.(id)
  }, [onMarkAsRead])

  // Clear all notifications
  const clearAll = React.useCallback(() => {
    onClearAll?.()
  }, [onClearAll])

  // Get unread count
  const unreadCount = notifications.filter(n => !n.isRead).length

  // Handle clicking on notification
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="start">
        <div className="border-b p-3">
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold ${getHeadingFontSize(fontSize)}`}>Notifications</h3>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className={`h-6 px-2 ${getDescriptionFontSize(fontSize)}`}
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className={`p-4 text-center text-neutral-500 ${getMainFontSize(fontSize)}`}>
              <Bell className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted transition-colors ${
                    !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {notification.type === 'calendar-reminder' && (
                          <Calendar className="h-3 w-3 text-blue-600" />
                        )}
                        <span className={`font-medium text-neutral-900 ${getMainFontSize(fontSize)}`}>
                          {notification.title}
                        </span>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                      
                      <p className={`text-neutral-600 mb-1 ${getDescriptionFontSize(fontSize)}`}>
                        {notification.message}
                      </p>
                      
                      {notification.eventName && (
                        <div className={`flex items-center gap-1 text-neutral-500 ${getDescriptionFontSize(fontSize)}`}>
                          <span className="font-medium">{notification.eventName}</span>
                          {notification.eventTime && (
                            <>
                              <span>•</span>
                              <Clock className="h-3 w-3" />
                              <span>{notification.eventTime}</span>
                            </>
                          )}
                        </div>
                      )}
                      
                      <div className="text-xs text-neutral-400 mt-1">
                        {format(notification.timestamp, 'MMM d, h:mm a')}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeNotification(notification.id)
                      }}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Helper function to create calendar reminder notifications
export function createCalendarReminderNotification(
  eventName: string, 
  eventTime: string, 
  timeUntil: string,
  reminderId?: string
): Omit<Notification, 'id' | 'timestamp' | 'isRead'> {
  return {
    type: 'calendar-reminder',
    title: 'Calendar Reminder',
    message: `You have "${eventName}" in ${timeUntil}`,
    eventName,
    eventTime,
    timeUntil,
    reminderId // Add the database reminder ID
  }
}