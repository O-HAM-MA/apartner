'use client'; // 클라이언트 컴포넌트

import React from 'react';
import Link from 'next/link';
import { useGlobalLoginMember } from '@/app/stores/auth/loginMember'; // Import hook

const Header: React.FC = () => {
   const { isLogin, logoutAndHome, loginMember } = useGlobalLoginMember(); // 로그인 상태 및 로그아웃 함수 사용

   return (
      <header className="sticky top-0 z-50 bg-white shadow-md">
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center">
               <div className="flex items-center">
                  <svg className="h-8 w-8 mr-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     {' '}
                     {/* 임시 아이콘 */}
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
            <nav className="flex space-x-4 items-center">
               {' '}
               {/* items-center 추가 */}
               {isLogin ? (
                  <>
                     <span className="text-gray-700">환영합니다, {loginMember.userName}님!</span>{' '}
                     {/* 사용자 이름 표시 */}
                     <button
                        onClick={logoutAndHome} // 로그아웃 함수 연결
                        className="text-gray-600 hover:text-pink-500">
                        로그아웃
                     </button>
                     <Link href="/mypage" className="text-gray-600 hover:text-pink-500">
                        {' '}
                        {/* 내 정보 관리 링크 */}내 정보 관리
                     </Link>
                  </>
               ) : (
                  <>
                     <Link href="/login" className="text-gray-600 hover:text-pink-500">
                        로그인
                     </Link>
                     <Link href="/signup" className="text-gray-600 hover:text-pink-500">
                        회원가입
                     </Link>
                  </>
               )}
            </nav>
         </div>
      </header>
   );
};

export default Header;
