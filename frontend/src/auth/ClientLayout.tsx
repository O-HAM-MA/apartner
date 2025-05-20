"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { LoginMemberContext, useLoginMember } from "@/auth/loginMember";
import Layout from "@/components/layout";
import { get } from "@/utils/api";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    loginMember,
    setLoginMember,
    setNoLoginMember,
    isLoginMemberPending,
    isLogin,
    logout,
    logoutAndHome,
    clearLoginState,
  } = useLoginMember();

  // 전역관리를 위한 Store 등록 - context api 사용
  const loginMemberContextValue = {
    loginMember,
    setLoginMember,
    isLoginMemberPending,
    isLogin,
    logout,
    logoutAndHome,
    clearLoginState,
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // get 함수 사용, 401 에러 시 자동 리다이렉트 방지
        const data = await get<any>("/api/v1/auth/me", {}, true);
        setLoginMember(data);
      } catch (error) {
        // 에러 발생 시 (401 포함) 로그인 안 된 상태로 처리
        console.log("로그인 상태 확인 실패 또는 비로그인 상태:", error);
        setNoLoginMember();
      }
    };

    checkLoginStatus();
  }, []);

  if (isLoginMemberPending) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-2xl font-bold">로딩중...</div>
      </div>
    );
  }

  // admin 또는 udash 경로인지 확인
  const isAdminPath = pathname.startsWith("/admin");
  const isUdashPath = pathname.startsWith("/udash");
  const shouldUseCustomLayout = isAdminPath || isUdashPath;

  return (
    <LoginMemberContext value={loginMemberContextValue}>
      {shouldUseCustomLayout ? (
        // admin 또는 udash 경로면 children만 렌더링
        children
      ) : (
        // 일반 사용자 경로면 Layout으로 감싸서 렌더링
        <Layout>{children}</Layout>
      )}
    </LoginMemberContext>
  );
}
