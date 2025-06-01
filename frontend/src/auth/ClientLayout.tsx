"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoginMemberContext, useLoginMember } from "@/auth/loginMember";
import Layout from "@/components/layout";
import { checkUserAuth, checkAdminAuth } from "@/utils/api";

// 디버깅 정보를 위한 인터페이스 정의
interface DebugInfo {
  allCookies?: string;
  authCookies?: string[];
  hasAuthCookie?: boolean;
  emptyUserData?: boolean;
  validUserData?: boolean;
  userData?: any;
  apiError?: any;
  [key: string]: any; // 추가 디버깅 정보를 위한 인덱스 시그니처
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [serverError, setServerError] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  const {
    loginMember,
    setLoginMember,
    setNoLoginMember,
    isLoginMemberPending,
    isLogin,
    hasValidAuth,
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
    hasValidAuth,
    logout,
    logoutAndHome,
    clearLoginState,
  };

  useEffect(() => {
    // 이미 초기 확인이 완료된 경우 또는 서버 오류 상태면 실행하지 않음
    if (initialCheckDone || serverError) return;

    let isMounted = true;

    // API를 직접 호출하여 인증 상태 확인
    // HttpOnly 쿠키는 자바스크립트에서 접근할 수 없으므로 백엔드 API를 통해 확인해야 함
    const checkLoginStatus = async () => {
      try {
        console.log("[ClientLayout] 사용자 인증 상태 확인 중...");
        const userData = await checkUserAuth();

        if (!isMounted) return;

        // 응답 데이터 유효성 검증
        if (
          !userData ||
          (typeof userData === "object" && Object.keys(userData).length === 0)
        ) {
          console.log("[ClientLayout] 유저 데이터 없음, 비로그인 상태로 설정");
          setNoLoginMember();
          setInitialCheckDone(true);
          return;
        }

        // 유효한 사용자 데이터가 있는 경우
        console.log("[ClientLayout] 유저 데이터 로드 성공:", userData);
        setLoginMember(userData);
        setInitialCheckDone(true);
        setServerError(false);
      } catch (error) {
        if (!isMounted) return;

        console.error("[ClientLayout] 인증 확인 중 오류 발생:", error);

        // 서버 연결 오류 처리
        if (
          error instanceof TypeError &&
          error.message.includes("Failed to fetch")
        ) {
          setServerError(true);
        } else {
          // 401 등의 인증 오류는 비로그인 처리
          setNoLoginMember();
          setInitialCheckDone(true);
        }
      }
    };

    // 현재 경로가 관리자 페이지인지 확인
    const isAdminPath = pathname.startsWith("/admin");

    // 비로그인 허용 페이지 확인
    const isNoAuthPath =
      pathname === "/" ||
      pathname === "/signup" ||
      pathname === "/login" ||
      pathname === "/find-id" ||
      pathname === "/find-password" ||
      pathname.startsWith("/auth/");

    // 인증이 필요한 페이지인데 로그인되지 않은 경우 로그인 페이지로 리다이렉트
    // 유효한 인증이 있으면 로그인 상태로 간주하여 리다이렉트하지 않음
    if (
      !isNoAuthPath &&
      !isAdminPath &&
      initialCheckDone &&
      !isLogin &&
      !hasValidAuth
    ) {
      router.push("/login");
      return;
    }

    // 관리자 페이지인 경우 처리하지 않음 (AdminLayout에서 처리)
    // 비로그인 허용 페이지인 경우에도 처리하지 않음
    if (isAdminPath || isNoAuthPath) {
      // 비로그인 허용 페이지라도 로그인 상태를 체크해봅니다 (홈페이지 등에서 필요)
      if (!isLogin && !hasValidAuth && !isLoginMemberPending) {
        checkLoginStatus();
      } else {
        setNoLoginMember();
        setInitialCheckDone(true);
      }
      return;
    }

    // 페이지 진입 시 무조건 인증 상태 체크
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
    router,
    isLogin,
    hasValidAuth,
    isLoginMemberPending,
  ]);

  // 로그인 상태가 변경될 때 로그인이 필요한 페이지에서 로그인 상태를 확인
  useEffect(() => {
    if (!initialCheckDone) return;

    // 비로그인 허용 페이지 확인
    const isNoAuthPath =
      pathname === "/" ||
      pathname === "/signup" ||
      pathname === "/login" ||
      pathname === "/find-id" ||
      pathname === "/find-password" ||
      pathname.startsWith("/auth/");

    // 관리자 페이지인지 확인
    const isAdminPath = pathname.startsWith("/admin");

    // 인증이 필요한 페이지인데 로그인되지 않은 경우 로그인 페이지로 리다이렉트
    // 백엔드에서 검증된 인증이 있으면 로그인 상태로 간주
    if (!isNoAuthPath && !isAdminPath && !isLogin && !hasValidAuth) {
      router.push("/login");
    }
  }, [isLogin, hasValidAuth, initialCheckDone, pathname, router]);

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

      {/* 개발 환경에서만 디버깅 정보 표시 (숨겨진 요소) */}
      {process.env.NODE_ENV === "development" && debugInfo && (
        <div
          style={{ display: "none" }}
          id="auth-debug-info"
          data-debug={JSON.stringify(debugInfo)}
        ></div>
      )}
    </LoginMemberContext.Provider>
  );
}
