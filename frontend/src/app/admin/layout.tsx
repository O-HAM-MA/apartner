"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin-sidebar";
import { usePathname, useRouter } from "next/navigation";
import { AdminMemberContext, useAdminMember } from "@/auth/adminMember";
import { checkAdminAuth } from "@/utils/api";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin";
  const [serverError, setServerError] = useState(false);
  const [initialAuthCheckDone, setInitialAuthCheckDone] = useState(false);
  const [checkInProgress, setCheckInProgress] = useState(false);

  const {
    adminMember,
    setAdminMember,
    setNoAdminMember,
    isAdminMemberPending,
    isAdminLogin,
    adminLogout,
    logoutAndRedirect,
    clearAdminState,
  } = useAdminMember();

  useEffect(() => {
    // 이미 인증 확인이 완료되었거나 확인 중이면 중복 실행 방지
    if (initialAuthCheckDone || checkInProgress) {
      return;
    }

    const checkAuth = async () => {
      // 체크 시작 상태로 설정
      setCheckInProgress(true);

      try {
        console.log(
          "[AdminLayout] 관리자 인증 확인 시작:",
          new Date().toISOString()
        );
        const data = await checkAdminAuth();
        console.log(
          "[AdminLayout] 관리자 인증 확인 성공:",
          new Date().toISOString()
        );

        // 인증 성공 시 adminMember 설정
        setAdminMember(data);

        // 인증 확인 완료 상태로 설정
        setInitialAuthCheckDone(true);
      } catch (error) {
        console.error("[AdminLayout] 관리자 인증 확인 실패:", error);

        // 로그인 페이지가 아닌 경우에만 리다이렉트
        if (!isLoginPage) {
          setNoAdminMember();
          router.push("/admin");
        }

        // 인증 확인 완료 상태로 설정 (실패했더라도 확인은 수행됨)
        setInitialAuthCheckDone(true);
      } finally {
        // 체크 완료 상태로 설정
        setCheckInProgress(false);
      }
    };

    // 로그인 페이지가 아니거나, 이미 로그인된 경우에만 인증 확인
    if (!isLoginPage || isAdminLogin) {
      checkAuth();
    } else {
      // 로그인 페이지에서는 인증 확인이 필요 없음
      setInitialAuthCheckDone(true);
    }
  }, [isLoginPage, router, setAdminMember, setNoAdminMember, isAdminLogin]);

  // 에러 상태 관리
  useEffect(() => {
    if (serverError) {
      const timer = setTimeout(() => setServerError(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [serverError]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <AdminMemberContext.Provider
      value={{
        adminMember,
        isAdminLogin,
        setAdminMember,
        isAdminMemberPending,
        adminLogout,
        logoutAndRedirect,
        clearAdminState,
      }}
    >
      <div className="min-h-screen flex">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 pb-6">{children}</main>
        </div>
      </div>
    </AdminMemberContext.Provider>
  );
}
