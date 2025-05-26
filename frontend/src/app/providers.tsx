"use client"

import React from "react"
import { ConfigProvider } from "antd"
import koKR from "antd/locale/ko_KR"

import { ThemeProvider } from "@/components/theme-provider"
import { NotificationProvider } from "@/contexts/notification-context"
import { Toaster } from "@/components/ui/toaster"
import { ClientLayout } from "@/auth/ClientLayout"

// Ant Design React 19 호환성 문제 해결
ConfigProvider.config({
  theme: {
    // 테마 설정
  },
  // React 19 호환성을 위한 설정
  warning: false, // 경고 비활성화
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={koKR}
      theme={{
        token: {
          colorPrimary: '#2563EB',
        },
      }}
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <NotificationProvider>
          <ClientLayout>
            {children}
            <Toaster />
          </ClientLayout>
        </NotificationProvider>
      </ThemeProvider>
    </ConfigProvider>
  )
}
