import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { getTranslation } from "@/lib/translations"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: getTranslation("appTitle", "en"),
  description: getTranslation("appDescription", "en"),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head suppressHydrationWarning>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body suppressHydrationWarning className="h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="buddy-theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
