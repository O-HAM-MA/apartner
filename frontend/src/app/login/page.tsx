import Link from 'next/link';
import Layout from '@/app/components/layout';

export default function LoginPage() {
  return (
    <Layout>
      <div className="flex flex-1 items-center justify-center bg-white-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-10 shadow-md">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              로그인
            </h2>
          </div>
          <form className="mt-8 space-y-6" action="#" method="POST">
            <input type="hidden" name="remember" defaultValue="true" />
            <div>
              <label
                htmlFor="email-address"
                className="block text-sm font-medium text-gray-700 mt-2.5 mb-2.5"
              >
                이메일
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="이메일을 입력하세요."
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mt-2.5 mb-2.5"
              >
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="비밀번호를 입력하세요."
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  로그인 상태 유지
                </label>
              </div>

              <div className="text-sm">
                <Link
                  href="/find-id"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  아이디 찾기
                </Link>
                <span className="mx-1 text-gray-400">|</span>
                <Link
                  href="/find-password"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  비밀번호 찾기
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-pink-500 py-2 px-4 text-sm font-medium text-white hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2"
              >
                로그인
              </button>
            </div>
          </form>

          <div className="relative mt-6">
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">또는</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-yellow-400 py-2 px-4 text-sm font-medium text-black hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2"
            >
              카카오톡으로 1초만에 시작하기
            </button>
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">아직 회원이 아니신가요? </span>
            <Link
              href="/signup"
              className="font-medium text-pink-500 hover:text-pink-400"
            >
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
} 