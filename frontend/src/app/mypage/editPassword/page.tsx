'use client';

import React, { useState, useEffect } from 'react';
import { post } from '@/utils/api'; // API 유틸리티 import
import { useRouter } from 'next/navigation'; // 라우터 사용을 위해 추가
import { useGlobalLoginMember } from '@/auth/loginMember'; // 로그아웃 함수 사용을 위해 추가

// API 응답 타입을 위한 인터페이스 정의
interface ApiResponse {
  message: string;
}

const EditPasswordPage = () => {
  const router = useRouter(); // 라우터 초기화
  const { logout } = useGlobalLoginMember(); // logout 함수 가져오기
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가

  const [passwordPolicy, setPasswordPolicy] = useState({
    length: false,
    specialChar: false,
    uppercase: false, // 영문자로 해석 (대소문자 구분 없음)
    number: false,
  });
  const [passwordMatchMessage, setPasswordMatchMessage] = useState({
    text: '',
    color: '',
  });
  const [submitMessage, setSubmitMessage] = useState({
    text: '',
    color: '',
  });

  // 비밀번호 정책 검사 (새 비밀번호)
  useEffect(() => {
    setPasswordPolicy({
      length: newPassword.length >= 8,
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
      uppercase: /[a-zA-Z]/.test(newPassword), // 영문자 포함 (대소문자 구분 X)
      number: /[0-9]/.test(newPassword),
    });
  }, [newPassword]);

  // 새 비밀번호와 새 비밀번호 확인 일치 여부 검사
  useEffect(() => {
    if (newPassword && confirmNewPassword) {
      if (newPassword === confirmNewPassword) {
        setPasswordMatchMessage({
          text: '새 비밀번호가 일치합니다.',
          color: 'text-green-500',
        });
      } else {
        setPasswordMatchMessage({
          text: '새 비밀번호가 일치하지 않습니다.',
          color: 'text-red-500',
        });
      }
    } else {
      setPasswordMatchMessage({ text: '', color: '' });
    }
  }, [newPassword, confirmNewPassword]);

  const 정책문구스타일 = 'text-xs';
  const 충족스타일 = 'text-green-500';
  const 미충족스타일 = 'text-red-500';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitMessage({ text: '', color: '' });
    setIsLoading(true);

    if (newPassword !== confirmNewPassword) {
      setSubmitMessage({
        text: '새 비밀번호와 새 비밀번호 확인이 일치하지 않습니다.',
        color: 'text-red-500',
      });
      setIsLoading(false);
      return;
    }

    const { length, specialChar, uppercase, number } = passwordPolicy;
    if (!length || !specialChar || !uppercase || !number) {
      setSubmitMessage({
        text: '새 비밀번호가 정책을 만족하지 않습니다. 모든 조건을 확인해주세요.',
        color: 'text-red-500',
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await post<ApiResponse>(
        '/api/v1/myInfos/change-password',
        {
          currentPassword,
          newPassword,
          newPasswordConfirm: confirmNewPassword,
        }
      );

      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      logout(() => {
        alert(
          response.message ||
            '비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.'
        );
        router.push('/login');
      });
    } catch (error: any) {
      console.error('비밀번호 변경 실패 전체 에러:', error); // 전체 에러 객체 로깅
      let displayMessage =
        '비밀번호 변경 중 오류가 발생했습니다. 다시 시도해 주세요.'; // 기본 메시지

      if (
        error.response?.data?.message &&
        typeof error.response.data.message === 'string'
      ) {
        displayMessage = error.response.data.message;
      } else if (typeof error.message === 'string') {
        try {
          const jsonStringMatch = error.message.match(/{[\s\S]*}/);
          if (jsonStringMatch && jsonStringMatch[0]) {
            const parsedData = JSON.parse(jsonStringMatch[0]);
            if (parsedData && typeof parsedData.message === 'string') {
              displayMessage = parsedData.message;
            } else {
              displayMessage = error.message; // JSON은 있지만 message 필드가 없거나 유효하지 않으면 원래 error.message 사용
            }
          } else {
            displayMessage = error.message; // error.message 내에 JSON 형태가 없으면 그대로 사용
          }
        } catch (e) {
          console.warn(
            'error.message 내 JSON 파싱 실패, error.message 사용:',
            error.message
          );
          displayMessage = error.message; // 파싱 중 오류 발생 시 error.message 사용
        }
      } else if (
        error.response?.data &&
        typeof error.response.data === 'string'
      ) {
        try {
          const parsedData = JSON.parse(error.response.data);
          if (parsedData && typeof parsedData.message === 'string') {
            displayMessage = parsedData.message;
          }
        } catch (e) {}
      } else if (typeof error === 'string') {
        displayMessage = error;
      }

      setSubmitMessage({
        text: displayMessage,
        color: 'text-red-500',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pink-50 p-4 sm:p-8 flex flex-col items-center dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 md:p-12 w-full max-w-2xl">
        <div className="flex items-center mb-8">
          <svg
            className="w-16 h-16 text-pink-500 dark:text-pink-400 mr-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
            <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zm0 1.5a3.5 3.5 0 00-3.5 3.5V7h7V7a3.5 3.5 0 00-3.5-3.5zM5 9v5h10V9H5z"></path>
          </svg>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
              비밀번호 변경
            </h1>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-6">
            [비밀번호 변경]
          </h3>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-8 space-y-2 text-sm md:text-base">
            <li>
              회원님의 소중한 정보를 보호하기 위해 비밀번호를 정기적으로
              변경해주세요.
            </li>
            <li>비밀번호를 변경하신 후에는 새로운 비밀번호를 사용해주세요.</li>
          </ul>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                현재 비밀번호
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition duration-150 ease-in-out bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                새 비밀번호
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition duration-150 ease-in-out bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li
                  className={`${정책문구스타일} ${
                    passwordPolicy.length ? 충족스타일 : 미충족스타일
                  } ${
                    passwordPolicy.length
                      ? 'dark:text-green-400'
                      : 'dark:text-red-400'
                  }`}
                >
                  총 8글자 이상
                </li>
                <li
                  className={`${정책문구스타일} ${
                    passwordPolicy.uppercase ? 충족스타일 : 미충족스타일
                  } ${
                    passwordPolicy.uppercase
                      ? 'dark:text-green-400'
                      : 'dark:text-red-400'
                  }`}
                >
                  영문자 1개 이상
                </li>
                <li
                  className={`${정책문구스타일} ${
                    passwordPolicy.number ? 충족스타일 : 미충족스타일
                  } ${
                    passwordPolicy.number
                      ? 'dark:text-green-400'
                      : 'dark:text-red-400'
                  }`}
                >
                  숫자 1개 이상
                </li>
                <li
                  className={`${정책문구스타일} ${
                    passwordPolicy.specialChar ? 충족스타일 : 미충족스타일
                  } ${
                    passwordPolicy.specialChar
                      ? 'dark:text-green-400'
                      : 'dark:text-red-400'
                  }`}
                >
                  특수문자 1개 이상 (!@#$%^&*(),.?":{}|&lt;&gt;)
                </li>
              </ul>
            </div>

            <div>
              <label
                htmlFor="confirmNewPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                새 비밀번호 확인
              </label>
              <input
                type="password"
                id="confirmNewPassword"
                name="confirmNewPassword"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm transition duration-150 ease-in-out bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              {passwordMatchMessage.text && (
                <p
                  className={`mt-2 text-xs ${passwordMatchMessage.color} ${
                    passwordMatchMessage.color === 'text-green-500'
                      ? 'dark:text-green-400'
                      : 'dark:text-red-400'
                  }`}
                >
                  {passwordMatchMessage.text}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                ;, &quot;, &apos;, 공백문자는 사용 불가 (비밀번호 정책에 따름)
              </p>
            </div>

            {submitMessage.text && (
              <p
                className={`text-sm ${submitMessage.color} ${
                  submitMessage.color === 'text-red-500'
                    ? 'dark:text-red-400'
                    : 'dark:text-green-400' // 성공 메시지도 있을 수 있으므로 추가
                } text-center`}
              >
                {submitMessage.text}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading} // 로딩 중 버튼 비활성화
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 transition-transform duration-150 ease-in-out hover:scale-105 disabled:bg-pink-300 dark:disabled:bg-pink-800 disabled:cursor-not-allowed"
            >
              {isLoading ? '처리 중...' : '변경하기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPasswordPage;
