import Link from "next/link";

export default function SignUpSuccessPage() {
  return (
    <>
      <div className="min-h-screen bg-pink-50 p-4 sm:p-8 flex flex-col items-center dark:bg-gray-900">
        <div className="w-full max-w-md text-center bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8 md:p-12">
          <div className="mb-8">
            {/* 체크 아이콘 (SVG 또는 이미지) */}
            <svg
              className="w-16 h-16 mx-auto text-pink-500 dark:text-pink-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            회원가입이 완료되었습니다.
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            로그인 후 편리하고 효율적인
            <br />
            아파트너 서비스를 이용하실 수 있습니다.
          </p>
          <Link
            href="/login"
            className="w-full px-4 py-3 text-white bg-pink-500 hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
          >
            로그인
          </Link>
        </div>
      </div>
    </>
  );
}
