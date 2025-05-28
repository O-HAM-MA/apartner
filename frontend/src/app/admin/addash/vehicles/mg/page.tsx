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
import { ChevronLeft, ChevronRight } from "lucide-react"; // Add this import

// 필요한 타입 정의
type ParkingStatusDto = components["schemas"]["ParkingStatusDto"];
type VehicleRegistrationInfoDto =
  components["schemas"]["VehicleRegistrationInfoDto"];

export default function AdminVehicleManagement() {
  const [slidingVehicleId, setSlidingVehicleId] = useState<number | null>(null);
  // Add query for invited-approved vehicles
  const { data: invitedVehicles } = useQuery<VehicleRegistrationInfoDto[]>({
    queryKey: ["vehicles", "invited-approved"],
    queryFn: async () => {
      const { data, error } = await client.GET(
        "/api/v1/vehicles/invited-approved"
      );
      if (error) throw error;
      return data;
    },
  });

  // Add mutation for updating vehicle status
  // 상태 변경을 위한 mutation 추가
  const updateVehicleStatusMutation = useMutation({
    mutationFn: ({
      entryRecordId,
      status,
    }: {
      entryRecordId: number;
      status: "AGREE" | "INAGREE" | "PENDING" | "INVITER_AGREE";
    }) => {
      return client.PATCH(`/api/v1/entry-records/${entryRecordId}/status`, {
        body: { status },
      });
    },
    onSuccess: () => {
      // 데이터 리프레시
      queryClient.invalidateQueries({ queryKey: ["vehicles", "mine"] });
    },
    onError: (error) => {
      console.error("승인 상태 변경 :", error);
      alert("승인 상태 변경.");
      setSlidingVehicleId(null);
    },
  });

  return (
    <div className="min-h-screen bg-white m-0 p-0">
      <Header />

      {/* 사용자 정보 배너 */}
      <div className="bg-[#FFE6EE] py-4 w-full m-0">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
              <span className="text-gray-500 text-xl"></span>
            </div>
            <div>
              <h2 className="font-bold text-lg text-[#FF4081]"></h2>
              <p className="text-sm text-gray-600"></p>
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
          {/* 입주민 승인 대기 차량 섹션 추가 */}
          <div className="mt-8 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              입주민 승인 대기 차량
            </h2>
            <div className="grid grid-cols-4 gap-4">
              {invitedVehicles?.map((vehicle) => (
                <div
                  key={vehicle.entryRecordId} // entryRecordId를 사용하여 고유성 보장
                  className={`bg-white p-4 rounded-lg border border-gray-200 shadow-sm 
                              transform transition-all duration-500 ease-in-out
                              ${
                                slidingVehicleId === vehicle.entryRecordId
                                  ? "translate-x-full opacity-0"
                                  : ""
                              }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium">{vehicle.vehicleNum}</p>
                      <p className="text-sm text-gray-500">{vehicle.type}</p>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      입주민 승인
                    </span>
                  </div>
                  <div className="space-y-1 mb-4">
                    <p className="text-sm">
                      <span className="text-gray-500">방문사유:</span>{" "}
                      {vehicle.reason || "-"}
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500">연락처:</span>{" "}
                      {vehicle.userPhone}
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500">방문지:</span>{" "}
                      {vehicle.apartmentName} {vehicle.buildingName}동{" "}
                      {vehicle.unitName}호
                    </p>
                  </div>
                  <div className="flex justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-1/2"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!slidingVehicleId && vehicle.entryRecordId) {
                          updateVehicleStatusMutation.mutate({
                            entryRecordId: vehicle.entryRecordId,
                            status: "INAGREE",
                          });
                        }
                      }}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      거부
                    </Button>
                    <Button
                      size="sm"
                      className="w-1/2 bg-[#FF4081] hover:bg-[#ff679b]"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!slidingVehicleId && vehicle.entryRecordId) {
                          updateVehicleStatusMutation.mutate({
                            entryRecordId: vehicle.entryRecordId,
                            status: "AGREE",
                          });
                        }
                      }}
                    >
                      승인
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
              {invitedVehicles?.length === 0 && (
                <div className="col-span-4 text-center py-8 text-gray-500">
                  입주민 승인 대기중인 차량이 없습니다.
                </div>
              )}
            </div>
          </div>
          <div className="mt-8">
            {/* 차량 목록 테이블 */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {/* 페이지네이션 */}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
