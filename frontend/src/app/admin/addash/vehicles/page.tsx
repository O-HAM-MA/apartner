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

          {/* 여기에 차량 관리 기능 추가 예정 */}
        </div>
      </main>

      <Footer />
    </div>
  );
}
