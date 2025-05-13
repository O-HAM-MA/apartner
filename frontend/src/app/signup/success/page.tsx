import Link from 'next/link';

export default function SignUpSuccessPage() {
   return (
      <>
         <div className="flex flex-col items-center justify-center bg-white p-4">
            <div className="w-full max-w-md text-center">
               <div className="mb-8">
                  {/* 체크 아이콘 (SVG 또는 이미지) */}
                  <svg
                     className="w-16 h-16 mx-auto text-pink-500"
                     fill="none"
                     stroke="currentColor"
                     viewBox="0 0 24 24"
                     xmlns="http://www.w3.org/2000/svg">
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
               </div>
               <h1 className="text-2xl font-bold text-gray-800 mb-4">회원가입이 완료되었습니다.</h1>
               <p className="text-gray-600 mb-8">
                  로그인 후 편리하고 효율적인
                  <br />
                  아파트너 서비스를 이용하실 수 있습니다.
               </p>
               <Link
                  href="/login"
                  className="w-full px-4 py-3 text-white bg-pink-500 rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 transition duration-150 ease-in-out">
                  로그인
               </Link>
            </div>
         </div>
      </>
   );
}
