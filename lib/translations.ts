// Internationalization (i18n) translations for the Buddy app
// Supports English (en) and Dutch (nl)

export type TranslationKey = keyof typeof translations.en

export const translations = {
  en: {
    // App general
    appName: "Buddy",
    loading: "Loading...",
    error: "Error",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    close: "Close",
    next: "Next",
    previous: "Previous",
    finish: "Finish",
    send: "Send",
    sending: "Sending...",
    
    // Navigation and UI
    settings: "Settings",
    profile: "Profile",
    connections: "Connections",
    howToUse: "How to Use",
    howToUseBuddy: "How to Use Buddy",
    
    // Initial greeting
    initialGreeting: "Hello there. I'm Buddy. How are you feeling today?",
    
    // Chat interface
    typeHerePlaceholder: "Type here",
    friend: "friend",
    companionDescription: "A friendly, patient companion for you",
    
    // Suggestion chips
    tellLightJoke: "Tell me a light joke",
    shareCozyStory: "Share a cozy story", 
    gentleBreathing: "Gentle breathing",
    weatherChat: "Weather chat",
    tellLightJokeRequest: "Please tell me a light, family-friendly joke.",
    shareCozyStoryRequest: "Could you share a short, cozy story?",
    gentleBreathingRequest: "Guide me through a simple breathing exercise.",
    weatherChatRequest: "Let's chat about the weather today.",
    
    // Model status
    autoBestAvailable: "Auto (best available)",
    manual: "Manual",
    
    // User settings
    useGentleEmojis: "Use gentle emojis",
    addWarmTouch: "Add a warm touch, when suitable.",
    gentle: "Gentle",
    cheerful: "Cheerful",
    calm: "Calm",
    formal: "Formal",
    verySlow: "Very slow",
    slow: "Slow",
    backstoryLabel: "Backstory",
    backstoryMention: "Backstory mention",
    onlyWhenAsked: "Only when asked",
    onlyIfFitsNaturally: "Only if it fits naturally",
    never: "Never",
    backstoryText: "Backstory text",
    blockedTopics: "Blocked topics (comma separated)",
    yourProfilePicture: "Your Profile Picture",
    buddyProfilePicture: "Buddy's Profile Picture",
    resetToDefault: "Reset to Default",
    profilePictureUpdated: "Profile picture updated",
    avatarChanged: "Your avatar has been changed.",
    buddyPictureUpdated: "Buddy's picture updated",
    buddyAvatarChanged: "Buddy's avatar has been changed.",
    avatarReset: "Avatar reset",
    usingDefaultAvatar: "Using default avatar.",
    buddyAvatarReset: "Buddy's avatar reset",
    usingDefaultBuddyAvatar: "Using default Buddy avatar.",
    sometimes: "Sometimes",
    often: "Often",
    
    // Realtime voice
    realtimeStarted: "Realtime Voice Started",
    realtimeStartedDesc: "You can now speak naturally with Buddy in real-time",
    realtimeStopped: "Realtime Voice Stopped", 
    realtimeStoppedDesc: "Realtime conversation has ended",
    startRealtime: "Start Realtime Voice",
    stopRealtime: "Stop Realtime Voice",
    realtimeActive: "Live",
    
    // Voice mode settings
    voiceMode: "Voice Mode",
    traditionalVoice: "Traditional",
    realtimeVoice: "Real-time",
    voiceModeDesc: "Choose how you want to interact with Buddy using voice",
    chooseVoiceMode: "Choose voice mode",
    
    // How-to-use guide pages
    guideWelcomeTitle: "Welcome to Buddy!",
    guideWelcomeDesc: "Hi there! I'm Buddy, your friendly AI companion designed to chat, help, and brighten your day. I'm here to listen, assist with daily tasks, and provide gentle support whenever you need it.",
    guideWelcomeTip1: "Start by telling me your name in the settings",
    guideWelcomeTip2: "I respond in a gentle, patient way",
    guideWelcomeTip3: "Feel free to share how you're feeling",
    
    guideChatTitle: "How to Chat with Me",
    guideChatDesc: "Chatting with me is simple and natural! Just type your message in the text box or use the voice input button. I love talking about daily activities, stories, gentle exercises, and anything that interests you.",
    guideChatTip1: "Type in the message box and press Enter",
    guideChatTip2: "Use the microphone for voice messages",
    guideChatTip3: "I remember our conversation context",
    
    guideCustomizeTitle: "Customize Your Experience",
    guideCustomizeDesc: "Make me truly yours! Click the settings button to adjust my personality, voice settings, and appearance. You can change my tone, speaking pace, humor level, and even upload custom avatars.",
    guideCustomizeTip1: "Click the gear icon to open settings",
    guideCustomizeTip2: "Adjust my tone and personality",
    guideCustomizeTip3: "Enable voice responses for audio conversations",
    
    guideCalendarTitle: "Calendar & Reminders",
    guideCalendarDesc: "I can help you stay organized! Connect your Google Calendar to manage events, and use the reminder system to help you remember important tasks like taking medication or drinking water.",
    guideCalendarTip1: "Connect Google Calendar for event management",
    guideCalendarTip2: "Set quick reminders for daily tasks",
    guideCalendarTip3: "Get gentle notifications when things are due",
    
    guideActivitiesTitle: "Activity Suggestions",
    guideActivitiesDesc: "Need inspiration? I offer gentle activity suggestions like seated stretches, breathing exercises, and conversation starters. These are designed to be simple, safe, and enjoyable.",
    guideActivitiesTip1: "Browse suggested activities in the sidebar",
    guideActivitiesTip2: "All activities are designed to be gentle and safe",
    guideActivitiesTip3: "Ask me for personalized suggestions anytime",
    
    guideFinishTitle: "You're All Set!",
    guideFinishDesc: "That's everything you need to know! Remember, I'm here to be your patient, understanding companion. Don't hesitate to ask questions, share stories, or just say hello. Enjoy our conversations!",
    guideFinishTip1: "I'm always here when you need me",
    guideFinishTip2: "Every conversation is a chance to connect",
    guideFinishTip3: "Take your time - there's no rush with me",
    
    // Settings sections
    personalSettings: "Personal Settings",
    interfacePreferences: "Interface Preferences",
    // Voice settings
    voiceSettings: "Voice Settings",
    testVoice: "Test Voice",
    
    // Font size settings
    fontSize: "Font Size",
    fontSizeTiny: "Tiny",
    fontSizeSmall: "Small", 
    fontSizeMedium: "Medium",
    fontSizeLarge: "Large",
    fontSizeHuge: "Huge",
    fontSizeMassive: "Massive",
    
    // Theme settings
    theme: "Theme",
    themeAuto: "Auto (System)",
    themeLight: "Light",
    themeDark: "Dark",
    themeDescription: "Choose your preferred color scheme",
    
    // Test notifications
    testNotifications: "Test Notifications",
    testNotificationDesc: "Test the complete notification system (voice + chat + notification panel)",
    testReminderButton: "🔔 Test Reminder Notification",
    
    // Personal settings
    yourName: "Your Name",
    namePlaceholder: "e.g., Mary",
    tone: "Tone",
    pace: "Pace",
    useEmojis: "Use gentle emojis",
    humor: "Humor",
    aiModel: "AI Model",
    
    // Tone options
    toneGentle: "Gentle",
    toneCheerful: "Cheerful",
    toneCalm: "Calm",
    toneFormal: "Formal",
    chooseTone: "Choose tone",
    
    // Pace options
    paceVerySlow: "Very Slow",
    paceSlow: "Slow",
    paceNormal: "Normal",
    choosePace: "Choose pace",
    
    // Humor options
    humorNever: "Never",
    humorSometimes: "Sometimes",
    humorOften: "Often",
    humorPreference: "Humor preference",
    
    // AI Model options
    chooseAiModel: "Choose AI model",
    
    // Interface preferences
    showHowToUseGuide: "Show How-to-Use Guide",
    showHowToUseGuideDesc: "Display the animated how-to-use button.",
    language: "Language",
    languageDesc: "Choose your preferred language.",
    chooseLanguage: "Choose language",
    
    // Language options
    languageEnglish: "English",
    languageDutch: "Dutch",
    
    // Safety and behavior
    safetyBehavior: "Safety & Behavior",
    backstoryBehavior: "Backstory behavior",
    harmfulContent: "Harmful content filter",
    harmfulContentPlaceholder: "e.g., violence, unsafe instructions",
    
    // Google Calendar
    connectGoogleCalendar: "Connect Google Calendar",
    requestingAccess: "Requesting Access...",
    grantCalendarPermissions: "Grant calendar permissions to view and manage your Google Calendar events (if you already did this or logged in using Google, please refresh the page).",
    calendarPermissionInfo: "This will allow you to view, create, and edit calendar events",
    calendarAccessRequired: "Calendar access is required to create events. Please connect your Google Calendar.",
    calendarAccessRequiredDelete: "Calendar access is required to delete events.",
    failedToCreateEvent: "Failed to create event",
    failedToDeleteEvent: "Failed to delete event",
    creating: "Creating...",
    createEvent: "Create Event",
    eventTitle: "Event Title",
    eventDate: "Date",
    eventTime: "Time",
    eventDescription: "Description",
    start: "Start",
    end: "End",
    today: "Today",
    tomorrow: "Tomorrow",
    at: "at",
    noEventsToday: "No events scheduled for today",
    noEventsSelected: "No events on selected day",
    allDay: "All Day",
    
    // Calendar toast messages
    googleAccountRequired: "Google Account Required",
    googleAccountRequiredDesc: "Please log in with your Google account first to access calendar features",
    permissionRequestFailed: "Permission Request Failed",
    failedToRequestPermissions: "Failed to request calendar permissions",
    permissionError: "Permission Error",
    unexpectedPermissionError: "An unexpected error occurred while requesting calendar access",
    calendarConnected: "Calendar Connected",
    successfullyConnectedCalendar: "Successfully connected to Google Calendar",
    permissionExpired: "Permission Expired",
    permissionExpiredDesc: "Calendar access has expired. Please reconnect your Google Calendar.",
    calendarLoadFailed: "Calendar Load Failed",
    unableToLoadEvents: "Unable to load calendar events. Please try again.",
    missingInformation: "Missing Information",
    fillRequiredFields: "Please fill in the event title, start time, and end time.",
    invalidTimeRange: "Invalid Time Range",
    endTimeBeforeStartTime: "End time cannot be before start time.",
    eventCreatedSuccessfully: "Event Created Successfully",
    eventCreationFailed: "Event Creation Failed",
    unableToCreateEvent: "Unable to create the calendar event. Please try again.",
    eventDeleted: "Event Deleted",
    eventDeletedDesc: "The event has been successfully removed from your calendar",
    eventDeletionFailed: "Event Deletion Failed",
    unableToDeleteEvent: "Unable to delete the event. Please try again.",
    todayAllDay: "Today (All day)",
    tomorrowAllDay: "Tomorrow (All day)",
    
    // Additional calendar UI translations
    newEvent: "New Event",
    editEvent: "Edit Event",
    eventUpdated: "Event Updated",
    eventUpdatedDesc: "The event has been successfully updated",
    eventUpdateFailed: "Event Update Failed",
    unableToUpdateEvent: "Unable to update the event. Please try again.",
    updating: "Updating...",
    updateEvent: "Update Event",
    
    // Additional calendar field translations
    location: "Location",
    locationOptional: "Location (optional)",
    
    // Calendar connection messages
    calendarHelperMessage: "I'd love to help you schedule that! However, I need access to your Google Calendar first. Please connect your calendar in the settings, and then I can create events for you.",
    
    // Voice Settings
    enableVoiceCommands: "Enable Voice Commands & Replies",
    enableVoiceDesc: "Speak to Buddy and hear replies.",
    microphoneInput: "Microphone Input",
    selectMicrophone: "Select microphone",
    microphones: "Microphones",
    noMicrophonesFound: "No microphones found (allow access)",
    buddyVoice: "Buddy's Voice",
    stopPreview: "Stop Preview",
    recommendedForElderly: "Recommended for Elderly",
    premiumQuality: "Premium Quality",
    standardQuality: "Standard Quality",
    basicQuality: "Basic Quality",
    loadingVoices: "Loading voices...",
    speechRate: "Speech Rate",
    voicePitch: "Voice Pitch",
    slower: "Slower",
    normal: "Normal",
    faster: "Faster",
    lower: "Lower",
    higher: "Higher",
    recommended: "Recommended",
    selected: "Selected",
    select: "Select",
    previewVoice: "Preview",
    microphoneAccess: "Microphone Access",
    allowMicrophoneAccess: "Please allow microphone access to select input devices.",
    previewError: "Preview Error",
    couldNotPreviewVoice: "Could not preview this voice.",
    voicePreviewText: "Hello! I'm Buddy, your friendly companion. This is how I sound with this voice.",
    startListening: "Start Listening",
    stopListening: "Stop Listening",
    listeningState: "Listening...",
    microphoneNotAvailable: "Microphone not available in this browser",
    
    // User Profile
    uploadAvatar: "Upload Avatar",
    changeAvatar: "Change Avatar",
    removeAvatar: "Remove Avatar",
    yourAccount: "Your Account",
    signOut: "Sign out",
    signingOut: "Signing out...",
    resetAndSignOut: "Reset & Sign Out",
    errorSigningOut: "Error signing out",
    signedOutSuccessfully: "Signed out successfully",
    unexpectedSignOutError: "An unexpected error occurred",
    
    // API Key Setup
    apiKeySetup: "API Key Setup",
    openaiApiKey: "OpenAI API Key",
    xaiApiKey: "XAI API Key",
    enterApiKey: "Enter your API key...",
    apiKeyRequired: "API key is required",
    apiKeySetupDesc: "Add API keys to enable AI responses. Buddy works with both providers.",
    getYourKeyAt: "Get your key at",
    localDevelopment: "Local development:",
    addKeysToEnv: "Add keys to .env.local",
    
    // Voice Input
    voiceDisabled: "Voice Disabled",
    enableVoiceCommandsFirst: "Please enable voice commands in settings first.",
    speechRecognitionNotSupported: "Speech Recognition Not Supported",
    browserSpeechRecognitionDesc: "Your browser doesn't support speech recognition. Try using Chrome or Edge.",
    microphoneAccessDenied: "Microphone Access Denied",
    allowMicrophoneInBrowser: "Please allow microphone access in your browser settings.",
    speechRecognitionError: "Speech Recognition Error",

    // Model Status
    modelStatus: "Model Status",
    online: "Online",
    offline: "Offline",
    
    // Authentication Pages
    welcomeBack: "Welcome Back",
    signInToContinue: "Sign in to continue chatting with Buddy",
    signingIn: "Signing in...",
    signIn: "Sign In",
    continueWithGoogle: "Continue with Google",
    signingInWithGoogle: "Signing in with Google...",
    orContinueWithEmail: "Or continue with email",
    email: "Email",
    password: "Password",
    enterYourEmail: "Enter your email",
    enterYourPassword: "Enter your password",
    dontHaveAccount: "Don't have an account?",
    signUp: "Sign up",
    
    createAccount: "Create Account",
    joinBuddy: "Join Buddy and start your friendly conversations",
    confirmPassword: "Confirm Password",
    createPasswordPlaceholder: "Create a password (min 6 characters)",
    confirmPasswordPlaceholder: "Confirm your password",
    creatingAccount: "Creating account...",
    alreadyHaveAccount: "Already have an account?",
    checkYourEmail: "Check Your Email",
    checkEmailDescription: "We've sent you a confirmation link. Please check your email and click the link to activate your account.",
    goToSignIn: "Go to Sign In",
    
    // Auth Error Messages
    failedToSignInWithGoogle: "Failed to sign in with Google",
    googleSignInNotAvailable: "Google sign-in is not available",
    passwordsDontMatch: "Passwords don't match",
    passwordMinLength: "Password must be at least 6 characters",
    unexpectedError: "An unexpected error occurred",
    formDataMissing: "Form data is missing",
    emailPasswordRequired: "Email and password are required",
    checkEmailToConfirm: "Check your email to confirm your account.",
    
    // Layout/App Metadata
    appTitle: "Buddy - Your Friendly AI Companion",
    appDescription: "A warm, empathetic AI companion designed to assist and converse with elderly people",
    
    // Google Calendar Additional
    description: "Description",
    optional: "optional",
    refreshing: "Refreshing...",
    refresh: "Refresh",
    
    // Connection Settings
    googleConnection: "Google Connection",
    disconnect: "Disconnect",
    connected: "Connected",
    notConnected: "Not Connected",
    connectedAccounts: "Connected Accounts",
    availableConnections: "Available Connections",
    connectAccountsDesc: "Connect your accounts to sync data and enable additional features.",
    loadingConnectedAccounts: "Loading your connected accounts...",
    accountConnected: "Account Connected",
    googleAccountConnectedSuccess: "Google account has been connected successfully.",
    connectionFailed: "Connection Failed",
    failedToConnectGoogle: "Failed to connect Google account. Please try again.",
    disconnectionFailed: "Disconnection Failed",
    failedToDisconnectAccount: "Failed to disconnect account. Please try again.",
    accountDisconnected: "Account Disconnected",
    accountDisconnectedDesc: "account has been disconnected.",
    connectGoogle: "Connect",
    connecting: "Connecting...",
    alreadyConnected: "Already Connected",
    alreadyLoggedInGoogle: "You are already logged in using your Google account",
    googleConnectedFeatures: "Google account connected for enhanced features",
    connectGoogleForCalendar: "Connect your Google account for calendar access and enhanced features",
    
    // General Calendar
    calendar: "Calendar",
    googleCalendar: "Google Calendar",
    connectCalendar: "Connect Calendar",
    
    // Messages
    typeMessage: "Type your message here...",
    chatWithBuddy: "Chat with Buddy",
    
    // Reminders
    reminders: "Reminders",
    addReminder: "Add Reminder",
    reminderText: "Reminder text",
    reminderPlaceholder: "What should I remind you about?",
    minutesFromNow: "Minutes from now",
    minutesPlaceholder: "Min",
    
    // Activities
    gentleActivities: "Gentle Activities",
    quickReminders: "Quick Reminders",
    
    // Activity suggestions
    seatedStretch: "Seated stretch",
    seatedStretchRequest: "Can you suggest a simple stretch I can do while seated?",
    breathingExercise: "Breathing exercise", 
    breathingExerciseRequest: "Can you suggest a simple breathing exercise?",
    gratitudeExercise: "Gratitude",
    gratitudeExerciseRequest: "Please guide me through a short gratitude exercise.",
    memoryPrompt: "Memory prompt",
    memoryPromptRequest: "Tell me a gentle memory prompt.",
    medicationTime: "Medication time",
    medicationTimeRequest: "Add medication time to my calendar for 8 AM daily",
    scheduleEventsHint: "Try asking me to schedule events! I can help add them to your Google Calendar.",
    safetyNotice: "Buddy keeps things safe and simple. No medical, financial, or legal advice.",
    
    // Calendar suggestions
    calendarSuggestions: "Calendar Suggestions",
    doctorAppointment: "🏥 Doctor visit",
    doctorAppointmentRequest: "Schedule a doctor appointment next Monday at 2 PM",
    familyCall: "📞 Family call",
    familyCallRequest: "Add a family call to my calendar for Sunday at 3 PM",
    
    // Reminders section  
    noRemindersYet: "No reminders yet.",
    done: "Done",
    scheduled: "Scheduled",
    
    // Voice input states  
    startVoice: "Start Voice",
    voiceProcessing: "Processing...",
    voiceStarting: "Starting...",
    gettingReadyToListen: "Getting ready to listen...",
    waitingForSpeech: "Waiting for speech...",
    processingYourMessage: "Processing your message...",
    finalLabel: "Final: ",
    speakingLabel: "Speaking: ",
    
    // Quick reminder options
    drinkWater: "💧 Water (30 min)",
    drinkWaterRequest: "Have a glass of water",
    takeWalk: "🚶 Walk (1 hour)",
    takeWalkRequest: "Take a short walk",
    takeMedication: "💊 Medication (3 hours)", 
    takeMedicationRequest: "Take your medication",
    doStretching: "🤸‍♀️ Stretching (45 min)",
    doStretchingRequest: "Do some stretching",
    
    // Input placeholders with name
    typeHerePlaceholderWithName: "Type here, {name}...",
    
    // Common phrases
    hello: "Hello",
    goodbye: "Goodbye",
    thankyou: "Thank you",
    please: "Please",
    yes: "Yes",
    no: "No",
    
    // Model status
    autoModel: "Auto",
    bestAvailable: "Best Available",
    unknown: "Unknown",
    
    // Calendar placeholders
    meetingTitlePlaceholder: "Meeting with team",
    meetingDescPlaceholder: "Discuss project updates",
    meetingLocationPlaceholder: "Conference room or video call link", 
    guestEmailPlaceholder: "Enter guest email and press Enter",
    
    // Time greetings
    goodMorning: "Good morning",
    goodAfternoon: "Good afternoon",
    goodEvening: "Good evening",
    
    // Calendar Reminders
    calendarReminders: "Calendar Reminders",
    calendarRemindersDesc: "Configure when and how Buddy reminds you about upcoming calendar events",
    enableCalendarReminders: "Enable Calendar Reminders",
    enableRemindersDesc: "Turn on notifications for upcoming calendar events",
    defaultReminderTime: "Default Reminder Time",
    defaultReminderTimeDesc: "How far in advance you want to be reminded about events",
    notificationMethods: "Notification Methods",
    showVisualNotifications: "Show Visual Notifications",
    showVisualNotificationsDesc: "Display reminders on screen",
    displayRemindersOnScreen: "Display reminders on screen",
    speakReminders: "Speak Reminders",
    speakRemindersDesc: "Have Buddy speak your reminders aloud",
    haveBuddySpeakReminders: "Have Buddy speak your reminders aloud",
    allDayEventReminders: "All-Day Event Reminders",
    allDayEventRemindersDesc: "Remind me about all-day events",
    reminderTimeForAllDay: "Reminder Time for All-Day Events",
    reminderTimeForAllDayDesc: "What time of day to remind you about all-day events",
    saveSettings: "Save Settings",
    saving: "Saving...",
    currentSettingsSummary: "Current Settings Summary",
    defaultReminder: "Default reminder",
    beforeEvents: "before events",
    visualNotifications: "Visual notifications",
    spokenReminders: "Spoken reminders",
    allDayEvents: "All-day events",
    enabled: "Enabled",
    disabled: "Disabled",
    failedToLoadReminderSettings: "Failed to load reminder settings",
    settingsSaved: "Settings Saved",
    reminderPreferencesUpdated: "Your calendar reminder preferences have been updated",
    failedToSaveReminderSettings: "Failed to save calendar reminder settings",
    
    // Reminder Notifications
    eventReminder: "Event Reminder",
    reminderDismissed: "Reminder Dismissed",
    dismissedReminderFor: "Dismissed reminder for",
    failedToDismissReminder: "Failed to dismiss reminder",
    oneMinuteUntilEvent: "1 minute until event",
    minutesUntilEvent: "minutes until event",
    repeatReminder: "Repeat",
    gotItButton: "Got it",
    dismissingButton: "Dismissing...",
    
    // Reminder Time Options
    oneMinute: "1 minute",
    fiveMinutes: "5 minutes",
    fifteenMinutes: "15 minutes",
    thirtyMinutes: "30 minutes",
    fortyFiveMinutes: "45 minutes",
    oneHour: "1 hour",
    twoHours: "2 hours",
    fourHours: "4 hours",
    eightHours: "8 hours",
    oneDay: "1 day",
  },
  
  nl: {
    // App general
    appName: "Buddy",
    loading: "Laden...",
    error: "Fout",
    save: "Opslaan",
    cancel: "Annuleren",
    delete: "Verwijderen",
    edit: "Bewerken",
    add: "Toevoegen",
    close: "Sluiten",
    next: "Volgende",
    previous: "Vorige",
    finish: "Voltooien",
    send: "Verstuur",
    sending: "Versturen...",
    
    // Navigation and UI
    settings: "Instellingen",
    profile: "Profiel",
    connections: "Verbindingen",
    howToUse: "Hoe te gebruiken",
    howToUseBuddy: "Hoe Buddy te gebruiken",
    
    // Initial greeting
    initialGreeting: "Hallo daar. Ik ben Buddy. Hoe voel je je vandaag?",
    
    // Chat interface
    typeHerePlaceholder: "Typ hier",
    friend: "vriend",
    companionDescription: "Een vriendelijke, geduldige metgezel voor je",
    
    // Suggestion chips
    tellLightJoke: "Vertel een lichte grap",
    shareCozyStory: "Deel een gezellig verhaal", 
    gentleBreathing: "Zachte ademhaling",
    weatherChat: "Weer gesprek",
    tellLightJokeRequest: "Vertel me alsjeblieft een lichte, familievriendelijke grap.",
    shareCozyStoryRequest: "Kun je een kort, gezellig verhaal delen?",
    gentleBreathingRequest: "Leid me door een eenvoudige ademhalingsoefening.",
    weatherChatRequest: "Laten we praten over het weer vandaag.",
    
    // Model status
    autoBestAvailable: "Automatisch (best beschikbare)",
    manual: "Handmatig",
    
    // User settings
    useGentleEmojis: "Gebruik zachte emoji's",
    addWarmTouch: "Voeg een warme toets toe, wanneer geschikt.",
    gentle: "Zacht",
    cheerful: "Vrolijk",
    calm: "Rustig",
    formal: "Formeel",
    verySlow: "Heel langzaam",
    slow: "Langzaam",
    backstoryLabel: "Achtergrondverhaal",
    backstoryMention: "Achtergrondverhaal vermelden",
    onlyWhenAsked: "Alleen wanneer gevraagd",
    onlyIfFitsNaturally: "Alleen als het natuurlijk past",
    never: "Nooit",
    backstoryText: "Achtergrondverhaal tekst",
    blockedTopics: "Geblokkeerde onderwerpen (komma gescheiden)",
    yourProfilePicture: "Uw profielfoto",
    buddyProfilePicture: "Buddy's profielfoto",
    resetToDefault: "Terugzetten naar standaard",
    profilePictureUpdated: "Profielfoto bijgewerkt",
    avatarChanged: "Uw avatar is gewijzigd.",
    buddyPictureUpdated: "Buddy's foto bijgewerkt",
    buddyAvatarChanged: "Buddy's avatar is gewijzigd.",
    avatarReset: "Avatar gereset",
    usingDefaultAvatar: "Standaard avatar gebruiken.",
    buddyAvatarReset: "Buddy's avatar gereset",
    usingDefaultBuddyAvatar: "Standaard Buddy avatar gebruiken.",
    sometimes: "Soms",
    often: "Vaak",
    
    // Realtime voice
    realtimeStarted: "Realtime Spraak Gestart",
    realtimeStartedDesc: "Je kunt nu natuurlijk praten met Buddy in realtime",
    realtimeStopped: "Realtime Spraak Gestopt",
    realtimeStoppedDesc: "Realtime gesprek is beëindigd", 
    startRealtime: "Start Realtime Spraak",
    stopRealtime: "Stop Realtime Spraak",
    realtimeActive: "Live",
    
    // Voice mode settings
    voiceMode: "Spraak Modus",
    traditionalVoice: "Traditioneel",
    realtimeVoice: "Realtime",
    voiceModeDesc: "Kies hoe je met Buddy wilt praten met spraak",
    chooseVoiceMode: "Kies spraak modus",
    
    // How-to-use guide pages
    guideWelcomeTitle: "Welkom bij Buddy!",
    guideWelcomeDesc: "Hallo daar! Ik ben Buddy, je vriendelijke AI-metgezel die is ontworpen om te chatten, te helpen en je dag op te vrolijken. Ik ben er om te luisteren, te helpen met dagelijkse taken en zachte ondersteuning te bieden wanneer je het nodig hebt.",
    guideWelcomeTip1: "Begin door me je naam te vertellen in de instellingen",
    guideWelcomeTip2: "Ik reageer op een zachte, geduldige manier",
    guideWelcomeTip3: "Voel je vrij om te delen hoe je je voelt",
    
    guideChatTitle: "Hoe met mij te chatten",
    guideChatDesc: "Chatten met mij is eenvoudig en natuurlijk! Typ gewoon je bericht in het tekstvak of gebruik de spraakinvoerknop. Ik praat graag over dagelijkse activiteiten, verhalen, zachte oefeningen en alles wat je interesseert.",
    guideChatTip1: "Typ in het berichtenvak en druk op Enter",
    guideChatTip2: "Gebruik de microfoon voor spraakberichten",
    guideChatTip3: "Ik onthoud onze gesprekscontext",
    
    guideCustomizeTitle: "Personaliseer je ervaring",
    guideCustomizeDesc: "Maak mij echt van jou! Klik op de instellingenknop om mijn persoonlijkheid, spraakinstellingen en uiterlijk aan te passen. Je kunt mijn toon, spreektempo, humorniveau wijzigen en zelfs aangepaste avatars uploaden.",
    guideCustomizeTip1: "Klik op het tandwielpictogram om instellingen te openen",
    guideCustomizeTip2: "Pas mijn toon en persoonlijkheid aan",
    guideCustomizeTip3: "Schakel spraakantwoorden in voor audiogesprekken",
    
    guideCalendarTitle: "Agenda & Herinneringen",
    guideCalendarDesc: "Ik kan je helpen georganiseerd te blijven! Verbind je Google Agenda om evenementen te beheren en gebruik het herinneringssysteem om je te helpen belangrijke taken zoals medicatie innemen of water drinken te onthouden.",
    guideCalendarTip1: "Verbind Google Agenda voor evenementenbeheer",
    guideCalendarTip2: "Stel snelle herinneringen in voor dagelijkse taken",
    guideCalendarTip3: "Ontvang zachte meldingen wanneer dingen verschuldigd zijn",
    
    guideActivitiesTitle: "Activiteitensuggesties",
    guideActivitiesDesc: "Heb je inspiratie nodig? Ik bied zachte activiteitensuggesties zoals zittende rekoefeningen, ademhalingsoefeningen en gespreksopeners. Deze zijn ontworpen om eenvoudig, veilig en plezierig te zijn.",
    guideActivitiesTip1: "Blader door voorgestelde activiteiten in de zijbalk",
    guideActivitiesTip2: "Alle activiteiten zijn ontworpen om zacht en veilig te zijn",
    guideActivitiesTip3: "Vraag me altijd om gepersonaliseerde suggesties",
    
    guideFinishTitle: "Je bent helemaal klaar!",
    guideFinishDesc: "Dat is alles wat je moet weten! Vergeet niet, ik ben er om je geduldige, begripvolle metgezel te zijn. Aarzel niet om vragen te stellen, verhalen te delen of gewoon hallo te zeggen. Geniet van onze gesprekken!",
    guideFinishTip1: "Ik ben er altijd wanneer je me nodig hebt",
    guideFinishTip2: "Elk gesprek is een kans om verbinding te maken",
    guideFinishTip3: "Neem je tijd - er is geen haast bij mij",
    
    // Settings sections
    personalSettings: "Persoonlijke Instellingen",
    interfacePreferences: "Interface Voorkeuren",
    voiceSettings: "Spraakinstellingen",
    testVoice: "Test Stem",
    
    // Font size settings
    fontSize: "Lettergrootte",
    fontSizeTiny: "Heel Klein",
    fontSizeSmall: "Klein",
    fontSizeMedium: "Middel",
    fontSizeLarge: "Groot",
    fontSizeHuge: "Heel Groot",
    fontSizeMassive: "Enorm",
    
    // Theme settings
    theme: "Thema",
    themeAuto: "Automatisch (Systeem)",
    themeLight: "Licht",
    themeDark: "Donker",
    themeDescription: "Kies uw gewenste kleurenschema",
    
    // Test notifications
    testNotifications: "Test Meldingen",
    testNotificationDesc: "Test het complete meldingssysteem (spraak + chat + meldingenpaneel)",
    testReminderButton: "🔔 Test Herinnering Melding",
    
    // Personal settings
    yourName: "Uw Naam",
    namePlaceholder: "bijv., Maria",
    tone: "Toon",
    pace: "Tempo",
    useEmojis: "Gebruik zachte emoji's",
    humor: "Humor",
    aiModel: "AI Model",
    
    // Tone options
    toneGentle: "Zacht",
    toneCheerful: "Vrolijk",
    toneCalm: "Kalm",
    toneFormal: "Formeel",
    chooseTone: "Kies toon",
    
    // Pace options
    paceVerySlow: "Erg Langzaam",
    paceSlow: "Langzaam",
    paceNormal: "Normaal",
    choosePace: "Kies tempo",
    
    // Humor options
    humorNever: "Nooit",
    humorSometimes: "Soms",
    humorOften: "Vaak",
    humorPreference: "Humor voorkeur",
    
    // AI Model options
    chooseAiModel: "Kies AI model",
    
    // Interface preferences
    showHowToUseGuide: "Toon Handleiding",
    showHowToUseGuideDesc: "Toon de geanimeerde handleidingknop.",
    language: "Taal",
    languageDesc: "Kies je voorkeurstaal.",
    chooseLanguage: "Kies taal",
    
    // Language options
    languageEnglish: "Engels",
    languageDutch: "Nederlands",
    
    // Safety and behavior
    safetyBehavior: "Veiligheid & Gedrag",
    backstoryBehavior: "Achtergrondverhaal gedrag",
    harmfulContent: "Schadelijke inhoud filter",
    harmfulContentPlaceholder: "bijv., geweld, onveilige instructies",
    
    // Google Calendar
    connectGoogleCalendar: "Verbind Google Agenda",
    requestingAccess: "Toegang Aanvragen...",
    grantCalendarPermissions: "Geef agenda toestemmingen om je Google Agenda evenementen te bekijken en beheren",
    calendarPermissionInfo: "Dit geeft je de mogelijkheid om agenda evenementen te bekijken, maken en bewerken",
    calendarAccessRequired: "Agenda toegang is vereist om evenementen te maken. Verbind alsjeblieft je Google Agenda.",
    calendarAccessRequiredDelete: "Agenda toegang is vereist om evenementen te verwijderen.",
    failedToCreateEvent: "Kon evenement niet maken",
    failedToDeleteEvent: "Kon evenement niet verwijderen",
    creating: "Maken...",
    createEvent: "Evenement Maken",
    eventTitle: "Evenement Titel",
    eventDate: "Datum",
    eventTime: "Tijd",
    eventDescription: "Beschrijving",
    start: "Begin",
    end: "Eind",
    today: "Vandaag",
    tomorrow: "Morgen",
    at: "om",
    noEventsToday: "Geen evenementen gepland voor vandaag",
    noEventsSelected: "Geen evenementen op geselecteerde dag",
    allDay: "Hele Dag",
    
    // Calendar toast messages
    googleAccountRequired: "Google Account Vereist",
    googleAccountRequiredDesc: "Log eerst in met je Google account om toegang te krijgen tot agenda functies",
    permissionRequestFailed: "Toestemmingsverzoek Mislukt",
    failedToRequestPermissions: "Kon geen agenda toestemmingen aanvragen",
    permissionError: "Toestemmingsfout",
    unexpectedPermissionError: "Er is een onverwachte fout opgetreden bij het aanvragen van agenda toegang",
    calendarConnectedMessage: "Agenda Verbonden",
    successfullyConnectedCalendar: "Succesvol verbonden met Google Agenda",
    permissionExpired: "Toestemming Verlopen",
    permissionExpiredDesc: "Agenda toegang is verlopen. Verbind alsjeblieft opnieuw je Google Agenda.",
    calendarLoadFailed: "Agenda Laden Mislukt",
    unableToLoadEvents: "Kan agenda evenementen niet laden. Probeer het opnieuw.",
    missingInformation: "Ontbrekende Informatie",
    fillRequiredFields: "Vul alsjeblieft de evenement titel, starttijd en eindtijd in.",
    invalidTimeRange: "Ongeldige Tijdspanne",
    endTimeBeforeStartTime: "Eindtijd kan niet voor starttijd zijn.",
    eventCreatedSuccessfully: "Evenement Succesvol Gemaakt",
    eventCreationFailed: "Evenement Maken Mislukt",
    unableToCreateEvent: "Kan het agenda evenement niet maken. Probeer het opnieuw.",
    eventDeleted: "Evenement Verwijderd",
    eventDeletedDesc: "Het evenement is succesvol verwijderd van je agenda",
    eventDeletionFailed: "Evenement Verwijderen Mislukt",
    unableToDeleteEvent: "Kan het evenement niet verwijderen. Probeer het opnieuw.",
    todayAllDay: "Vandaag (Hele dag)",
    tomorrowAllDay: "Morgen (Hele dag)",
    
    // Additional calendar UI translations
    newEvent: "Nieuw Evenement",
    editEvent: "Evenement Bewerken",
    eventUpdated: "Evenement Bijgewerkt",
    eventUpdatedDesc: "Het evenement is succesvol bijgewerkt",
    eventUpdateFailed: "Evenement Bijwerken Mislukt",
    unableToUpdateEvent: "Kan het evenement niet bijwerken. Probeer het opnieuw.",
    updating: "Bijwerken...",
    updateEvent: "Evenement Bijwerken",
    
    // Additional calendar field translations
    location: "Locatie",
    locationOptional: "Locatie (optioneel)",
    
    // Calendar connection messages
    calendarHelperMessage: "Ik help je graag met het plannen daarvan! Ik heb echter eerst toegang tot je Google Agenda nodig. Verbind alsjeblieft je agenda in de instellingen, dan kan ik evenementen voor je maken.",
    
    // Voice Settings
    enableVoiceCommands: "Spraakcommando's & Antwoorden Inschakelen",
    enableVoiceDesc: "Spreek tegen Buddy en hoor antwoorden.",
    microphoneInput: "Microfoon Invoer",
    selectMicrophone: "Selecteer microfoon",
    microphones: "Microfoons",
    noMicrophonesFound: "Geen microfoons gevonden (toegang toestaan)",
    buddyVoice: "Buddy's Stem",
    stopPreview: "Voorvertoning Stoppen",
    recommendedForElderly: "Aanbevolen voor Ouderen",
    premiumQuality: "Premium Kwaliteit",
    standardQuality: "Standaard Kwaliteit",
    basicQuality: "Basis Kwaliteit",
    loadingVoices: "Stemmen laden...",
    speechRate: "Spreeksnelheid",
    voicePitch: "Stem Toonhoogte",
    slower: "Langzamer",
    normal: "Normaal",
    faster: "Sneller",
    lower: "Lager",
    higher: "Hoger",
    recommended: "Aanbevolen",
    selected: "Geselecteerd",
    select: "Selecteren",
    previewVoice: "Voorvertoning",
    allowMicrophoneAccess: "Geef alsjeblieft microfoon toegang om invoerapparaten te selecteren.",
    previewError: "Voorvertoning Fout",
    couldNotPreviewVoice: "Kon deze stem niet vooraf bekijken.",
    voicePreviewText: "Hallo! Ik ben Buddy, je vriendelijke metgezel. Zo klink ik met deze stem.",
    startListening: "Begin met Luisteren",
    stopListening: "Stop met Luisteren",
    listeningState: "Luisteren...",
    microphoneAccess: "Microfoon Toegang",
    microphoneNotAvailable: "Microfoon niet beschikbaar in deze browser",
    
    // User Profile
    uploadAvatar: "Avatar Uploaden",
    changeAvatar: "Avatar Wijzigen",
    removeAvatar: "Avatar Verwijderen",
    yourAccount: "Jouw Account",
    signOut: "Uitloggen",
    signingOut: "Uitloggen...",
    resetAndSignOut: "Resetten & Uitloggen",
    errorSigningOut: "Fout bij uitloggen",
    signedOutSuccessfully: "Succesvol uitgelogd",
    unexpectedSignOutError: "Er is een onverwachte fout opgetreden",
    
    // API Key Setup
    apiKeySetup: "API Sleutel Instellingen",
    openaiApiKey: "OpenAI API Sleutel",
    xaiApiKey: "XAI API Sleutel",
    enterApiKey: "Voer je API sleutel in...",
    apiKeyRequired: "API sleutel is vereist",
    apiKeySetupDesc: "Voeg API sleutels toe om AI antwoorden mogelijk te maken. Buddy werkt met beide providers.",
    getYourKeyAt: "Krijg je sleutel bij",
    localDevelopment: "Lokale ontwikkeling:",
    addKeysToEnv: "Voeg sleutels toe aan .env.local",
    
    // Voice Input
    voiceDisabled: "Spraak Uitgeschakeld",
    enableVoiceCommandsFirst: "Schakel eerst spraakcommando's in bij instellingen.",
    speechRecognitionNotSupported: "Spraakherkenning Niet Ondersteund",
    browserSpeechRecognitionDesc: "Je browser ondersteunt geen spraakherkenning. Probeer Chrome of Edge te gebruiken.",
    microphoneAccessDenied: "Microfoon Toegang Geweigerd",
    allowMicrophoneInBrowser: "Geef alsjeblieft microfoon toegang in je browser instellingen.",
    speechRecognitionError: "Spraakherkenning Fout",

    // Model Status
    modelStatus: "Model Status",
    online: "Online",
    offline: "Offline",
    
    // Connection Settings
    googleConnection: "Google Verbinding",
    disconnect: "Verbinding Verbreken",
    connected: "Verbonden",
    notConnected: "Niet Verbonden",
    connectedAccounts: "Verbonden Accounts",
    availableConnections: "Beschikbare Verbindingen",
    connectAccountsDesc: "Verbind je accounts om gegevens te synchroniseren en extra functies mogelijk te maken.",
    loadingConnectedAccounts: "Je verbonden accounts laden...",
    accountConnected: "Account Verbonden",
    googleAccountConnectedSuccess: "Google account is succesvol verbonden.",
    connectionFailed: "Verbinding Mislukt",
    failedToConnectGoogle: "Kon Google account niet verbinden. Probeer het opnieuw.",
    disconnectionFailed: "Verbinding Verbreken Mislukt",
    failedToDisconnectAccount: "Kon account niet loskoppelen. Probeer het opnieuw.",
    accountDisconnected: "Account Losgekoppeld",
    accountDisconnectedDesc: "account is losgekoppeld.",
    connectGoogle: "Verbinden",
    connecting: "Verbinden...",
    alreadyConnected: "Al Verbonden",
    alreadyLoggedInGoogle: "Je bent al ingelogd met je Google account",
    googleConnectedFeatures: "Google account verbonden voor verbeterde functies",
    connectGoogleForCalendar: "Verbind je Google account voor agenda toegang en verbeterde functies",
    
    // General Calendar
    calendar: "Agenda",
    googleCalendar: "Google Agenda",
    connectCalendar: "Verbind Agenda",
    calendarConnected: "Agenda Verbonden",
    
    // Messages
    typeMessage: "Typ hier je bericht...",
    chatWithBuddy: "Chat met Buddy",
    
    // Reminders
    reminders: "Herinneringen",
    addReminder: "Herinnering Toevoegen",
    reminderText: "Herinneringstekst",
    reminderPlaceholder: "Waar moet ik je aan herinneren?",
    minutesFromNow: "Minuten vanaf nu",
    minutesPlaceholder: "Min",
    
    // Activities
    gentleActivities: "Zachte Activiteiten",
    quickReminders: "Snelle Herinneringen",
    
    // Activity suggestions
    seatedStretch: "Zittende stretch",
    seatedStretchRequest: "Kun je een eenvoudige stretch voorstellen die ik zittend kan doen?",
    breathingExercise: "Ademhaling oefening", 
    breathingExerciseRequest: "Kun je een eenvoudige ademhalingsoefening voorstellen?",
    gratitudeExercise: "Dankbaarheid",
    gratitudeExerciseRequest: "Leid me alsjeblieft door een korte dankbaarheidsoefening.",
    memoryPrompt: "Geheugen prompt",
    memoryPromptRequest: "Vertel me een zachte geheugenherinnering.",
    medicationTime: "Medicatie tijd",
    medicationTimeRequest: "Voeg medicatietijd toe aan mijn agenda voor 8 uur dagelijks",
    scheduleEventsHint: "Probeer me te vragen om evenementen in te plannen! Ik kan je helpen ze toe te voegen aan je Google Agenda.",
    safetyNotice: "Buddy houdt het veilig en eenvoudig. Geen medisch, financieel of juridisch advies.",
    
    // Calendar suggestions
    calendarSuggestions: "Agenda Suggesties",
    doctorAppointment: "🏥 Dokter bezoek",
    doctorAppointmentRequest: "Plan een doktersafspraak voor volgende maandag om 14:00",
    familyCall: "📞 Familie gesprek",
    familyCallRequest: "Voeg een familie gesprek toe aan mijn agenda voor zondag om 15:00",
    
    // Reminders section  
    noRemindersYet: "Nog geen herinneringen.",
    done: "Klaar",
    scheduled: "Gepland",
    
    // Voice input states  
    startVoice: "Start Spraak",
    voiceProcessing: "Verwerken...",
    voiceStarting: "Starten...",
    gettingReadyToListen: "Klaar om te luisteren...",
    waitingForSpeech: "Wachten op spraak...",
    processingYourMessage: "Je bericht verwerken...",
    finalLabel: "Definitief: ",
    speakingLabel: "Spreekt: ",
    
    // Quick reminder options
    drinkWater: "💧 Water (30 min)",
    drinkWaterRequest: "Drink een glas water",
    takeWalk: "🚶 Wandeling (1 uur)",
    takeWalkRequest: "Maak een korte wandeling",
    takeMedication: "💊 Medicatie (3 uur)", 
    takeMedicationRequest: "Neem je medicatie",
    doStretching: "🤸‍♀️ Stretchen (45 min)",
    doStretchingRequest: "Doe wat stretching",
    
    // Input placeholders with name
    typeHerePlaceholderWithName: "Typ hier, {name}...",
    
    // Common phrases
    hello: "Hallo",
    goodbye: "Tot ziens",
    thankyou: "Dank je wel",
    please: "Alsjeblieft",
    yes: "Ja",
    no: "Nee",
    
    // Model status
    autoModel: "Auto",
    bestAvailable: "Best Beschikbaar",
    unknown: "Onbekend",
    
    // Calendar placeholders
    meetingTitlePlaceholder: "Vergadering met team",
    meetingDescPlaceholder: "Projectupdates bespreken",
    meetingLocationPlaceholder: "Vergaderruimte of videobellink",
    guestEmailPlaceholder: "Voer gast-email in en druk op Enter",
    
    // Time greetings
    goodMorning: "Goedemorgen",
    goodAfternoon: "Goedemiddag",
    goodEvening: "Goedenavond",
    
    // Calendar Reminders
    calendarReminders: "Kalender Herinneringen",
    calendarRemindersDesc: "Configureer wanneer en hoe Buddy je herinnert aan komende kalendergebeurtenissen",
    enableCalendarReminders: "Kalender Herinneringen Inschakelen",
    enableRemindersDesc: "Zet meldingen aan voor komende kalendergebeurtenissen",
    defaultReminderTime: "Standaard Herinneringstijd",
    defaultReminderTimeDesc: "Hoe ver van tevoren je herinnerd wilt worden aan gebeurtenissen",
    notificationMethods: "Meldingsmethoden",
    showVisualNotifications: "Visuele Meldingen Tonen",
    showVisualNotificationsDesc: "Toon herinneringen op het scherm",
    displayRemindersOnScreen: "Toon herinneringen op het scherm",
    speakReminders: "Herinneringen Uitspreken",
    speakRemindersDesc: "Laat Buddy je herinneringen hardop voorlezen",
    haveBuddySpeakReminders: "Laat Buddy je herinneringen hardop voorlezen",
    allDayEventReminders: "Hele Dag Gebeurtenis Herinneringen",
    allDayEventRemindersDesc: "Herinner me aan hele dag gebeurtenissen",
    reminderTimeForAllDay: "Herinneringstijd voor Hele Dag Gebeurtenissen",
    reminderTimeForAllDayDesc: "Welk tijdstip van de dag om je te herinneren aan hele dag gebeurtenissen",
    saveSettings: "Instellingen Opslaan",
    saving: "Opslaan...",
    currentSettingsSummary: "Huidige Instellingen Samenvatting",
    defaultReminder: "Standaard herinnering",
    beforeEvents: "voor gebeurtenissen",
    visualNotifications: "Visuele meldingen",
    spokenReminders: "Gesproken herinneringen",
    allDayEvents: "Hele dag gebeurtenissen",
    enabled: "Ingeschakeld",
    disabled: "Uitgeschakeld",
    failedToLoadReminderSettings: "Kon herinneringsinstellingen niet laden",
    settingsSaved: "Instellingen Opgeslagen",
    reminderPreferencesUpdated: "Je kalender herinneringsvoorkeuren zijn bijgewerkt",
    failedToSaveReminderSettings: "Kon kalender herinneringsinstellingen niet opslaan",
    
    // Reminder Notifications
    eventReminder: "Gebeurtenis Herinnering",
    reminderDismissed: "Herinnering Weggedaan",
    dismissedReminderFor: "Herinnering weggedaan voor",
    failedToDismissReminder: "Kon herinnering niet wegdoen",
    oneMinuteUntilEvent: "1 minuut tot gebeurtenis",
    minutesUntilEvent: "minuten tot gebeurtenis",
    repeatReminder: "Herhalen",
    gotItButton: "Begrepen",
    dismissingButton: "Wegdoen...",
    
    // Reminder Time Options
    oneMinute: "1 minuut",
    fiveMinutes: "5 minuten",
    fifteenMinutes: "15 minuten",
    thirtyMinutes: "30 minuten",
    fortyFiveMinutes: "45 minuten",
    oneHour: "1 uur",
    twoHours: "2 uur",
    fourHours: "4 uur",
    eightHours: "8 uur",
    oneDay: "1 dag",
    
    // Authentication Pages
    welcomeBack: "Welkom Terug",
    signInToContinue: "Log in om verder te chatten met Buddy",
    signingIn: "Inloggen...",
    signIn: "Inloggen",
    continueWithGoogle: "Verder met Google",
    signingInWithGoogle: "Inloggen met Google...",
    orContinueWithEmail: "Of verder met email",
    email: "Email",
    password: "Wachtwoord",
    enterYourEmail: "Voer je email in",
    enterYourPassword: "Voer je wachtwoord in",
    dontHaveAccount: "Nog geen account?",
    signUp: "Aanmelden",
    
    createAccount: "Account Aanmaken",
    joinBuddy: "Word lid van Buddy en begin je vriendelijke gesprekken",
    confirmPassword: "Bevestig Wachtwoord",
    createPasswordPlaceholder: "Maak een wachtwoord (min 6 tekens)",
    confirmPasswordPlaceholder: "Bevestig je wachtwoord",
    creatingAccount: "Account aanmaken...",
    alreadyHaveAccount: "Al een account?",
    checkYourEmail: "Controleer Je Email",
    checkEmailDescription: "We hebben je een bevestigingslink gestuurd. Controleer je email en klik op de link om je account te activeren.",
    goToSignIn: "Ga naar Inloggen",
    
    // Auth Error Messages
    failedToSignInWithGoogle: "Kon niet inloggen met Google",
    googleSignInNotAvailable: "Google inloggen is niet beschikbaar",
    passwordsDontMatch: "Wachtwoorden komen niet overeen",
    passwordMinLength: "Wachtwoord moet tenminste 6 tekens zijn",
    unexpectedError: "Er is een onverwachte fout opgetreden",
    formDataMissing: "Formuliergegevens ontbreken",
    emailPasswordRequired: "Email en wachtwoord zijn vereist",
    checkEmailToConfirm: "Controleer je email om je account te bevestigen.",
    
    // Layout/App Metadata
    appTitle: "Buddy - Jouw Vriendelijke AI Metgezel",
    appDescription: "Een warme, empathische AI metgezel ontworpen om ouderen te helpen en mee te praten",
    
    // Google Calendar Additional
    description: "Beschrijving",
    optional: "optioneel",
    refreshing: "Vernieuwen...",
    refresh: "Vernieuwen",
  }
} as const

// Get translation for a key in the specified language
export function getTranslation(key: TranslationKey, language: "en" | "nl" = "en"): string {
  return translations[language][key] || translations.en[key] || key
}

// Hook for using translations in components
export function useTranslation(language: "en" | "nl" = "en") {
  return {
    t: (key: TranslationKey) => getTranslation(key, language),
    language
  }
}