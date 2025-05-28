'use client';

import type React from 'react';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';

import { ConfigProvider, App } from 'antd';
import koKR from 'antd/locale/ko_KR';

import { NotificationProvider } from '@/contexts/notification-context';
import { Toaster } from '@/components/ui/toaster';
import { ClientLayout } from '@/auth/ClientLayout';

// React 버전에 따른 antd 경고 비활성화 처리
import { version } from 'react';
import { preMessage } from 'rc-util/es/warning';
const isReact18OrLower = parseInt(version.split('.')[0]) <= 18;

if (!isReact18OrLower) {
  preMessage((msg, type) => {
    if (msg && msg.includes('antd v5 support React')) {
      return null;
    }
    return msg;
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={koKR}
        theme={{
          token: {
            colorPrimary: '#2563EB',
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
    </QueryClientProvider>
  );
}
