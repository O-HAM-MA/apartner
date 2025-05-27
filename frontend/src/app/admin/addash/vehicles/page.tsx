"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "@/lib/backend/client";
import { components } from "@/lib/backend/apiV1/schema";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// 필요한 타입 정의
type ParkingStatusDto = components["schemas"]["ParkingStatusDto"];
type VehicleRegistrationInfoDto =
  components["schemas"]["VehicleRegistrationInfoDto"];

export default function AdminVehicleManagement() {
  // React Query Client 인스턴스
  const queryClient = useQueryClient();

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

  return (
    <div className="min-h-screen bg-white m-0 p-0">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* 주차장 현황 섹션 */}
          <div className="mb-6 p-6 bg-white rounded-lg border border-gray-200 w-full">
            <h2 className="text-lg font-semibold mb-4">주차장 현황</h2>
            <div className="grid grid-cols-3 gap-10 max-w-[1200px] mx-auto">
              <div className="text-center p-6 bg-gray-50 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600 mb-2">전체 주차공간</p>
                <p className="text-3xl font-bold text-gray-900">
                  {parkingStatus?.totalCapacity || 0}
                  <span className="text-base font-normal text-gray-600 ml-1">
                    면
                  </span>
                </p>
              </div>
              <div className="text-center p-6 bg-pink-50 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600 mb-2">현재 주차</p>
                <p className="text-3xl font-bold text-[#FF4081]">
                  {parkingStatus?.activeCount || 0}
                  <span className="text-base font-normal text-gray-600 ml-1">
                    대
                  </span>
                </p>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600 mb-2">남은 공간</p>
                <p className="text-3xl font-bold text-green-600">
                  {parkingStatus?.remainingSpace || 0}
                  <span className="text-base font-normal text-gray-600 ml-1">
                    면
                  </span>
                </p>
              </div>
            </div>

            {/* 사용률 프로그레스 바 */}
            <div className="mt-8 max-w-[1200px] mx-auto">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-[#FF4081] h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      parkingStatus
                        ? (parkingStatus.activeCount /
                            parkingStatus.totalCapacity) *
                          100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-3 text-center">
                주차장 사용률:{" "}
                {parkingStatus
                  ? Math.round(
                      (parkingStatus.activeCount /
                        parkingStatus.totalCapacity) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>

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
                      <th className="px-6 py-4">연락처</th>
                      <th className="px-6 py-4">등록일</th>
                      <th className="px-6 py-4">상태</th>
                      <th className="px-6 py-4">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {vehicles?.map((vehicle) => (
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">
                          {vehicle.vehicleNum}
                        </td>
                        <td className="px-6 py-4">{vehicle.type}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              vehicle.registerType === "입주민"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {vehicle.registerType}
                          </span>
                        </td>
                        <td className="px-6 py-4">{vehicle.userName}</td>
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
                              ? "승인완료"
                              : vehicle.status === "INVITER_AGREE"
                              ? "1차승인"
                              : "미승인"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              수정
                            </Button>
                            <Button variant="destructive" size="sm">
                              삭제
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button variant="outline" size="sm">
                    이전
                  </Button>
                  <Button variant="outline" size="sm">
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
                      대의 차량
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      {/* 페이지네이션 버튼들 */}
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
