/**
 * Advanced Lip-Sync System using Web Audio API
 * Analyzes actual audio frequency to detect mouth shapes in real-time
 */

export type MouthShape = 
  | 'DEFAULT'   // 0 - Closed/resting
  | 'O'         // 1 - O sounds (low frequency, rounded)
  | 'CDGKNSTXYZ' // 2 - Consonants (high frequency, sharp)
  | 'EE'        // 3 - EE sounds (high frequency, narrow)
  | 'BMP'       // 4 - B/M/P (closed lips)
  | 'AEI'       // 5 - Ah/Eh/Ih (mid frequency, open)
  | 'U'         // 6 - Oo sounds (low-mid frequency)
  | 'TH'        // 7 - Th sounds (teeth visible)
  | 'SH_CH_J'   // 8 - Sh/Ch/J (lips forward)
  | 'QW'        // 9 - W/Q sounds (lips rounded)
  | 'L'         // 10 - L sounds (tongue up)
  | 'FV'        // 11 - F/V (teeth on lip)

export class AudioLipSyncAnalyzer {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null
  private animationFrame: number | null = null
  private onMouthShapeChange?: (shape: number) => void
  private isAnalyzing = false

  /**
   * Start analyzing audio from speech synthesis
   * Note: This captures system audio, which requires special setup
   */
  async startAnalysis(onMouthShapeChange: (shape: number) => void) {
    this.onMouthShapeChange = onMouthShapeChange
    this.isAnalyzing = true

    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 2048
      this.analyser.smoothingTimeConstant = 0.8

      // Start analyzing
      this.analyze()
    } catch (error) {
      console.error('Failed to start audio analysis:', error)
    }
  }

  /**
   * Analyze audio frequency to determine mouth shape
   */
  private analyze() {
    if (!this.analyser || !this.isAnalyzing) return

    const bufferLength = this.analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    const analyzeFrame = () => {
      if (!this.isAnalyzing || !this.analyser) return

      this.analyser.getByteFrequencyData(dataArray)

      // Calculate frequency bands
      const lowFreq = this.getAverageFrequency(dataArray, 0, 85) // 0-300Hz (bass/vowels)
      const midFreq = this.getAverageFrequency(dataArray, 85, 255) // 300-900Hz (vowels)
      const highFreq = this.getAverageFrequency(dataArray, 255, 512) // 900-2000Hz (consonants)
      const veryHighFreq = this.getAverageFrequency(dataArray, 512, bufferLength) // 2000Hz+ (sibilants)

      // Calculate total energy
      const totalEnergy = lowFreq + midFreq + highFreq + veryHighFreq
      const volume = totalEnergy / 4

      // Determine mouth shape based on frequency analysis
      const mouthShape = this.determineMouthShape(lowFreq, midFreq, highFreq, veryHighFreq, volume)
      
      if (this.onMouthShapeChange) {
        this.onMouthShapeChange(mouthShape)
      }

      this.animationFrame = requestAnimationFrame(analyzeFrame)
    }

    analyzeFrame()
  }

  /**
   * Get average frequency in a specific range
   */
  private getAverageFrequency(dataArray: Uint8Array, start: number, end: number): number {
    let sum = 0
    let count = 0
    for (let i = start; i < Math.min(end, dataArray.length); i++) {
      sum += dataArray[i]
      count++
    }
    return count > 0 ? sum / count : 0
  }

  /**
   * Determine mouth shape based on frequency analysis
   */
  private determineMouthShape(
    lowFreq: number,
    midFreq: number,
    highFreq: number,
    veryHighFreq: number,
    volume: number
  ): number {
    // Silence threshold
    if (volume < 10) {
      return 0 // DEFAULT
    }

    // Very high frequency = sibilants (S, Sh, Ch, Z)
    if (veryHighFreq > highFreq && veryHighFreq > 40) {
      return 8 // SH_CH_J
    }

    // High frequency dominant = consonants or EE
    if (highFreq > midFreq && highFreq > lowFreq) {
      if (midFreq > 30) {
        return 3 // EE (high + some mid)
      }
      return 2 // CDGKNSTXYZ (pure high)
    }

    // Low frequency dominant = O or U sounds
    if (lowFreq > midFreq && lowFreq > highFreq) {
      if (lowFreq > 50) {
        return 1 // O (very low)
      }
      return 6 // U (low-mid)
    }

    // Mid frequency with low = A/E/I vowels
    if (midFreq > 30 && lowFreq > 20) {
      return 5 // AEI
    }

    // Balanced frequencies = default or transition
    return 0 // DEFAULT
  }

  /**
   * Stop audio analysis
   */
  stop() {
    this.isAnalyzing = false
    
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }

    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect()
      this.mediaStreamSource = null
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
      this.audioContext = null
    }

    this.analyser = null
  }
}

/**
 * Enhanced text-based lip-sync with better phoneme detection
 */
export class TextBasedLipSync {
  private currentIndex = 0
  private text = ''
  private speed = 50
  private intervalId: NodeJS.Timeout | null = null
  private onPhonemeChange?: (phoneme: string | null) => void

  start(text: string, speed: number, onPhonemeChange: (phoneme: string | null) => void) {
    this.text = text
    this.speed = speed
    this.onPhonemeChange = onPhonemeChange
    this.currentIndex = 0

    this.animate()
  }

  private async animate() {
    for (let i = 0; i < this.text.length; i++) {
      if (!this.onPhonemeChange) break

      const char = this.text[i]
      const nextChar = this.text[i + 1] || ''
      
      // Handle punctuation with pauses
      if (char === '.' || char === '!' || char === '?') {
        this.onPhonemeChange(null)
        await this.sleep(this.speed * 3)
      } else if (char === ',' || char === ';' || char === ':') {
        this.onPhonemeChange(null)
        await this.sleep(this.speed * 2)
      } else if (char === ' ') {
        this.onPhonemeChange(null)
        await this.sleep(this.speed * 0.3)
      } else if (char.match(/[a-zA-Z]/)) {
        // Better phoneme detection with look-ahead
        const phoneme = this.detectPhoneme(char, nextChar)
        this.onPhonemeChange(phoneme)
        await this.sleep(this.speed)
      } else {
        await this.sleep(this.speed * 0.2)
      }
    }

    // Return to default
    if (this.onPhonemeChange) {
      this.onPhonemeChange(null)
    }
  }

  /**
   * Detect phoneme with better accuracy using digraphs
   */
  private detectPhoneme(char: string, nextChar: string): string {
    const c = char.toUpperCase()
    const n = nextChar.toUpperCase()
    const combo = c + n

    // Check for digraphs first
    if (combo === 'TH') return 'TH'
    if (combo === 'SH' || combo === 'CH') return 'SH_CH_J'
    if (combo === 'QU' || combo === 'WH') return 'QW'

    // Vowels
    if ('AEIOU'.includes(c)) {
      if (c === 'O') return 'O'
      if (c === 'E' && n === 'E') return 'EE'
      if (c === 'I' && n === 'I') return 'EE'
      if (c === 'U') return 'U'
      return 'AEI'
    }

    // Consonants
    if ('BMP'.includes(c)) return 'BMP'
    if ('FV'.includes(c)) return 'FV'
    if (c === 'L') return 'L'
    if ('QW'.includes(c)) return 'QW'
    if ('CDGKNSTXYZ'.includes(c)) return 'CDGKNSTXYZ'
    if (c === 'J') return 'SH_CH_J'

    return 'DEFAULT'
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  stop() {
    this.onPhonemeChange = undefined
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }
}
