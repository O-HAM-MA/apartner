"use client";
import Sidebar from "@/components/sidebar";
import type React from "react";
import ChatFloatingButton from "@/components/ChatFloatingButton";
import { ApartnerTalkProvider } from "@/contexts/ApartnerTalkContext";
import { NotificationProvider } from "@/contexts/notification-context";
import { useGlobalLoginMember } from "@/auth/loginMember";
import { useGlobalAdminMember } from "@/auth/adminMember";
import Footer from "@/components/footer";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { checkUserAuth } from "@/utils/api";

export default function UdashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLogin, isLoginMemberPending, loginMember } = useGlobalLoginMember();
  const { isAdminLogin, isAdminMemberPending } = useGlobalAdminMember();
  const router = useRouter();

  // 서버 인증 확인 로직 추가
  useEffect(() => {
    // 이미 로그인 상태로 확인된 경우 추가 확인 불필요
    if (isLogin && loginMember.id !== 0) {
      console.log("[UdashLayout] 로그인 확인됨:", loginMember);
      return;
    }

    // 로딩 중인 경우 스킵
    if (isLoginMemberPending) {
      return;
    }

    // 백엔드에서 인증 상태 확인
    const verifyAuth = async () => {
      try {
        // 백엔드 API를 통해 인증 상태 확인
        await checkUserAuth();
        console.log("[UdashLayout] 백엔드 인증 확인 성공");
      } catch (error) {
        console.error("[UdashLayout] 백엔드 인증 확인 실패:", error);
        console.log("[UdashLayout] 로그인 페이지로 리다이렉트");
        router.push("/login");
      }
    };

    verifyAuth();
  }, [isLogin, isLoginMemberPending, loginMember, router]);

  // 로그인/인증 정보가 준비될 때까지 로딩 표시
  if (isLoginMemberPending) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl font-bold">로딩중...</div>
      </div>
    );
  }

  // 로그인 상태가 아니면 로딩 표시 (리다이렉트는 useEffect에서 처리)
  if (!isLogin && !isAdminLogin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl font-bold">인증 확인 중...</div>
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
