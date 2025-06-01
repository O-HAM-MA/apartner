'use client';
import Sidebar from '@/components/sidebar';
import type React from 'react';
import ChatFloatingButton from '@/components/ChatFloatingButton';
import { ApartnerTalkProvider } from '@/contexts/ApartnerTalkContext';
import { NotificationProvider } from '@/contexts/notification-context';
import { useGlobalLoginMember } from '@/auth/loginMember';
import { useGlobalAdminMember } from '@/auth/adminMember';
import Footer from '@/components/footer';

export default function UdashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLogin, isLoginMemberPending } = useGlobalLoginMember();
  const { isAdminLogin, isAdminMemberPending } = useGlobalAdminMember();

  // 로그인/인증 정보가 준비될 때까지 로딩 표시
  if (
    (isLoginMemberPending && isAdminMemberPending) ||
    (!isLogin && !isAdminLogin)
  ) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl font-bold">로딩중...</div>
      </div>
    );
  }

  return (
    <ApartnerTalkProvider>
      <NotificationProvider>
        <div className="flex min-h-screen flex-col">
          <div className="flex flex-1">
            <Sidebar />
            <div className="flex-1">
              <main className="p-8">{children}</main>
            </div>
          </div>
          <Footer />
        </div>
        <ChatFloatingButton />
      </NotificationProvider>
    </ApartnerTalkProvider>
  );
}
