import React from 'react';
import Layout from '../components/layout';
import { MdAccountCircle, MdEdit } from 'react-icons/md';

const MyPage: React.FC = () => {
  // 임시 사용자 데이터
  const userData = {
    name: '82start',
    email: '82start@naver.com',
    phone: '010-1234-5678',
    address: '서울 마포구 만리재로 14 (르네상스타워 14층) 1406호',
    // profileImageUrl 관련 필드는 아이콘 사용으로 불필요
  };

  // const profileImage = userData.profileImageUrl || '/images/default-profile.png'; // 아이콘 사용으로 불필요

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-white shadow-2xl rounded-xl overflow-hidden">
            <div className="p-6 md:p-8">
              <h2 className="text-3xl font-bold text-center text-slate-800 mb-10">
                마이페이지
              </h2>

              {/* 프로필 이미지 섹션 */}
              <div className="flex flex-col items-center mb-10">
                <div className="relative group">
                  <MdAccountCircle className="w-36 h-36 text-slate-300" />
                  <button
                    type="button"
                    className="absolute bottom-2 right-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full p-3 shadow-lg transition-all duration-300 opacity-80 group-hover:opacity-100 transform scale-90 group-hover:scale-100"
                    aria-label="프로필 사진 변경"
                  >
                    <MdEdit size={20} />
                  </button>
                </div>
              </div>

              {/* 사용자 정보 섹션 */}
              <div className="space-y-4">
                {[
                  { label: '이름', value: userData.name },
                  { label: '이메일', value: userData.email }, // '이메일 아이디' -> '이메일'로 변경
                  { label: '연락처', value: userData.phone },
                  {
                    label: '주소',
                    value: userData.address, // 주소 포맷팅 로직은 유지하거나 필요에 따라 단순화
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-slate-200 last:border-b-0"
                  >
                    <dt className="text-sm font-medium text-slate-500 sm:w-1/3">
                      {item.label}
                    </dt>
                    <dd className="mt-1 text-md text-slate-800 sm:mt-0 sm:w-2/3 sm:text-right">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </div>

              {/* 액션 버튼 섹션 */}
              <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row sm:justify-center gap-4">
                <button
                  type="button"
                  className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-semibold rounded-lg shadow-md text-white bg-pink-500 hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 transition-all duration-300 transform hover:scale-105"
                >
                  정보 수정
                </button>
                <button
                  type="button"
                  className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-slate-300 text-base font-semibold rounded-lg shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 transition-all duration-300 transform hover:scale-105"
                >
                  비밀번호 변경
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MyPage; 