"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Loader2, Volume2, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useGPTRealtime } from "@/hooks/use-gpt-realtime"
import type { BuddySettings } from "@/types/buddy"
import { useTranslation } from "@/lib/translations"

interface RealtimeVoiceProps {
  onMessage: (message: string) => void
  isSending: boolean
  settings: BuddySettings
  onSpeechStart: () => void
  onSpeechEnd: () => void
  onFallbackToTraditional?: () => void
  language?: "en" | "nl"
}

export function RealtimeVoice({ 
  onMessage, 
  isSending, 
  settings, 
  onSpeechStart, 
  onSpeechEnd,
  onFallbackToTraditional,
  language = "en" 
}: RealtimeVoiceProps) {
  const { toast } = useToast()
  const { t } = useTranslation(language)
  const [isActive, setIsActive] = React.useState(false)
  const [audioLevel, setAudioLevel] = React.useState(0)
  const audioContextRef = React.useRef<AudioContext | null>(null)
  const audioQueueRef = React.useRef<ArrayBuffer[]>([])
  const isPlayingRef = React.useRef(false)
  
  const {
    isConnected,
    isConnecting,
    connectToRealtime,
    startRecording,
    stopRecording,
    disconnect
  } = useGPTRealtime({
    settings,
    onMessage: (message) => {
      console.log('📝 Received text:', message)
      onMessage(message)
    },
    onAudioResponse: (audioData) => {
      console.log('🔊 Received audio chunk:', audioData.byteLength, 'bytes')
      playAudioChunk(audioData)
    },
    onError: (error) => {
      console.error('❌ Realtime error:', error)
      toast({
        title: "Voice Error",
        description: error.message,
        variant: "destructive"
      })
      setIsActive(false)
      onSpeechEnd()
    }
  })

  // Initialize audio context for playback
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const playAudioChunk = React.useCallback(async (audioData: ArrayBuffer) => {
    if (!audioContextRef.current) return

    try {
      // Add to queue
      audioQueueRef.current.push(audioData)
      
      // Start playing if not already playing
      if (!isPlayingRef.current) {
        await playNextChunk()
      }
    } catch (error) {
      console.error('Error playing audio chunk:', error)
    }
  }, [])

  const playNextChunk = React.useCallback(async () => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false
      return
    }

    isPlayingRef.current = true
    const audioData = audioQueueRef.current.shift()!
    
    try {
      // Convert PCM16 to AudioBuffer
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData.slice(0))
      const source = audioContextRef.current.createBufferSource()
      
      source.buffer = audioBuffer
      source.connect(audioContextRef.current.destination)
      
      source.onended = () => {
        // Play next chunk when this one ends
        playNextChunk()
      }
      
      source.start()
      
    } catch (error) {
      console.error('Error decoding/playing audio:', error)
      // Continue with next chunk even if this one fails
      playNextChunk()
    }
  }, [])

  const handleToggleRealtime = React.useCallback(async () => {
    if (isSending) return

    if (!isActive) {
      // Start realtime conversation
      try {
        if (!isConnected) {
          await connectToRealtime()
        }
        
        await startRecording()
        setIsActive(true)
        onSpeechStart()
        
        toast({
          title: t("realtimeStarted"),
          description: t("realtimeStartedDesc"),
        })
      } catch (error) {
        console.error('Error starting realtime:', error)
        
        // Fall back to traditional voice input if realtime fails
        toast({
          title: "Realtime Unavailable",
          description: "Falling back to traditional voice input",
          variant: "default"
        })
        
        // Trigger the fallback if available
        if (onFallbackToTraditional) {
          onFallbackToTraditional()
        }
        return
      }
    } else {
      // Stop realtime conversation
      stopRecording()
      setIsActive(false)
      onSpeechEnd()
      
      toast({
        title: t("realtimeStopped"),
        description: t("realtimeStoppedDesc"),
      })
    }
  }, [
    isActive,
    isSending,
    isConnected,
    connectToRealtime,
    startRecording,
    stopRecording,
    onSpeechStart,
    onSpeechEnd,
    t
  ])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  const buttonVariant = isActive ? "destructive" : "default"
  const buttonIcon = isConnecting ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : isActive ? (
    <MicOff className="h-4 w-4" />
  ) : (
    <Zap className="h-4 w-4" />
  )

  return (
    <div className="relative">
      <Button
        variant={buttonVariant}
        size="sm"
        onClick={handleToggleRealtime}
        disabled={isSending || isConnecting}
        className="relative overflow-hidden"
        title={isActive ? t("stopRealtime") : t("startRealtime")}
      >
        {buttonIcon}
        {isActive && (
          <span className="ml-2 text-xs">
            {t("realtimeActive")}
          </span>
        )}
        
        {/* Audio level indicator */}
        {isActive && audioLevel > 0 && (
          <div 
            className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-100"
            style={{ width: `${audioLevel}%` }}
          />
        )}
      </Button>
      
      {/* Connection status indicator */}
      <div className="absolute -top-1 -right-1">
        {isConnected && (
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        )}
        {isConnecting && (
          <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
        )}
      </div>
    </div>
  )
}