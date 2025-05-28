"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "@/lib/backend/client";
import { components } from "@/lib/backend/apiV1/schema";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

// 필요한 타입 정의
type ParkingStatusDto = components["schemas"]["ParkingStatusDto"];
type VehicleRegistrationInfoDto =
  components["schemas"]["VehicleRegistrationInfoDto"];

export default function AdminVehicleManagement() {
  // 페이징 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // React Query Client 인스턴스
  const queryClient = useQueryClient();
  const router = useRouter();

  // 주차장 현황 조회 쿼리
  const { data: parkingStatus } = useQuery<ParkingStatusDto>({
    queryKey: ["parking", "status"],
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/vehicles/status");
      if (error) throw error;
      return data;
    },
  });

  // 모든 차량 조회 쿼리 추가
  const { data: vehicles } = useQuery<VehicleRegistrationInfoDto[]>({
    queryKey: ["vehicles", "all"],
    queryFn: async () => {
      const { data, error } = await client.GET(
        "/api/v1/vehicles/registrationsWithStatus"
      );
      if (error) throw error;
      return data;
    },
  });

  // vehicles 데이터 정렬
  const sortedVehicles = vehicles
    ? [...vehicles].sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      })
    : [];

  // 페이지네이션 헬퍼 함수들
  const totalPages = Math.ceil((sortedVehicles?.length || 0) / itemsPerPage);

  const paginatedVehicles = sortedVehicles?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 페이지네이션 버튼 생성 함수
  const renderPaginationButtons = () => {
    const buttons = [];
    for (let i = 1; i <= totalPages; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
            currentPage === i
              ? "z-10 bg-[#FF4081] text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF4081]"
              : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
          }`}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  return (
    <div className="min-h-screen bg-white m-0 p-0">
      <Header />

      {/* 사용자 정보 배너 */}
      <div className="bg-[#FFE6EE] py-4 w-full m-0">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
              <span className="text-gray-500 text-xl">백</span>
            </div>
            <div>
              <h2 className="font-bold text-lg text-[#FF4081]">
                백선영 입주민
              </h2>
              <p className="text-sm text-gray-600">삼성아파트 101동 102호</p>
            </div>
          </div>
          <Link href="/dashboard">
            <Button className="bg-black text-white hover:bg-gray-800">
              대시보드 가기
            </Button>
          </Link>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* 차량 관리 섹션 */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                등록 차량 관리
              </h2>
              <div className="flex gap-4">
                <Button variant="outline" className="gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  엑셀 다운로드
                </Button>
                <Button className="gap-2 bg-[#FF4081] hover:bg-[#ff679b]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  신규 차량 등록
                </Button>
              </div>
            </div>

            {/* 차량 목록 테이블 */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-4">차량번호</th>
                      <th className="px-6 py-4">차종</th>
                      <th className="px-6 py-4">등록유형</th>
                      <th className="px-6 py-4">차주명</th>
                      <th className="px-6 py-4">방문사유</th>
                      <th className="px-6 py-4">연락처</th>
                      <th className="px-6 py-4">등록일</th>
                      <th className="px-6 py-4">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedVehicles?.map((vehicle) => (
                      <tr
                        key={`${vehicle.id}-${vehicle.vehicleNum}`}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          router.push(`/admin/addash/vehicles/${vehicle.id}`);
                        }}
                      >
                        <td className="px-6 py-4">{vehicle.vehicleNum}</td>
                        <td className="px-6 py-4">{vehicle.type}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              vehicle.registerType === "거주자"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {vehicle.registerType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {vehicle.registerType === "거주자"
                            ? vehicle.applicantName
                            : "-"}
                        </td>
                        <td className="px-6 py-4">
                          {vehicle.registerType === "방문자" ? (
                            <span className="text-black-600">
                              {vehicle.applicantName}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4">{vehicle.userPhone}</td>
                        <td className="px-6 py-4">
                          {new Date(vehicle.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              vehicle.status === "AGREE"
                                ? "bg-green-100 text-green-800"
                                : vehicle.status === "INVITER_AGREE"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {vehicle.status === "AGREE"
                              ? "최종 승인"
                              : vehicle.status === "INVITER_AGREE"
                              ? "입주민 승인"
                              : "미승인"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    이전
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    다음
                  </Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      총{" "}
                      <span className="font-medium">
                        {vehicles?.length || 0}
                      </span>{" "}
                      대의 차량 중{" "}
                      <span className="font-medium">
                        {(currentPage - 1) * itemsPerPage + 1}
                      </span>
                      -
                      <span className="font-medium">
                        {Math.min(
                          currentPage * itemsPerPage,
                          vehicles?.length || 0
                        )}
                      </span>
                      대 표시
                    </p>
                  </div>
                  <div>
                    <nav
                      className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        이전
                      </button>
                      {renderPaginationButtons()}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        다음
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
