"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LoginMemberContext, useLoginMember } from "@/auth/loginMember";
import Layout from "@/components/layout";
import { checkUserAuth, checkAdminAuth } from "@/utils/api";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [serverError, setServerError] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

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
    // 이미 초기 확인이 완료된 경우 또는 서버 오류 상태면 실행하지 않음
    if (initialCheckDone || serverError) return;

    let isMounted = true;

    const checkLoginStatus = async () => {
      try {
        console.log("[ClientLayout] checkLoginStatus 호출됨");

        // 현재 경로가 관리자 페이지인지 확인
        const isAdminPath = pathname.startsWith("/admin");

        // 경로에 따라 적절한 인증 API 호출
        if (isAdminPath) {
          // 관리자 페이지인 경우 처리하지 않음 (AdminLayout에서 처리)
          setInitialCheckDone(true);
          setNoLoginMember();
          return;
        } else {
          // 일반 사용자 인증 API 호출
          const userData = await checkUserAuth();
          if (isMounted) {
            console.log(
              "[ClientLayout] /api/v1/auth/me 응답 데이터:",
              userData
            );
            setLoginMember(userData);
            console.log(
              "[ClientLayout] setLoginMember 호출됨, loginMember 상태:",
              userData
            );
            setInitialCheckDone(true);
            setServerError(false);
          }
        }
      } catch (error) {
        if (!isMounted) return;

        // 서버 연결 오류 처리
        if (
          error instanceof TypeError &&
          error.message.includes("Failed to fetch")
        ) {
          console.error("[ClientLayout] 서버 연결 오류:", error);
          setServerError(true);
        } else {
          // 기타 오류 (401 등)
          console.error(
            "[ClientLayout] 로그인 상태 확인 실패 또는 비로그인 상태:",
            error
          );
          setNoLoginMember();
          console.log("[ClientLayout] setNoLoginMember 호출됨");
          setInitialCheckDone(true);
        }
      }
    };

    checkLoginStatus();

    return () => {
      isMounted = false;
    };
  }, [
    pathname,
    setLoginMember,
    setNoLoginMember,
    initialCheckDone,
    serverError,
  ]);

  // 서버 오류 발생 시 오류 화면 표시
  if (serverError) {
    return (
      <div className="flex justify-center items-center h-screen flex-col">
        <div className="text-2xl font-bold text-red-600 mb-4">
          서버 연결 오류
        </div>
        <p className="mb-4">
          백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.
        </p>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => setServerError(false)}
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (isLoginMemberPending && !initialCheckDone) {
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
    <LoginMemberContext.Provider value={loginMemberContextValue}>
      {shouldUseCustomLayout ? (
        // admin 또는 udash 경로면 children만 렌더링
        children
      ) : (
        // 일반 사용자 경로면 Layout으로 감싸서 렌더링
        <Layout>{children}</Layout>
      )}
    </LoginMemberContext.Provider>
  );
}
