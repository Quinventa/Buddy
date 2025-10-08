"use client"

import * as React from "react"
import { Clock as ClockIcon } from "lucide-react"

interface ClockProps {
  timezone: string
  className?: string
}

export function Clock({ timezone, className = "" }: ClockProps) {
  const [time, setTime] = React.useState<Date>(new Date())

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = () => {
    try {
      return time.toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    } catch (error) {
      // Fallback to local time if timezone is invalid
      return time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    }
  }

  const formatDate = () => {
    try {
      return time.toLocaleDateString('en-US', {
        timeZone: timezone,
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      return time.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 backdrop-blur-sm ${className}`}>
      <ClockIcon className="h-4 w-4 text-muted-foreground" />
      <div className="flex flex-col">
        <span className="text-sm font-semibold leading-none">{formatTime()}</span>
        <span className="text-xs text-muted-foreground leading-none mt-1">{formatDate()}</span>
      </div>
    </div>
  )
}
