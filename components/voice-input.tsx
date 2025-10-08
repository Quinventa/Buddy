"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Loader2, Volume2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { BuddySettings } from "@/types/buddy"
import { useTranslation } from "@/lib/translations"

interface VoiceInputProps {
  onVoiceInput: (text: string) => void
  isSending: boolean
  voiceSettings: BuddySettings
  onSpeechStart: () => void
  onSpeechEnd: () => void
  language?: "en" | "nl"
  isConversationMode?: boolean
}

export interface VoiceInputRef {
  startListening: () => void
  stopListening: () => void
  isCurrentlyListening: () => boolean
}

export const VoiceInput = React.forwardRef<VoiceInputRef, VoiceInputProps>(
  ({ onVoiceInput, isSending, voiceSettings, onSpeechStart, onSpeechEnd, language = "en", isConversationMode = false }, ref) => {
  const { toast } = useToast()
  const { t } = useTranslation(language)
  const [isListening, setIsListening] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [isStarting, setIsStarting] = React.useState(false)
  const [confidence, setConfidence] = React.useState(0)
  const [audioLevel, setAudioLevel] = React.useState(0)
  const [interimText, setInterimText] = React.useState("")
  const [finalText, setFinalText] = React.useState("")
  const recognitionRef = React.useRef<any | null>(null)
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const finalTranscriptRef = React.useRef("")
  const audioContextRef = React.useRef<AudioContext | null>(null)
  const analyzerRef = React.useRef<AnalyserNode | null>(null)
  const animationFrameRef = React.useRef<number | null>(null)
  const intentionalStopRef = React.useRef(false)
  const restartTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Audio level monitoring (optional, doesn't block speech recognition)
  const startAudioMonitoring = React.useCallback(async () => {
    console.log("🎵 [Audio] Starting audio monitoring...")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log("🎵 [Audio] Got media stream successfully")
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyzerRef.current = audioContextRef.current.createAnalyser()
      
      analyzerRef.current.fftSize = 256
      source.connect(analyzerRef.current)
      console.log("🎵 [Audio] Audio context and analyzer set up successfully")
      
      const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount)
      
      const updateAudioLevel = () => {
        if (analyzerRef.current && !intentionalStopRef.current) {
          analyzerRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setAudioLevel(Math.min(100, (average / 255) * 100))
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
        } else {
          console.log("🎵 [Audio] Stopping audio level updates (intentionalStop:", intentionalStopRef.current, ")")
        }
      }
      
      updateAudioLevel()
      console.log("🎵 [Audio] Audio monitoring started successfully")
    } catch (error) {
      console.warn("🎵 [Audio] Audio monitoring setup failed (optional feature):", error)
      // Don't throw error, just continue without audio monitoring
    }
  }, []) // Remove isListening dependency to prevent recreation

  const stopAudioMonitoring = React.useCallback(() => {
    console.log("🎵 [Audio] Stopping audio monitoring...")
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
      console.log("🎵 [Audio] Animation frame canceled")
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
      console.log("🎵 [Audio] Audio context closed")
    }
    setAudioLevel(0)
    console.log("🎵 [Audio] Audio monitoring stopped successfully")
  }, [])

  const stopListening = React.useCallback(() => {
    console.log("🛑 [Stop] Starting stopListening function...")
    console.log("🛑 [Stop] Called from:", new Error().stack)
    console.log("🛑 [Stop] Setting intentionalStopRef to true")
    intentionalStopRef.current = true

    if (restartTimeoutRef.current) {
      console.log("🛑 [Stop] Clearing restart timeout")
      clearTimeout(restartTimeoutRef.current)
      restartTimeoutRef.current = null
    }

    if (recognitionRef.current) {
      try {
        console.log("🛑 [Stop] Stopping speech recognition...")
        recognitionRef.current.stop()
        console.log("🛑 [Stop] Speech recognition.stop() called successfully")
      } catch (error) {
        console.error("🛑 [Stop] Error stopping recognition:", error)
      }
    } else {
      console.log("🛑 [Stop] No recognition instance to stop")
    }

    if (timeoutRef.current) {
      console.log("🛑 [Stop] Clearing auto-stop timeout")
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    console.log("🛑 [Stop] Calling stopAudioMonitoring...")
    // Inline audio monitoring stop instead of callback
    console.log("🎵 [Audio] Stopping audio monitoring...")
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
      console.log("🎵 [Audio] Animation frame canceled")
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
      console.log("🎵 [Audio] Audio context closed")
    }
    setAudioLevel(0)
    console.log("🎵 [Audio] Audio monitoring stopped successfully")
    
    console.log("🛑 [Stop] Setting all states to stopped...")
    setIsListening(false)
    setIsProcessing(false)
    setIsStarting(false)
    setConfidence(0)
    setInterimText("")
    setFinalText("")
    
    console.log("🛑 [Stop] Calling onSpeechEnd callback...")
    onSpeechEnd()
    console.log("🛑 [Stop] stopListening function completed")
  }, [onSpeechEnd])

  const startListening = React.useCallback(() => {
    console.log("🎤 [Start] ===== STARTING VOICE INPUT =====")
    console.log("🎤 [Start] Current states - isStarting:", isStarting, "isListening:", isListening)
    
    if (isStarting || isListening) {
      console.log("🎤 [Start] Already starting or listening, ignoring click")
      return
    }
    
    console.log("🎤 [Start] Setting isStarting to true...")
    setIsStarting(true)
    console.log("🎤 [Start] Setting intentionalStopRef to false...")
    intentionalStopRef.current = false
    
    if (!voiceSettings.useVoice) {
      console.log("🎤 [Start] Voice is disabled in settings")
      toast({
        title: t("voiceDisabled"),
        description: t("enableVoiceCommandsFirst"),
        variant: "default",
      })
      setIsStarting(false)
      return
    }

    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      console.log("🎤 [Start] Speech recognition not supported in this browser")
      toast({
        title: t("speechRecognitionNotSupported"),
        description: t("browserSpeechRecognitionDesc"),
        variant: "destructive",
      })
      setIsStarting(false)
      return
    }

    // Check for microphone permissions first
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as any }).then((permissionStatus) => {
        console.log("🎤 [Start] Microphone permission status:", permissionStatus.state)
        if (permissionStatus.state === 'denied') {
          console.log("🎤 [Start] Microphone permission denied")
          toast({
            title: t("microphoneAccessDenied"),
            description: t("allowMicrophoneInBrowser"),
            variant: "destructive",
          })
          setIsStarting(false)
          return
        }
      }).catch(err => console.warn("🎤 [Start] Could not check microphone permissions:", err))
    }

    // Stop any existing recognition before starting new one
    if (recognitionRef.current) {
      try {
        console.log("🎤 [Start] Stopping existing recognition instance...")
        recognitionRef.current.stop()
        recognitionRef.current = null
        console.log("🎤 [Start] Existing recognition stopped and cleared")
      } catch (error) {
        console.warn("🎤 [Start] Error stopping existing recognition:", error)
      }
    }

    try {
      console.log("🎤 [Start] Creating new SpeechRecognition instance...")
      // @ts-ignore - Browser compatibility
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      console.log("🎤 [Start] Configuring recognition settings...")
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "en-US"
      recognition.maxAlternatives = 1

      finalTranscriptRef.current = ""
      console.log("🎤 [Start] Recognition configured, setting up event handlers...")
      
      recognition.onstart = () => {
        console.log("✅ [Event] recognition.onstart - Speech recognition started successfully!")
        console.log("✅ [Event] Setting states: isStarting=false, isListening=true")
        setIsStarting(false)
        setIsListening(true)
        setIsProcessing(false)
        setInterimText("")
        setFinalText("")
        console.log("✅ [Event] Calling onSpeechStart callback...")
        onSpeechStart()
        console.log("✅ [Event] Starting audio monitoring...")
        // Inline audio monitoring start to avoid callback dependency issues
        const startInlineAudioMonitoring = async () => {
          try {
            console.log("🎵 [Audio] Starting audio monitoring...")
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            console.log("🎵 [Audio] Got media stream successfully")
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
            const source = audioContextRef.current.createMediaStreamSource(stream)
            analyzerRef.current = audioContextRef.current.createAnalyser()
            
            analyzerRef.current.fftSize = 256
            source.connect(analyzerRef.current)
            console.log("🎵 [Audio] Audio context and analyzer set up successfully")
            
            const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount)
            
            const updateAudioLevel = () => {
              if (analyzerRef.current && !intentionalStopRef.current) {
                analyzerRef.current.getByteFrequencyData(dataArray)
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length
                setAudioLevel(Math.min(100, (average / 255) * 100))
                animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
              } else {
                console.log("🎵 [Audio] Stopping audio level updates (intentionalStop:", intentionalStopRef.current, ")")
              }
            }
            
            updateAudioLevel()
            console.log("🎵 [Audio] Audio monitoring started successfully")
          } catch (error) {
            console.warn("🎵 [Audio] Audio monitoring setup failed (optional feature):", error)
          }
        }
        startInlineAudioMonitoring()
        console.log("✅ [Event] onstart handler completed")
      }

      recognition.onresult = (event: any) => {
        console.log("📝 [Event] recognition.onresult - Got speech results")
        let interimTranscript = ""
        let finalTranscript = finalTranscriptRef.current

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          const confidence = event.results[i][0].confidence
          console.log(`📝 [Event] Result ${i}: "${transcript}" (final: ${event.results[i].isFinal}, confidence: ${confidence})`)

          if (event.results[i].isFinal) {
            finalTranscript += transcript
            setConfidence(confidence)
            setFinalText(finalTranscript)
            console.log("📝 [Event] Updated final text:", finalTranscript)
          } else {
            interimTranscript += transcript
            setConfidence(confidence)
            setInterimText(interimTranscript)
            console.log("📝 [Event] Updated interim text:", interimTranscript)
          }
        }

        finalTranscriptRef.current = finalTranscript

        // Auto-stop on silence with final result (but give more time)
        if (finalTranscript.trim() && !interimTranscript.trim()) {
          console.log("📝 [Event] Final text detected, setting auto-stop timer (3 seconds)...")
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          timeoutRef.current = setTimeout(() => {
            console.log("📝 [Event] Auto-stopping due to silence after final transcript")
            setIsProcessing(true)
            recognition.stop()
          }, 3000) // Wait 3 seconds of silence instead of 1.5
        } else if (interimTranscript.trim()) {
          // Clear timeout if still speaking
          if (timeoutRef.current) {
            console.log("📝 [Event] Still speaking, clearing auto-stop timer")
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
          }
        }
        console.log("📝 [Event] onresult handler completed")
      }

      recognition.onerror = (event: any) => {
        console.error("❌ [Event] recognition.onerror - Speech recognition error:", event.error, event)
        
        let errorMessage = "Voice recognition failed. Please try again."
        let shouldShowToast = true
        
        switch (event.error) {
          case "no-speech":
            console.log("❌ [Event] Error: No speech detected")
            errorMessage = "No speech detected. Please speak clearly and try again."
            shouldShowToast = false // Don't show toast for no-speech, it's expected
            break
          case "audio-capture":
            console.log("❌ [Event] Error: Audio capture failed")
            errorMessage = "Microphone access denied. Please check your microphone permissions."
            break
          case "not-allowed":
            console.log("❌ [Event] Error: Microphone not allowed")
            errorMessage = "Microphone access not allowed. Please enable microphone permissions."
            break
          case "network":
            console.log("❌ [Event] Error: Network error")
            errorMessage = "Network error. Please check your internet connection."
            break
          case "aborted":
            console.log("❌ [Event] Error: Recognition aborted (likely user stopped it)")
            shouldShowToast = false
            break
        }

        if (shouldShowToast) {
          console.log("❌ [Event] Showing error toast:", errorMessage)
          toast({
            title: t("speechRecognitionError"),
            description: errorMessage,
            variant: "destructive",
          })
        }

        console.log("❌ [Event] Setting isStarting to false and calling stopListening...")
        setIsStarting(false)
        stopListening()
        console.log("❌ [Event] onerror handler completed")
      }

      recognition.onend = () => {
        console.log("🏁 [Event] recognition.onend - Speech recognition ended")
        console.log("🏁 [Event] Intentional stop:", intentionalStopRef.current, "Is listening:", isListening)
        
        if (!intentionalStopRef.current && isListening) {
          console.log("🔄 [Event] Speech recognition ended unexpectedly, attempting restart...")
          // Try to restart after a short delay
          restartTimeoutRef.current = setTimeout(() => {
            console.log("🔄 [Event] Restart timeout triggered - intentional:", intentionalStopRef.current, "useVoice:", voiceSettings.useVoice)
            if (!intentionalStopRef.current && voiceSettings.useVoice) {
              console.log("🔄 [Event] Restarting speech recognition...")
              try {
                recognition.start()
                console.log("🔄 [Event] Recognition restart initiated successfully")
              } catch (error) {
                console.error("🔄 [Event] Failed to restart recognition:", error)
                stopListening()
              }
            } else {
              console.log("🔄 [Event] Not restarting - conditions not met")
            }
          }, 100)
          return
        }
        
        console.log("🏁 [Event] Processing final results...")
        const finalText = finalTranscriptRef.current.trim()
        if (finalText) {
          console.log("🏁 [Event] Final transcript:", finalText)
          onVoiceInput(finalText)
          
          toast({
            title: "Voice Message Captured",
            description: `"${finalText.length > 50 ? finalText.substring(0, 50) + "..." : finalText}"`,
            variant: "default",
          })
          console.log("🏁 [Event] Voice input processed and toast shown")
        } else {
          console.log("🏁 [Event] No final text to process")
        }

        console.log("🏁 [Event] Setting final states...")
        setIsListening(false)
        setIsProcessing(false)
        setConfidence(0)
        setInterimText("")
        setFinalText("")
        console.log("🏁 [Event] Calling onSpeechEnd...")
        onSpeechEnd()
        console.log("🏁 [Event] onend handler completed")
      }

      recognitionRef.current = recognition
      console.log("🎤 [Start] Recognition instance stored in ref")
      console.log("🎤 [Start] Starting speech recognition with 50ms delay...")
      
      // Small delay to ensure proper initialization
      setTimeout(() => {
        console.log("🎤 [Start] Delay completed, checking conditions...")
        console.log("🎤 [Start] Recognition exists:", !!recognition, "Not intentionally stopped:", !intentionalStopRef.current)
        if (recognition && !intentionalStopRef.current) {
          try {
            console.log("🎤 [Start] Calling recognition.start()...")
            recognition.start()
            console.log("🎤 [Start] recognition.start() called successfully")
          } catch (error) {
            console.error("🎤 [Start] Error starting recognition after delay:", error)
            setIsStarting(false)
            stopListening()
          }
        } else {
          console.log("🎤 [Start] Conditions not met for starting recognition")
        }
      }, 50)

    } catch (error) {
      console.error("🎤 [Start] Failed to start speech recognition:", error)
      toast({
        title: "Voice Input Error",
        description: "Could not start voice input. Please check your microphone settings.",
        variant: "destructive",
      })
      setIsStarting(false)
      stopListening()
    }
    console.log("🎤 [Start] startListening function completed")
  }, [voiceSettings.useVoice, onVoiceInput, onSpeechStart, toast, t, stopListening]) // Add missing dependencies

  // Expose methods to parent component via ref (must be after startListening/stopListening are defined)
  React.useImperativeHandle(ref, () => ({
    startListening: () => {
      console.log("📞 [Ref] startListening called via ref")
      if (!isListening && !isProcessing && !isStarting) {
        startListening()
      } else {
        console.log("📞 [Ref] Cannot start - isListening:", isListening, "isProcessing:", isProcessing, "isStarting:", isStarting)
      }
    },
    stopListening: () => {
      console.log("📞 [Ref] stopListening called via ref")
      if (isListening) {
        stopListening()
      } else {
        console.log("📞 [Ref] Cannot stop - not currently listening")
      }
    },
    isCurrentlyListening: () => isListening
  }), [isListening, isProcessing, isStarting, startListening, stopListening])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      console.log("🧹 [Cleanup] Component cleanup - clearing timeouts and stopping recognition")
      if (restartTimeoutRef.current) {
        console.log("🧹 [Cleanup] Clearing restart timeout")
        clearTimeout(restartTimeoutRef.current)
        restartTimeoutRef.current = null
      }
      
      intentionalStopRef.current = true
      
      if (recognitionRef.current) {
        try {
          console.log("🧹 [Cleanup] Stopping recognition directly")
          recognitionRef.current.stop()
          recognitionRef.current = null
        } catch (error) {
          console.warn("🧹 [Cleanup] Error stopping recognition:", error)
        }
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      
      console.log("🧹 [Cleanup] Component cleanup completed")
    }
  }, []) // Keep empty array to only run on unmount

  const handleClick = () => {
    console.log("🖱️ [Click] Voice button clicked - isListening:", isListening, "isProcessing:", isProcessing, "isStarting:", isStarting)
    if (isListening || isProcessing) {
      console.log("🖱️ [Click] Stopping voice input...")
      stopListening()
    } else if (!isStarting) {
      console.log("🖱️ [Click] Starting voice input...")
      startListening()
    } else {
      console.log("🖱️ [Click] Voice input is starting, ignoring click")
    }
  }

  const getButtonVariant = () => {
    if (isListening) return "destructive" // Red when listening
    if (isProcessing || isStarting) return "secondary" 
    return "outline"
  }

  const getButtonIcon = () => {
    if (isProcessing) return <Loader2 className="h-5 w-5 animate-spin" />
    if (isStarting) return <Loader2 className="h-4 w-4 animate-spin" />
    if (isListening) return <MicOff className="h-5 w-5" />
    return <Mic className="h-5 w-5" />
  }

  const getButtonText = () => {
    if (isProcessing) return t("voiceProcessing")
    if (isStarting) return t("voiceStarting")
    if (isListening) return t("stopListening")
    return t("startVoice")
  }

  // Generate ripple effects based on audio level
  const generateRipples = () => {
    if (!isListening || audioLevel === 0) return null
    
    const rippleCount = Math.floor(audioLevel / 20) + 1
    return Array.from({ length: Math.min(rippleCount, 4) }, (_, i) => (
      <div
        key={i}
        className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping"
        style={{
          animationDelay: `${i * 0.2}s`,
          animationDuration: '1s',
          transform: `scale(${1 + (i * 0.3)})`
        }}
      />
    ))
  }

  return (
    <div className="relative flex flex-col items-center space-y-2">
      {/* Voice Input Button with Effects */}
      <div className="relative">
        <Button
          variant={getButtonVariant()}
          size="lg"
          onClick={handleClick}
          disabled={isSending || !voiceSettings.useVoice || isStarting || (isConversationMode && isListening)}
          className={`relative transition-all duration-300 shadow-lg ${
            isListening 
              ? "bg-red-500 hover:bg-red-600 text-white scale-110 shadow-red-500/50" 
              : (isProcessing || isStarting)
                ? "bg-blue-500 hover:bg-blue-600 text-white" 
                : isConversationMode
                  ? "opacity-0 pointer-events-none"
                  : "hover:scale-105"
          } ${
            !voiceSettings.useVoice ? "opacity-50 cursor-not-allowed" : ""
          }`}
          title={
            isConversationMode 
              ? "Voice input managed by conversation mode"
              : voiceSettings.useVoice 
                ? getButtonText() 
                : "Enable voice in settings"
          }
        >
          {getButtonIcon()}
          <span className="ml-2 hidden sm:inline font-medium">{getButtonText()}</span>
        </Button>
        
        {/* Audio-reactive ripple effects */}
        {generateRipples()}
        
        {/* Audio level indicator */}
        {isListening && audioLevel > 0 && (
          <div 
            className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-400 shadow-lg"
            style={{
              opacity: Math.min(1, audioLevel / 50),
              transform: `scale(${1 + (audioLevel / 100)})`
            }}
          />
        )}
        
        {/* Processing or starting indicator */}
        {(isProcessing || isStarting) && (
          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-400 animate-pulse shadow-lg" />
        )}
      </div>

      {/* Real-time Speech Display - Positioned Below Button */}
      {(isListening || isProcessing || isStarting) && (
        <div className="absolute top-full mt-2 w-full max-w-md z-50">
          <div className="bg-black/70 backdrop-blur-md rounded-lg p-4 border border-gray-700/50 shadow-2xl">
            <div className="flex items-center space-x-2 mb-2">
              <Volume2 className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">
                {isStarting ? "Starting..." : isListening ? "Listening..." : "Processing..."}
              </span>
              {confidence > 0 && (
                <span className="text-xs text-gray-400">
                  ({Math.round(confidence * 100)}% confident)
                </span>
              )}
            </div>
            
            {/* Audio level visualization */}
            {isListening && (
              <div className="mb-3">
                <div className="flex space-x-1 items-end h-6">
                  {Array.from({ length: 20 }, (_, i) => (
                    <div
                      key={i}
                      className="bg-gradient-to-t from-green-600 to-green-400 w-1 rounded-full transition-all duration-100"
                      style={{
                        height: `${Math.max(2, (audioLevel / 100) * 24 + Math.random() * 8)}px`,
                        opacity: audioLevel > (i * 5) ? 1 : 0.2
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Speech text display */}
            <div className="min-h-[3rem] text-white">
              {finalText && (
                <div className="text-white mb-1">
                  <span className="font-medium">{t("finalLabel")}</span>
                  <span>{finalText}</span>
                </div>
              )}
              {interimText && (
                <div className="text-gray-400 italic">
                  <span className="font-medium">{t("speakingLabel")}</span>
                  <span>{interimText}</span>
                </div>
              )}
              {!finalText && !interimText && (isListening || isStarting) && (
                <div className="text-gray-500 text-center animate-pulse">
                  {isStarting ? t("gettingReadyToListen") : t("waitingForSpeech")}
                </div>
              )}
              {isProcessing && (
                <div className="text-blue-400 text-center animate-pulse">
                  {t("processingYourMessage")}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
