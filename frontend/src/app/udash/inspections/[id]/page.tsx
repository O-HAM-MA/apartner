import {
  BellRing,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function InspectionDetail() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}

      <div className="flex flex-1 flex-col">
        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Header with Title and Bell Icon */}
          <header className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">시설점검</h2>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 rounded-full hover:bg-gray-200 focus:outline-none">
                <BellRing size={22} className="text-gray-600" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-pink-500 ring-2 ring-white"></span>
              </button>
            </div>
          </header>

          {/* Back Button */}
          <div className="mb-6">
            <Link href="/udash/inspections">
              <Button
                variant="outline"
                className="flex items-center gap-2 text-pink-600 border-pink-200 hover:bg-pink-50 hover:text-pink-700"
              >
                <ArrowLeft size={16} />
                <span>점검 목록으로 돌아가기</span>
              </Button>
            </Link>
          </div>

          {/* Inspection Detail Header */}
          <div className="bg-white rounded-lg border border-zinc-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">
                  점검 ID: FAC-001
                </div>
                <h1 className="text-2xl font-bold text-gray-800">
                  엘레베이터 1호기 정기 점검
                </h1>
              </div>
              <div className="mt-4 md:mt-0">
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                  <CheckCircle size={16} className="mr-1" />
                  정상 완료
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-zinc-200 pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">점검 일자</div>
                  <div className="font-medium text-gray-700">2023-05-15</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">소요 시간</div>
                  <div className="font-medium text-gray-700">2시간 30분</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">담당자</div>
                  <div className="font-medium text-gray-700">김기술</div>
                </div>
              </div>
            </div>
          </div>

          {/* Inspection Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Inspection Information */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-lg border border-zinc-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  점검 내용
                </h2>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    엘레베이터 1호기에 대한 정기 점검을 실시하였습니다. 점검
                    결과, 모든 기능이 정상적으로 작동하고 있으며 안전 기준을
                    충족하고 있습니다.
                  </p>
                  <div className="border-t border-zinc-200 pt-4">
                    <h3 className="font-medium text-gray-800 mb-2">
                      점검 항목
                    </h3>
                    <ul className="list-disc pl-5 space-y-2 text-gray-700">
                      <li>엘레베이터 작동 상태 확인</li>
                      <li>안전장치 작동 여부 확인</li>
                      <li>비상 통신 시스템 점검</li>
                      <li>도어 센서 및 개폐 시스템 점검</li>
                      <li>케이블 및 기계 장치 점검</li>
                      <li>소음 및 진동 상태 확인</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-zinc-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  점검 결과
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800">
                        모든 기능 정상 작동
                      </p>
                      <p className="text-gray-700">
                        엘레베이터의 모든 기능이 정상적으로 작동하고 있습니다.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800">
                        경미한 소음 발생
                      </p>
                      <p className="text-gray-700">
                        2층에서 3층으로 이동 시 경미한 소음이 발생하나, 안전에는
                        문제가 없습니다. 다음 정기 점검 시 재확인이 필요합니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Additional Information */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-zinc-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  시설 정보
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">시설 ID</span>
                    <span className="text-gray-700 font-medium">FAC-001</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">시설명</span>
                    <span className="text-gray-700 font-medium">
                      엘레베이터 1호기
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">위치</span>
                    <span className="text-gray-700 font-medium">1동 로비</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">설치일</span>
                    <span className="text-gray-700 font-medium">
                      2020-05-15
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">제조사</span>
                    <span className="text-gray-700 font-medium">
                      현대엘리베이터
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-zinc-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  점검 이력
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <div>
                      <p className="text-gray-700 font-medium">2023-05-15</p>
                      <p className="text-sm text-gray-500">정기 점검 완료</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <div>
                      <p className="text-gray-700 font-medium">2023-02-10</p>
                      <p className="text-sm text-gray-500">정기 점검 완료</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                    <div>
                      <p className="text-gray-700 font-medium">2022-11-05</p>
                      <p className="text-sm text-gray-500">부품 교체 작업</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-200">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 text-pink-600 border-pink-200 hover:bg-pink-50 hover:text-pink-700"
                  >
                    <FileText size={16} />
                    <span>전체 이력 보기</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-200 bg-white p-6 text-center text-sm text-gray-700">
          © 2025 APTner. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
