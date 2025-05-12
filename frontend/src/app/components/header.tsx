import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center">
          {/* 로고 이미지 대신 텍스트로 임시 처리합니다. 실제 로고 SVG나 이미지를 사용하세요. */}
          <div className="flex items-center">
            <svg className="h-8 w-8 mr-2 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"> {/* 임시 아이콘 */}
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="font-bold text-2xl text-pink-500">APTner</span>
          </div>
        </div>
        <nav className="flex space-x-4">
        <a href="/login" className="text-gray-600 hover:text-pink-500">로그인</a>
        <a href="/signup" className="text-gray-600 hover:text-pink-500">회원가입</a>
          {/* <a href="/logout" className="text-gray-600 hover:text-pink-500">로그아웃</a>
          <a href="/my-info" className="text-gray-600 hover:text-pink-500">내 정보 관리</a> */}
        </nav>
      </div>
    </header>
  );
};

export default Header; 