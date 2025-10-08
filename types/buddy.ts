export type BuddyRole = "user" | "assistant"

export type BuddyMessage = {
  id: string
  role: BuddyRole
  content: string
  createdAt: number
}

export type UIPreferences = {
  showHowToUse: boolean
  manuallyEnabledGuide: boolean
  themePreference: "auto" | "light" | "dark"
  sidebarCollapsed: boolean
  notificationStyle: "toast" | "banner" | "none"
  animationEnabled: boolean
  compactMode: boolean
  language: "en" | "nl" // English and Dutch
  useEmojis?: boolean // Temporary storage until database column is added
}

export type FontSize = "tiny" | "small" | "medium" | "large" | "huge" | "massive"

export type BuddySettings = {
  userName: string
  tone: "gentle" | "cheerful" | "calm" | "formal"
  pace: "very-slow" | "slow" | "normal"
  useEmojis: boolean
  humor: "never" | "sometimes" | "often"
  revealBackstory: "when-asked" | "natural-fit" | "never"
  backstory: string
  blockedTopics: string[]
  aiModel: "grok-3" | "gpt-4o" | "gpt-4o-mini" | "auto"
  // Theme settings
  theme: "light" | "dark" | "auto"
  // Voice settings
  useVoice: boolean
  voiceMode: "traditional" | "realtime" // New field for voice mode
  micDeviceId: string
  buddyVoiceURI: string
  speechRate: number
  speechPitch: number
  // Lip-sync settings
  lipSyncMode: "text" | "voice" | "audio" // New field for lip-sync mode
  // Profile picture settings for user and buddy avatars
  userAvatarUrl: string
  buddyAvatarUrl: string
  // Font size setting - default to 'large' for elderly users
  fontSize: FontSize
  // Timezone setting - IANA timezone (e.g., "America/New_York", "Europe/London")
  timezone: string
}
