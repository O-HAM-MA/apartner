import Link from "next/link";

export default function LeaveSuccessPage() {
  return (
    <div className="min-h-screen bg-pink-50 p-4 sm:p-8 flex flex-col items-center">
      <div className="bg-white p-10 rounded-lg shadow-lg text-center max-w-md w-full">
        <div className="mb-8">
          {/* 임시 아이콘 - 실제 WEHAGO 로고 SVG나 이미지로 교체하는 것이 좋습니다. */}
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-pink-100">
            <svg
              className="h-12 w-12 text-pink-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              ></path>
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          회원탈퇴가 완료되었습니다.
        </h1>
        <p className="text-gray-600 mb-8">
          Apartner를 이용해주시고 사랑해주셔서 감사합니다. 더욱더 노력하고
          발전하는 Apartner가 되겠습니다.
        </p>
        <Link href="/">
          <button className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-75 transition duration-150 ease-in-out">
            확인
          </button>
        </Link>
      </div>
    </div>
  );
}
