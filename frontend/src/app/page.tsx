export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* 네비게이션 바 */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-pink-500">Apartner</div>
            </div>
            <div className="flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">
                기능
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">
                요금제
              </a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900">
                문의하기
              </a>
              <button className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors">
                시작하기
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 히어로 섹션 */}
      <div className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-8">
              스마트한 아파트 관리의 시작
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Apartner와 함께라면 복잡한 아파트 관리도 간단해집니다. 입주민부터
              관리자까지, 모두가 만족하는 솔루션을 경험해보세요.
            </p>
            <div className="flex justify-center space-x-4">
              <button className="bg-pink-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-pink-600 transition-colors">
                무료로 시작하기
              </button>
              <button className="bg-gray-100 text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-200 transition-colors">
                자세히 알아보기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 특징 섹션 */}
      <div id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              아파트 관리의 모든 것
            </h2>
            <p className="mt-4 text-gray-600">
              필요한 모든 기능을 한 곳에서 관리하세요
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 통계 섹션 */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-pink-500 mb-2">150+</div>
              <div className="text-gray-600">아파트 단지</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-pink-500 mb-2">
                50,000+
              </div>
              <div className="text-gray-600">입주민</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-pink-500 mb-2">98%</div>
              <div className="text-gray-600">만족도</div>
            </div>
          </div>
        </div>
      </div>

      {/* 푸터 */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">Apartner</div>
              <p className="text-sm">더 나은 아파트 생활을 위한 솔루션</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">제품</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    기능
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    요금제
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    데모 신청
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">회사</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    소개
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    블로그
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    채용
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">문의</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    이메일
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    전화
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    주소
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center">
            © 2025 Apartner. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    title: "실시간 관리",
    description:
      "언제 어디서나 실시간으로 아파트 현황을 모니터링하고 관리할 수 있습니다.",
    icon: (
      <svg
        className="w-6 h-6 text-pink-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    title: "스마트 커뮤니케이션",
    description:
      "입주민과 관리자 간의 원활한 소통을 위한 다양한 채널을 제공합니다.",
    icon: (
      <svg
        className="w-6 h-6 text-pink-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
    ),
  },
  {
    title: "데이터 분석",
    description:
      "체계적인 데이터 분석을 통해 효율적인 아파트 관리 방안을 제시합니다.",
    icon: (
      <svg
        className="w-6 h-6 text-pink-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
];
