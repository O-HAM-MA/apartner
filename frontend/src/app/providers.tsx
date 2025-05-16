"use client"

import type React from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { NotificationProvider } from "@/contexts/notification-context"
import { Toaster } from "@/components/ui/toaster"
import { ClientLayout } from "@/auth/ClientLayout"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <NotificationProvider>
      <ClientLayout>
        {children}
        <Toaster />
      </ClientLayout>
      </NotificationProvider>
    </ThemeProvider>
  )
}
