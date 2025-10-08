// global.d.ts
// This file is used to declare global types for browser APIs not fully covered by default lib.d.ts
// or to extend existing interfaces.

interface SpeechRecognitionEventMap {
  audioend: Event
  audiostart: Event
  end: Event
  error: SpeechRecognitionErrorEvent
  nomatch: SpeechRecognitionEvent
  result: SpeechRecognitionEvent
  soundend: Event
  soundstart: Event
  speechstart: Event
  start: Event
}

interface SpeechRecognitionEvent extends Event {
  // Declare properties/methods for SpeechRecognitionEvent here
}

interface SpeechRecognition extends EventTarget {
  grammars: SpeechGrammarList
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  serviceURI: string
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  abort(): void
  start(): void
  stop(): void
  addEventListener<K extends keyof SpeechRecognitionEventMap>(
    type: K,
    listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void
  removeEventListener<K extends keyof SpeechRecognitionEventMap>(
    type: K,
    listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ): void
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition
  new (): SpeechRecognition
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: SpeechRecognitionErrorCode
  readonly message: string
}

declare var SpeechRecognitionErrorEvent: {
  prototype: SpeechRecognitionErrorEvent
  new (type: string, eventInitDict: SpeechRecognitionErrorEventInit): SpeechRecognitionErrorEvent
}

interface SpeechRecognitionErrorEventInit extends EventInit {
  error: SpeechRecognitionErrorCode
  message?: string
}

type SpeechRecognitionErrorCode =
  | "no-speech"
  | "aborted"
  | "audio-capture"
  | "network"
  | "not-allowed"
  | "service-not-allowed"
  | "bad-grammar"
  | "language-not-supported"

interface Window {
  SpeechRecognition: typeof SpeechRecognition
  webkitSpeechRecognition: typeof SpeechRecognition
  SpeechSynthesisUtterance: typeof SpeechSynthesisUtterance
  speechSynthesis: SpeechSynthesis
}

// Extend SpeechSynthesisUtterance for onboundary, onmark, onresume, onpause
interface SpeechSynthesisUtterance {
  onboundary: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null
  onmark: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null
  onresume: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null
  onpause: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null
}

// Extend SpeechSynthesis for onvoiceschanged
interface SpeechSynthesis {
  onvoiceschanged: ((this: SpeechSynthesis, ev: Event) => any) | null
}

// Minimal declarations for SpeechGrammarList and SpeechSynthesisEvent if not already present
type SpeechGrammarList = {}

interface SpeechSynthesisEvent extends Event {
  readonly charIndex: number
  readonly elapsedTime: number
  readonly name: string
}
