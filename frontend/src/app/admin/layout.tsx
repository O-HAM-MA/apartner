'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/admin-sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { AdminMemberContext, useAdminMember } from '@/auth/adminMember';
import { checkAdminAuth } from '@/utils/api';
import { NotificationProvider } from '@/contexts/notification-context';
import Footer from '@/components/footer';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/admin';
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
          '[AdminLayout] 관리자 인증 확인 시작:',
          new Date().toISOString(),
          '현재 로그인 상태:',
          isAdminLogin
        );
        const data = await checkAdminAuth();
        console.log(
          '[AdminLayout] 관리자 인증 확인 성공:',
          new Date().toISOString()
        );

        // 인증 성공 시 adminMember 설정
        setAdminMember(data);

        // 로그인 페이지에 있고 인증이 성공했으면 대시보드로 리디렉션
        if (isLoginPage && data.id !== 0) {
          console.log(
            '[AdminLayout] 로그인 페이지에서 인증 성공, 대시보드로 이동'
          );
          window.location.href = '/admin/addash';
        }

        // 인증 확인 완료 상태로 설정
        setInitialAuthCheckDone(true);
      } catch (error) {
        console.error('[AdminLayout] 관리자 인증 확인 실패:', error);

        // 로그인 페이지가 아닌 경우에만 리다이렉트
        if (!isLoginPage) {
          setNoAdminMember();
          console.log('[AdminLayout] 인증 실패, 로그인 페이지로 이동');
          window.location.href = '/admin';
        }

        // 인증 확인 완료 상태로 설정 (실패했더라도 확인은 수행됨)
        setInitialAuthCheckDone(true);
      } finally {
        // 체크 완료 상태로 설정
        setCheckInProgress(false);
      }
    };

    // 로그인 페이지이거나 어드민 대시보드 페이지일 때 인증 확인
    checkAuth();
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
      <NotificationProvider>
        <div className="flex min-h-screen">
          <AdminSidebar />
          <div className="flex-1">
            <main className="p-8 pb-32">{children}</main>
          </div>
          <Footer />
        </div>
      </NotificationProvider>
    </AdminMemberContext.Provider>
  );
}
