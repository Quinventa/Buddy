// Enhanced voice utilities for better speech synthesis
export interface VoiceOption {
  voice: SpeechSynthesisVoice
  quality: 'premium' | 'standard' | 'basic'
  isRecommended: boolean
}

// Voice quality detection based on voice characteristics
export function getVoiceQuality(voice: SpeechSynthesisVoice): 'premium' | 'standard' | 'basic' {
  const name = voice.name.toLowerCase()
  const uri = voice.voiceURI.toLowerCase()
  
  // Premium voices (Neural, Enhanced, Premium, etc.)
  if (
    name.includes('neural') ||
    name.includes('premium') ||
    name.includes('enhanced') ||
    name.includes('wavenet') ||
    name.includes('journey') ||
    name.includes('alloy') ||
    name.includes('echo') ||
    name.includes('fable') ||
    name.includes('onyx') ||
    name.includes('nova') ||
    name.includes('shimmer') ||
    uri.includes('premium') ||
    uri.includes('enhanced')
  ) {
    return 'premium'
  }
  
  // Standard voices (typically OS-provided high quality)
  if (
    voice.localService ||
    name.includes('zira') ||
    name.includes('david') ||
    name.includes('mark') ||
    name.includes('susan') ||
    name.includes('george') ||
    name.includes('hazel')
  ) {
    return 'standard'
  }
  
  return 'basic'
}

// Smart voice selection for optimal user experience
export function selectBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null
  
  // Filter English voices
  const englishVoices = voices.filter(voice => 
    voice.lang.startsWith('en') || voice.lang === ''
  )
  
  if (englishVoices.length === 0) return voices[0]
  
  // Categorize voices by quality
  const voiceOptions: VoiceOption[] = englishVoices.map(voice => ({
    voice,
    quality: getVoiceQuality(voice),
    isRecommended: false
  }))
  
  // Mark recommended voices (gentle, warm voices suitable for elderly)
  voiceOptions.forEach(option => {
    const name = option.voice.name.toLowerCase()
    option.isRecommended = (
      name.includes('alloy') ||
      name.includes('nova') ||
      name.includes('shimmer') ||
      name.includes('zira') ||
      name.includes('susan') ||
      name.includes('hazel') ||
      (name.includes('female') && option.quality === 'premium') ||
      (name.includes('neural') && name.includes('en-us'))
    )
  })
  
  // Prioritize: Recommended Premium > Premium > Recommended Standard > Standard > Basic
  const sortedVoices = voiceOptions.sort((a, b) => {
    if (a.isRecommended && !b.isRecommended) return -1
    if (!a.isRecommended && b.isRecommended) return 1
    
    const qualityOrder = { premium: 0, standard: 1, basic: 2 }
    return qualityOrder[a.quality] - qualityOrder[b.quality]
  })
  
  return sortedVoices[0]?.voice || englishVoices[0]
}

// Get categorized voice options for settings UI
export function getCategorizedVoices(voices: SpeechSynthesisVoice[]): {
  recommended: VoiceOption[]
  premium: VoiceOption[]
  standard: VoiceOption[]
  basic: VoiceOption[]
} {
  const englishVoices = voices.filter(voice => 
    voice.lang.startsWith('en') || voice.lang === ''
  )
  
  const voiceOptions: VoiceOption[] = englishVoices.map(voice => ({
    voice,
    quality: getVoiceQuality(voice),
    isRecommended: false
  }))
  
  // Mark recommended voices
  voiceOptions.forEach(option => {
    const name = option.voice.name.toLowerCase()
    option.isRecommended = (
      name.includes('alloy') ||
      name.includes('nova') ||
      name.includes('shimmer') ||
      name.includes('zira') ||
      name.includes('susan') ||
      name.includes('hazel') ||
      (name.includes('female') && option.quality === 'premium')
    )
  })
  
  return {
    recommended: voiceOptions.filter(v => v.isRecommended),
    premium: voiceOptions.filter(v => v.quality === 'premium' && !v.isRecommended),
    standard: voiceOptions.filter(v => v.quality === 'standard' && !v.isRecommended),
    basic: voiceOptions.filter(v => v.quality === 'basic' && !v.isRecommended)
  }
}

// Text preprocessing for better speech synthesis
export function preprocessTextForSpeech(text: string): string {
  return text
    // Replace common abbreviations with full words
    .replace(/\bDr\./g, 'Doctor')
    .replace(/\bMr\./g, 'Mister')
    .replace(/\bMrs\./g, 'Missus')
    .replace(/\bMs\./g, 'Miss')
    .replace(/\bProf\./g, 'Professor')
    .replace(/\betc\./g, 'etcetera')
    .replace(/\bvs\./g, 'versus')
    .replace(/\be\.g\./g, 'for example')
    .replace(/\bi\.e\./g, 'that is')
    
    // Handle common symbols
    .replace(/&/g, 'and')
    .replace(/@/g, 'at')
    .replace(/#/g, 'number')
    .replace(/\$/g, 'dollar')
    .replace(/%/g, 'percent')
    
    // Add pauses for better pacing
    .replace(/\. /g, '. ')
    .replace(/! /g, '! ')
    .replace(/\? /g, '? ')
    .replace(/; /g, '; ')
    .replace(/: /g, ': ')
    
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

// Advanced speech synthesis with queuing and interruption handling
export class EnhancedSpeechSynthesis {
  private static instance: EnhancedSpeechSynthesis | null = null
  private speechQueue: string[] = []
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private isPlaying = false
  private onStateChange?: (isPlaying: boolean) => void
  private onPhonemeChange?: (phoneme: string | null) => void
  
  static getInstance(): EnhancedSpeechSynthesis {
    if (!this.instance) {
      this.instance = new EnhancedSpeechSynthesis()
    }
    return this.instance
  }
  
  setStateChangeCallback(callback: (isPlaying: boolean) => void) {
    this.onStateChange = callback
  }
  
  setPhonemeChangeCallback(callback: (phoneme: string | null) => void) {
    this.onPhonemeChange = callback
  }
  
  private updateState(isPlaying: boolean) {
    this.isPlaying = isPlaying
    this.onStateChange?.(isPlaying)
  }
  
  // Simple phoneme estimation based on text characters
  private estimatePhonemeFromText(text: string): string {
    if (!text || text.trim().length === 0) return "DEFAULT"
    
    const char = text.trim()[0].toUpperCase()
    
    // Map characters to approximate phonemes
    if ("AEIOU".includes(char)) {
      if (char === "O") return "O"
      if (char === "E") return "EE"
      if (char === "U") return "U"
      return "AEI"
    }
    
    if ("FV".includes(char)) return "FV"
    if (char === "L") return "L"
    if ("QW".includes(char)) return "QW"
    if ("TH".includes(text.substring(0, 2).toUpperCase())) return "TH"
    if ("SH".includes(text.substring(0, 2).toUpperCase()) || "CH".includes(text.substring(0, 2).toUpperCase())) return "SH_CH_J"
    if ("BMP".includes(char)) return "BMP"
    if ("CDGKNSTXYZ".includes(char)) return "CDGKNSTXYZ"
    
    return "DEFAULT"
  }
  
  speak(
    text: string, 
    options: {
      voice?: SpeechSynthesisVoice
      rate?: number
      pitch?: number
      volume?: number
      interrupt?: boolean
      lipSyncMode?: "text" | "voice" | "audio" // Updated to support audio mode
    } = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error('Speech synthesis not supported'))
        return
      }
      
      // Preprocess text for better speech
      const processedText = preprocessTextForSpeech(text)
      
      // Interrupt current speech if requested
      if (options.interrupt && this.isPlaying) {
        this.stop()
      }
      
      // Create utterance
      const utterance = new SpeechSynthesisUtterance(processedText)
      
      // Apply settings
      if (options.voice) utterance.voice = options.voice
      utterance.rate = options.rate ?? 0.9
      utterance.pitch = options.pitch ?? 1.0
      utterance.volume = options.volume ?? 1.0
      
      const lipSyncMode = options.lipSyncMode ?? "text"
      
      // Calculate animation speed based on speech rate and text length
      const baseSpeed = 50 // milliseconds per character (faster)
      const speed = baseSpeed / (options.rate ?? 0.9)
      
      // Set up event handlers
      utterance.onstart = () => {
        this.currentUtterance = utterance
        this.updateState(true)
        
        // Start animation based on mode
        if (this.onPhonemeChange) {
          if (lipSyncMode === "text") {
            // Text-based: animate through characters
            this.animateTextCharacters(processedText, speed)
          }
          // Voice-based mode will use onboundary event
        }
      }
      
      // Voice-based lip-sync using speech boundaries
      if (lipSyncMode === "voice") {
        utterance.onboundary = (event) => {
          if (this.onPhonemeChange) {
            const spokenText = processedText.substring(event.charIndex, event.charIndex + (event.charLength || 1))
            const phoneme = this.estimatePhonemeFromText(spokenText)
            this.onPhonemeChange(phoneme)
          }
        }
      }
      
      utterance.onend = () => {
        this.currentUtterance = null
        this.updateState(false)
        if (this.onPhonemeChange) {
          this.onPhonemeChange(null) // Reset to default
        }
        resolve()
      }
      
      utterance.onerror = (event) => {
        this.currentUtterance = null
        this.updateState(false)
        if (this.onPhonemeChange) {
          this.onPhonemeChange(null)
        }
        reject(new Error(`Speech synthesis error: ${event.error}`))
      }
      
      // Speak the utterance
      window.speechSynthesis.speak(utterance)
    })
  }
  
  // Animate through text characters for lip-sync with realistic pauses
  private async animateTextCharacters(text: string, speed: number) {
    for (let i = 0; i < text.length; i++) {
      if (!this.isPlaying) break
      
      const char = text[i]
      
      // Handle punctuation with pauses
      if (char === '.' || char === '!' || char === '?') {
        // Long pause for sentence endings (close mouth)
        this.onPhonemeChange?.(null)
        await this.sleep(speed * 3) // 3x pause (reduced from 5x)
      } else if (char === ',' || char === ';' || char === ':') {
        // Medium pause for commas and semicolons (close mouth)
        this.onPhonemeChange?.(null)
        await this.sleep(speed * 2) // 2x pause (reduced from 3x)
      } else if (char === ' ') {
        // Short pause for spaces (close mouth briefly)
        this.onPhonemeChange?.(null)
        await this.sleep(speed * 0.3) // Very brief pause (reduced from 0.5x)
      } else if (char.match(/[a-zA-Z]/)) {
        // Animate letters
        const phoneme = this.estimatePhonemeFromText(char)
        this.onPhonemeChange?.(phoneme)
        await this.sleep(speed)
      } else {
        // Other characters (numbers, symbols) - brief pause
        await this.sleep(speed * 0.2)
      }
    }
  }
  
  // Helper function for async delays
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  stop() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      this.currentUtterance = null
      this.updateState(false)
    }
  }
  
  pause() {
    if (window.speechSynthesis && this.isPlaying) {
      window.speechSynthesis.pause()
    }
  }
  
  resume() {
    if (window.speechSynthesis) {
      window.speechSynthesis.resume()
    }
  }
  
  getIsPlaying(): boolean {
    return this.isPlaying
  }
}
