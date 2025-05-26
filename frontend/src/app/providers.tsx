"use client";

import React from "react";
import { ConfigProvider, App } from "antd";
import koKR from "antd/locale/ko_KR";

import { ThemeProvider } from "@/components/theme-provider";
import { NotificationProvider } from "@/contexts/notification-context";
import { Toaster } from "@/components/ui/toaster";
import { ClientLayout } from "@/auth/ClientLayout";

// Ant Design 경고 비활성화
import { version } from "react";
import { preMessage } from "rc-util/es/warning";
const isReact18OrLower = parseInt(version.split(".")[0]) <= 18;

// React 19 + antd 호환성 경고 비활성화
if (!isReact18OrLower) {
  // 경고 메시지 필터링을 위한 preMessage 설정
  preMessage((msg, type) => {
    // antd v5 support React is 16 ~ 18 경고만 필터링
    if (msg && msg.includes("antd v5 support React")) {
      return null; // null 반환 시 경고가 표시되지 않음
    }
    // 다른 경고는 정상적으로 표시
    return msg;
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={koKR}
      theme={{
        token: {
          colorPrimary: "#2563EB",
        },
      }}
    >
      <App>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NotificationProvider>
            <ClientLayout>
              {children}
              <Toaster />
            </ClientLayout>
          </NotificationProvider>
        </ThemeProvider>
      </App>
    </ConfigProvider>
  );
}
