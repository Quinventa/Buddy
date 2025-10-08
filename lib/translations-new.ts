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
    
    // Initial greeting
    initialGreeting: "Hello there. I'm Buddy. How are you feeling today?",
    
    // Chat interface
    typeHerePlaceholder: "Type here",
    friend: "friend",
    
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
    voiceSettings: "Voice Settings",
    
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
    
    // Calendar
    calendar: "Calendar",
    googleCalendar: "Google Calendar",
    connectCalendar: "Connect Calendar",
    calendarConnected: "Calendar Connected",
    
    // Notifications
    notifications: "Notifications",
    clearAll: "Clear All",
    noNotifications: "No notifications yet",
    testNotifications: "Test Notifications",
    testNotificationDesc: "Test the complete notification system (voice + chat + notification panel)",
    testReminderButton: "🔔 Test Reminder Notification",
    
    // Voice
    voiceInput: "Voice Input",
    startListening: "Start Listening",
    stopListening: "Stop Listening",
    
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
    
    // Common phrases
    hello: "Hello",
    goodbye: "Goodbye",
    thankyou: "Thank you",
    please: "Please",
    yes: "Yes",
    no: "No",
    
    // Time greetings
    goodMorning: "Good morning",
    goodAfternoon: "Good afternoon",
    goodEvening: "Good evening",
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
    
    // Initial greeting
    initialGreeting: "Hallo daar. Ik ben Buddy. Hoe voel je je vandaag?",
    
    // Chat interface
    typeHerePlaceholder: "Typ hier",
    friend: "vriend",
    
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
    
    // Calendar
    calendar: "Agenda",
    googleCalendar: "Google Agenda",
    connectCalendar: "Verbind Agenda",
    calendarConnected: "Agenda Verbonden",
    
    // Notifications
    notifications: "Meldingen",
    clearAll: "Alles Wissen",
    noNotifications: "Nog geen meldingen",
    testNotifications: "Test Meldingen",
    testNotificationDesc: "Test het complete meldingssysteem (spraak + chat + meldingenpaneel)",
    testReminderButton: "🔔 Test Herinnering Melding",
    
    // Voice
    voiceInput: "Spraakinvoer",
    startListening: "Begin met Luisteren",
    stopListening: "Stop met Luisteren",
    
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
    
    // Common phrases
    hello: "Hallo",
    goodbye: "Tot ziens",
    thankyou: "Dank je wel",
    please: "Alsjeblieft",
    yes: "Ja",
    no: "Nee",
    
    // Time greetings
    goodMorning: "Goedemorgen",
    goodAfternoon: "Goedemiddag",
    goodEvening: "Goedenavond",
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