"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Play, Square, Volume2 } from "lucide-react"
import type { BuddySettings } from "@/types/buddy"
import { getCategorizedVoices, type VoiceOption } from "@/lib/voice-utils"
import { useTranslation } from "@/lib/translations"

interface VoiceSettingsProps {
  settings: BuddySettings
  onSettingsChange: (newSettings: Partial<BuddySettings>) => void
  language?: "en" | "nl"
}

export function VoiceSettings({ settings, onSettingsChange, language = "en" }: VoiceSettingsProps) {
  const { toast } = useToast()
  const { t } = useTranslation(language)
  const [availableMics, setAvailableMics] = React.useState<MediaDeviceInfo[]>([])
  const [availableVoices, setAvailableVoices] = React.useState<SpeechSynthesisVoice[]>([])
  const [categorizedVoices, setCategorizedVoices] = React.useState<{
    recommended: VoiceOption[]
    premium: VoiceOption[]
    standard: VoiceOption[]
    basic: VoiceOption[]
  }>({ recommended: [], premium: [], standard: [], basic: [] })
  const [isPreviewPlaying, setIsPreviewPlaying] = React.useState(false)
  const [previewVoice, setPreviewVoice] = React.useState<string>("")

  const previewText = t("voicePreviewText")
  // Fetch available microphones
  React.useEffect(() => {
    const getMics = async () => {
      try {
        // Request microphone permission to populate device list
        await navigator.mediaDevices.getUserMedia({ audio: true })
        const devices = await navigator.mediaDevices.enumerateDevices()
        setAvailableMics(devices.filter((d) => d.kind === "audioinput"))
      } catch (error) {
        console.error("Error enumerating audio devices:", error)
        toast({
          title: t("microphoneAccess"),
          description: t("allowMicrophoneAccess"),
          variant: "default",
        })
      }
    }
    void getMics()

    // Listen for device changes
    navigator.mediaDevices.addEventListener("devicechange", getMics)
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", getMics)
    }
  }, [toast])

  // Fetch and categorize available TTS voices
  React.useEffect(() => {
    const getVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      setAvailableVoices(voices)
      
      // Categorize voices
      const categorized = getCategorizedVoices(voices)
      setCategorizedVoices(categorized)
      
      // Auto-select best voice if none selected
      if (!settings.buddyVoiceURI && voices.length > 0) {
        const bestVoice = categorized.recommended[0]?.voice || 
                         categorized.premium[0]?.voice || 
                         categorized.standard[0]?.voice ||
                         voices.find(v => v.lang.startsWith('en')) ||
                         voices[0]
        
        if (bestVoice) {
          onSettingsChange({ buddyVoiceURI: bestVoice.voiceURI })
        }
      }
    }

    // Ensure onvoiceschanged is set up correctly
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = getVoices
    }
    getVoices() // Call initially to populate voices

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [settings.buddyVoiceURI, onSettingsChange])

  // Voice preview function
  const playVoicePreview = async (voiceURI: string) => {
    if (isPreviewPlaying) {
      window.speechSynthesis.cancel()
      setIsPreviewPlaying(false)
      setPreviewVoice("")
      return
    }

    try {
      const voice = availableVoices.find(v => v.voiceURI === voiceURI)
      if (!voice) return

      setIsPreviewPlaying(true)
      setPreviewVoice(voiceURI)

      const utterance = new SpeechSynthesisUtterance(previewText)
      utterance.voice = voice
      utterance.rate = settings.speechRate
      utterance.pitch = settings.speechPitch
      
      utterance.onend = () => {
        setIsPreviewPlaying(false)
        setPreviewVoice("")
      }
      
      utterance.onerror = () => {
        setIsPreviewPlaying(false)
        setPreviewVoice("")
        toast({
          title: t("previewError"),
          description: t("couldNotPreviewVoice"),
          variant: "destructive",
        })
      }

      window.speechSynthesis.speak(utterance)
    } catch (error) {
      setIsPreviewPlaying(false)
      setPreviewVoice("")
      console.error("Voice preview error:", error)
    }
  }

  // Stop any playing preview when component unmounts
  React.useEffect(() => {
    return () => {
      if (isPreviewPlaying) {
        window.speechSynthesis.cancel()
      }
    }
  }, [isPreviewPlaying])

  // Render voice option with preview button
  const renderVoiceOption = (voiceOption: VoiceOption, showQualityBadge = true) => {
    const { voice, quality, isRecommended } = voiceOption
    const isCurrentVoice = voice.voiceURI === settings.buddyVoiceURI
    const isPlayingThis = previewVoice === voice.voiceURI && isPreviewPlaying

    return (
      <div key={voice.voiceURI} className={`flex items-center justify-between p-3 rounded-lg border ${isCurrentVoice ? 'border-primary bg-primary/10' : 'border-border'}`}>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{voice.name}</span>
            {isRecommended && <Badge variant="secondary" className="text-xs">{t("recommended")}</Badge>}
            {showQualityBadge && (
              <Badge 
                variant={quality === 'premium' ? 'default' : quality === 'standard' ? 'secondary' : 'outline'} 
                className="text-xs"
              >
                {quality}
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {voice.lang} • {voice.localService ? 'Local' : 'Remote'}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => playVoicePreview(voice.voiceURI)}
            className="h-8 w-8 p-0"
          >
            {isPlayingThis ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
          
          <Button
            variant={isCurrentVoice ? "default" : "outline"}
            size="sm"
            onClick={() => onSettingsChange({ buddyVoiceURI: voice.voiceURI })}
          >
            {isCurrentVoice ? t("selected") : t("select")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="useVoice">{t("enableVoiceCommands")}</Label>
          <p className="text-xs text-muted-foreground">{t("enableVoiceDesc")}</p>
        </div>
        <Switch id="useVoice" checked={settings.useVoice} onCheckedChange={(v) => onSettingsChange({ useVoice: v })} />
      </div>

      {settings.useVoice && (
        <>
          <div className="space-y-2">
            <Label htmlFor="voiceMode">{t("voiceMode")}</Label>
            <p className="text-xs text-muted-foreground">{t("voiceModeDesc")}</p>
            <Select
              value={settings.voiceMode}
              onValueChange={(v) => onSettingsChange({ voiceMode: v as "traditional" | "realtime" })}
            >
              <SelectTrigger id="voiceMode">
                <SelectValue placeholder={t("chooseVoiceMode")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t("voiceMode")}</SelectLabel>
                  <SelectItem value="traditional">{t("traditionalVoice")}</SelectItem>
                  <SelectItem value="realtime">{t("realtimeVoice")}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="micInput">{t("microphoneInput")}</Label>
            <Select
              value={settings.micDeviceId}
              onValueChange={(v) => onSettingsChange({ micDeviceId: v })}
              disabled={availableMics.length === 0}
            >
              <SelectTrigger id="micInput">
                <SelectValue placeholder={t("selectMicrophone")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t("microphones")}</SelectLabel>
                  {availableMics.length === 0 ? (
                    <SelectItem value="no-mics" disabled>
                      {t("noMicrophonesFound")}
                    </SelectItem>
                  ) : (
                    availableMics.map((mic) => (
                      <SelectItem key={mic.deviceId} value={mic.deviceId}>
                        {mic.label || `Microphone ${mic.deviceId.substring(0, 8)}...`}
                      </SelectItem>
                    ))
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>{t("buddyVoice")}</Label>
              {isPreviewPlaying && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => playVoicePreview("")}
                  className="text-red-600"
                >
                  <Square className="h-3 w-3 mr-1" />
                  {t("stopPreview")}
                </Button>
              )}
            </div>
            
            {/* Recommended Voices */}
            {categorizedVoices.recommended.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-green-700 flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  {t("recommendedForElderly")}
                </h4>
                <div className="space-y-2">
                  {categorizedVoices.recommended.map(voiceOption => renderVoiceOption(voiceOption, false))}
                </div>
              </div>
            )}
            
            {/* Premium Voices */}
            {categorizedVoices.premium.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-blue-700">{t("premiumQuality")}</h4>
                <div className="space-y-2">
                  {categorizedVoices.premium.map(voiceOption => renderVoiceOption(voiceOption))}
                </div>
              </div>
            )}
            
            {/* Standard Voices */}
            {categorizedVoices.standard.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-foreground">{t("standardQuality")}</h4>
                <div className="space-y-2">
                  {categorizedVoices.standard.map(voiceOption => renderVoiceOption(voiceOption))}
                </div>
              </div>
            )}
            
            {/* Basic Voices */}
            {categorizedVoices.basic.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">{t("basicQuality")}</h4>
                <div className="space-y-2">
                  {categorizedVoices.basic.map(voiceOption => renderVoiceOption(voiceOption))}
                </div>
              </div>
            )}
            
            {availableVoices.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <Volume2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t("loadingVoices")}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="speechRate">{t("speechRate")}: {settings.speechRate.toFixed(1)}x</Label>
              <Slider
                id="speechRate"
                min={0.5}
                max={2.0}
                step={0.1}
                value={[settings.speechRate]}
                onValueChange={([v]) => onSettingsChange({ speechRate: v })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t("slower")}</span>
                <span>{t("normal")}</span>
                <span>{t("faster")}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="speechPitch">{t("voicePitch")}: {settings.speechPitch.toFixed(1)}</Label>
              <Slider
                id="speechPitch"
                min={0.5}
                max={2.0}
                step={0.1}
                value={[settings.speechPitch]}
                onValueChange={([v]) => onSettingsChange({ speechPitch: v })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t("lower")}</span>
                <span>{t("normal")}</span>
                <span>{t("higher")}</span>
              </div>
            </div>
            
            {/* Lip-Sync Mode */}
            <div className="space-y-2">
              <Label htmlFor="lipSyncMode">Lip-Sync Mode</Label>
              <Select
                value={settings.lipSyncMode || "text"}
                onValueChange={(value: "text" | "voice" | "audio") => onSettingsChange({ lipSyncMode: value })}
              >
                <SelectTrigger id="lipSyncMode">
                  <SelectValue placeholder="Select lip-sync mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="text">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Text-Based (Fast)</span>
                        <span className="text-xs text-muted-foreground">Character-by-character with smart timing</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="audio">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Audio Analysis (Most Accurate)</span>
                        <span className="text-xs text-muted-foreground">Real-time frequency analysis of speech</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="voice">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Voice-Based (Simple)</span>
                        <span className="text-xs text-muted-foreground">Uses speech synthesis boundaries</span>
                      </div>
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {settings.lipSyncMode === "audio"
                  ? "⭐ Analyzes actual audio frequencies for most realistic lip-sync" 
                  : settings.lipSyncMode === "voice" 
                  ? "Uses speech timing events (may be slower)" 
                  : "Fast character animation with smart pauses (recommended)"}
              </p>
            </div>
          </div>

          {/* Voice Test */}
          <div className="p-4 bg-muted rounded-lg">
            <Label className="font-medium">Test Current Voice</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Hear how Buddy sounds with your current settings.
            </p>
            <Button
              onClick={() => settings.buddyVoiceURI && playVoicePreview(settings.buddyVoiceURI)}
              disabled={!settings.buddyVoiceURI || isPreviewPlaying}
              className="w-full"
            >
              {isPreviewPlaying ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Playing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  {t("testVoice")}
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
