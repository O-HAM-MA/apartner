"use client"; // 클라이언트 컴포넌트

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useGlobalLoginMember } from "@/auth/loginMember"; // Import hook
import { useTheme } from "next-themes"; // useTheme 추가
import { Moon, Sun } from "lucide-react"; // Moon, Sun 아이콘 추가

const Header: React.FC = () => {
  const { isLogin, logoutAndHome, loginMember } = useGlobalLoginMember(); // 로그인 상태 및 로그아웃 함수 사용
  const [mounted, setMounted] = useState(false); // mounted 상태 추가
  const { theme, setTheme } = useTheme(); // useTheme 사용

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    // Next.js에서 서버 사이드 렌더링 시 테마 관련 UI가 깜빡이는 것을 방지
    // 혹은 기본 UI (예: 빈 div)를 반환하여 클라이언트 사이드에서 실제 UI가 그려지도록 함
    return (
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* 로딩 중 표시될 수 있는 간단한 헤더 레이아웃 */}
          <Link href="/" className="flex items-center">
            <div className="flex items-center">
              <svg
                className="h-8 w-8 mr-2 text-pink-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="font-bold text-2xl text-pink-500">APTner</span>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            {/* 기본 링크들 또는 빈 공간 */}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-md transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <div className="flex items-center">
            <svg
              className="h-8 w-8 mr-2 text-pink-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {/* 임시 아이콘 */}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="font-bold text-2xl text-pink-500 dark:text-pink-400">
              APTner
            </span>
          </div>
        </Link>

        {/* 네비게이션 및 기타 아이템 - 오른쪽 정렬 */}
        <div className="flex items-center space-x-4">
          {isLogin ? (
            <>
              <span className="text-gray-700 dark:text-gray-300">
                환영합니다, {loginMember.userName}님!
              </span>
              <Link
                href="/mypage"
                className="text-gray-600 hover:text-pink-500 dark:text-gray-300 dark:hover:text-pink-400"
              >
                내 정보 관리
              </Link>
              <button
                onClick={logoutAndHome}
                className="text-gray-600 hover:text-pink-500 dark:text-gray-300 dark:hover:text-pink-400"
              >
                로그sss아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-gray-600 hover:text-pink-500 dark:text-gray-300 dark:hover:text-pink-400"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="text-gray-600 hover:text-pink-500 dark:text-gray-300 dark:hover:text-pink-400"
              >
                회원가입
              </Link>
            </>
          )}
          {/* 다크 모드 토글 버튼 항상 표시 */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600 hover:text-pink-500 dark:text-gray-300 dark:hover:text-pink-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
