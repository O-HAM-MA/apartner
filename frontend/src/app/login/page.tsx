'use client';

import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalLoginMember } from '@/auth/loginMember';
import { post, get } from '@/utils/api';

type Member = {
  id: number;
  createDate: string;
  modifyDate: string;
  userName: string;
  profileImageUrl: string | null;
  apartmentName: string | null;
  buildingName: string | null;
  unitNumber: string | null;
  email: string | null;
  phoneNum: string | null;
  socialProvider: string | null;
};

export default function LoginPage() {
  const socialLoginForKakaoUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/oauth2/authorization/kakao`;
  const redirectUrl = `${process.env.NEXT_PUBLIC_FRONT_BASE_URL}`;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { setLoginMember } = useGlobalLoginMember();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      await post<any>('/api/v1/auth/login', { email, password });

      try {
        const memberData = await get<Member>('/api/v1/auth/me', {}, true);
        setLoginMember(memberData);
        router.push('/');
      } catch (meError) {
        console.error('Failed to fetch user data after login:', meError);
        let displayMessage = '사용자 정보 로딩 실패: 알 수 없는 오류입니다.'; // Default message

        if (meError instanceof Error) {
          let rawErrorMessage = meError.message;

          // Step 1: Strip "API 요청 실패: CODE - " prefix
          const apiPrefixPattern = /^API 요청 실패: \d{3}\s*-\s*(.*)$/;
          const prefixMatch = rawErrorMessage.match(apiPrefixPattern);
          if (prefixMatch && prefixMatch[1]) {
            rawErrorMessage = prefixMatch[1];
          }

          // Step 2: Attempt to parse as JSON and extract meaningful field
          let processedMessage = rawErrorMessage;
          try {
            const parsedJson = JSON.parse(rawErrorMessage);
            if (parsedJson && typeof parsedJson.error === 'string') {
              processedMessage = parsedJson.error;
            } else if (parsedJson && typeof parsedJson.message === 'string') {
              processedMessage = parsedJson.message;
            } else if (parsedJson && typeof parsedJson.detail === 'string') {
              processedMessage = parsedJson.detail;
            }
            // If no common keys found, or if not JSON, processedMessage remains as is.
          } catch (e) {
            // Not a JSON string, or parsing failed. processedMessage remains rawErrorMessage.
          }

          // Step 3: If the message is in "Category: Actual Message" format, extract "Actual Message".
          const categoryMessageMatch =
            processedMessage.match(/^([^:]+):\s*(.*)$/);
          if (categoryMessageMatch && categoryMessageMatch[2]) {
            displayMessage = categoryMessageMatch[2];
          } else {
            displayMessage = processedMessage; // Use as is if no category pattern.
          }
        } else {
          // meError is not an Error instance
          displayMessage =
            '사용자 정보 로딩 중 알 수 없는 타입의 오류가 발생했습니다.';
        }
        setError(displayMessage);
      }
    } catch (err) {
      let errorMessage = '로그인 중 오류가 발생했습니다.';
      if (err instanceof Error) {
        const apiErrorMatch = err.message.match(/[^\-]+(?: - (.*))?/);
        if (apiErrorMatch && apiErrorMatch[1]) {
          try {
            const backendError = JSON.parse(apiErrorMatch[1]);
            errorMessage =
              backendError.message || apiErrorMatch[1] || err.message;
          } catch {
            errorMessage = apiErrorMatch[1] || err.message;
          }
        } else {
          errorMessage = err.message;
        }
      }

      const reportedErrorPattern = /^API 요청 실패: \d{3}(?:.*?) - (.*)$/;
      const match =
        typeof errorMessage === 'string'
          ? errorMessage.match(reportedErrorPattern)
          : null;

      let finalErrorMessage = errorMessage;
      if (match && match[1]) {
        finalErrorMessage = match[1];
      }

      setError(finalErrorMessage);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-pink-50 dark:bg-gray-900 flex flex-col items-center px-7 pt-32 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg space-y-2 bg-white dark:bg-gray-800 rounded-2xl py-16 px-8 shadow-xl">
          <div>
            <h1 className="text-center text-5xl font-bold tracking-tight text-pink-500 dark:text-pink-400 mb-10 max-w-sm mx-auto">
              APTner
            </h1>
          </div>
          <form className="space-y-5 max-w-sm mx-auto" onSubmit={handleSubmit}>
            <input type="hidden" name="remember" defaultValue="true" />
            <div>
              <label
                htmlFor="email"
                className="block text-m font-medium leading-6 text-gray-900 dark:text-gray-100 mb-2"
              >
                이메일 (아이디)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-lg border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-pink-500 focus:border-pink-500 focus:outline-none dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400 dark:focus:ring-pink-400 sm:text-sm sm:leading-6"
                placeholder="이메일(아이디)을 입력하세요."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-m font-medium leading-6 text-gray-900 dark:text-gray-100 mb-2"
              >
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="block w-full rounded-lg border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-pink-500 focus:border-pink-500 focus:outline-none dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400 dark:focus:ring-pink-400 sm:text-sm sm:leading-6"
                placeholder="비밀번호를 입력하세요."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900 dark:bg-opacity-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400 dark:text-red-300"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center mb-4 mt-2">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-pink-500 focus:ring-pink-500 focus:ring-offset-0 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-pink-400"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-600 dark:text-gray-400"
                >
                  로그인 상태 유지
                </label>
              </div>

              <div className="text-sm mb-4 mt-2 ml-auto">
                <Link
                  href="/find-id"
                  className="font-medium text-pink-500 hover:text-pink-400 dark:text-pink-400 dark:hover:text-pink-300"
                >
                  아이디 찾기
                </Link>
                <span className="mx-1 text-gray-400 dark:text-gray-500">|</span>
                <Link
                  href="/find-password"
                  className="font-medium text-pink-500 hover:text-pink-400 dark:text-pink-400 dark:hover:text-pink-300"
                >
                  비밀번호 찾기
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-lg bg-pink-500 px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 dark:bg-pink-600 dark:hover:bg-pink-700"
              >
                로그인
              </button>
            </div>
          </form>
          <div className="flex items-center max-w-sm mx-auto">
            <div className="flex-grow h-px bg-gray-300 dark:bg-gray-600"></div>
            <span className="px-2 text-gray-500 dark:text-gray-400 text-s">
              또는
            </span>
            <div className="flex-grow h-px bg-gray-300 dark:bg-gray-600"></div>
          </div>

          <div>
            <a
              href={`${socialLoginForKakaoUrl}?redirectUrl=${redirectUrl}`}
              className="flex w-full justify-center rounded-lg bg-yellow-400 px-3 py-3 text-sm font-semibold leading-6 text-black shadow-sm hover:bg-yellow-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400 mb-8 max-w-sm mx-auto"
            >
              카카오톡으로 1초만에 시작하기
            </a>
          </div>

          <div className="text-center text-sm max-w-sm mx-auto">
            <span className="text-gray-600 dark:text-gray-400">
              아직 회원이 아니신가요?{' '}
            </span>
            <Link
              href="/signup"
              className="font-semibold text-pink-500 hover:text-pink-400 dark:text-pink-400 dark:hover:text-pink-300"
            >
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
