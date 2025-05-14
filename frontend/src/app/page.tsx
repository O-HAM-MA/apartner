'use client'; // 클라이언트 컴포넌트로 변경

import React from 'react';
import { MdAccountCircle } from 'react-icons/md'; // 아이콘 import 추가
import { useGlobalLoginMember } from '@/app/stores/auth/loginMember'; // useGlobalLoginMember 훅 import

const APTnerPage: React.FC = () => {
   const { isLogin, loginMember } = useGlobalLoginMember(); // 로그인 정보 가져오기

   return (
      <>
         {' '}
         {/* Add React Fragment wrapper */}
         {/* User Info Section - 로그인 상태일 때만 표시 */}
         {isLogin && (
            <section className="bg-pink-100 py-12 md:py-16 mt-0 mx-0 mb-[10px]">
               <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center">
                  <div className="w-32 h-32 rounded-full mb-6 md:mb-0 md:mr-8 flex-shrink-0 flex items-center justify-center text-gray-300 overflow-hidden">
                     {loginMember.profileImageUrl ? (
                        <img
                           src={loginMember.profileImageUrl}
                           alt={loginMember.userName}
                           className="w-full h-full object-cover"
                        />
                     ) : (
                        <MdAccountCircle className="w-full h-full" />
                     )}
                  </div>
                  <div className="text-center md:text-left">
                     <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                        {loginMember.userName || '입주민'}
                     </h2>
                     {(loginMember.apartmentName || loginMember.buildingName || loginMember.unitNumber) && (
                        <p className="text-sm text-gray-600 bg-white inline-block px-2 py-1 rounded mt-1 mb-2">
                           {loginMember.apartmentName} {loginMember.buildingName} 동 {loginMember.unitNumber} 호
                        </p>
                     )}
                     <p className="text-gray-700 mb-6">안녕하세요! 아파트 관리 시스템에 오신 것을 환영합니다.</p>
                  </div>
                  <div className="md:ml-auto mt-6 md:mt-0">
                     <a
                        href="/udash" // 대시보드 링크 (실제 경로로 수정 필요)
                        className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors duration-300 inline-block text-center">
                        대시보드 가기
                     </a>
                  </div>
               </div>
            </section>
         )}
         {/* Hero Section (Carousel) */}
         <section className="bg-gray-100 py-12 md:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
               <h1 className="text-lg md:text-xl font-light text-gray-700 mb-8">
                  더 편리하고 효율적인 아파트 생활을 위한 서비스를 만나보세요.
               </h1>
               {/* Carousel Indicators */}
               <div className="flex justify-center space-x-2">
                  <button className="w-2.5 h-2.5 bg-gray-400 rounded-full focus:outline-none hover:bg-pink-500"></button>
                  <button className="w-2.5 h-2.5 bg-gray-300 rounded-full focus:outline-none hover:bg-pink-500"></button>
                  <button className="w-2.5 h-2.5 bg-gray-300 rounded-full focus:outline-none hover:bg-pink-500"></button>
               </div>
            </div>
         </section>
         {/* Services Section */}
         <section className="py-16 md:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
               <div className="flex items-center mb-12">
                  <div className="w-24 h-24 bg-gray-200 mr-8 hidden md:block"></div> {/* Placeholder for image */}
                  <div>
                     <h2 className="text-3xl md:text-4xl font-bold mb-2">서비스 소개</h2>
                     <p className="text-gray-600 text-lg">아파트 관리 시스템의 주요 기능</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Service Card 1 */}
                  <div className="bg-gray-50 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                     <p className="text-xs text-gray-500 mb-2">예약하기</p>
                     <div className="w-full h-48 bg-gray-200 mb-4 rounded flex items-center justify-center text-gray-400">
                        아파트 건물
                     </div>
                     <h3 className="text-xl font-semibold mb-2">시설 예약</h3>
                     <p className="text-gray-600 text-sm mb-4">편리한 비대면 예약 서비스 제공</p>
                     <div className="flex space-x-2 text-gray-400">
                        <span>💬</span>
                        <span>📅</span>
                        <span>🔧</span>
                     </div>
                  </div>

                  {/* Service Card 2 */}
                  <div className="bg-gray-50 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                     <p className="text-xs text-gray-500 mb-2">소통하기</p>
                     <div className="w-full h-48 bg-gray-200 mb-4 rounded flex items-center justify-center text-gray-400">
                        소통 아이콘
                     </div>
                     <h3 className="text-xl font-semibold mb-2">소통 채널</h3>
                     <p className="text-gray-600 text-sm mb-4">공지 및 민원 제출을 쉽게 할 수 있습...</p>
                     <div className="flex space-x-2 text-gray-400">
                        <span>💬</span>
                        <span>📅</span>
                        <span>🔧</span>
                     </div>
                  </div>

                  {/* Service Card 3 */}
                  <div className="bg-gray-50 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                     <p className="text-xs text-gray-500 mb-2">점검 일정</p>
                     <div className="w-full h-48 bg-gray-200 mb-4 rounded flex items-center justify-center text-gray-400">
                        유지보수 아이콘
                     </div>
                     <h3 className="text-xl font-semibold mb-2">안전 점검</h3>
                     <p className="text-gray-600 text-sm mb-4">공용 시설의 안전 점검 일정을 확인하...</p>
                     <div className="flex space-x-2 text-gray-400">
                        <span>💬</span>
                        <span>📅</span>
                        <span>🔧</span>
                     </div>
                  </div>
               </div>
            </div>
         </section>
      </>
   );
};

export default APTnerPage;
