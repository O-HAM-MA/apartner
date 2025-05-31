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

type EntryRecordStatusUpdateRequestDto =
  components["schemas"]["EntryRecordStatusUpdateRequestDto"];

type EditingEntryRecordStatus = {
  id: number;
  status: "AGREE" | "INAGREE" | "PENDING" | "INVITER_AGREE";
};

export default function AdminVehicleManagement() {
  // 페이징 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 사라지는 차량 ID를 추적하기 위한 상태 추가
  const [slidingVehicleId, setSlidingVehicleId] = useState<number | null>(null);

  // React Query Client 인스턴스
  const queryClient = useQueryClient();
  const router = useRouter();

  // 주차장 현황 조회 쿼리 수정
  const { data: parkingStatus, refetch: refetchParkingStatus } =
    useQuery<ParkingStatusDto>({
      queryKey: ["parking", "status"],
      queryFn: async () => {
        const { data, error } = await client.GET("/api/v1/vehicles/status");
        if (error) throw error;
        return data;
      },
      // 실시간 갱신을 위한 설정
      staleTime: 0,
      cacheTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
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
      console.error("승인 상태 변경 실패:", error);
      alert("승인 상태 변경에 실패했습니다.");
      setSlidingVehicleId(null);
    },
  });

  // updateMaxCapacityMutation 수정
  const updateMaxCapacityMutation = useMutation({
    mutationFn: async (newCapacity: number) => {
      const { data, error } = await client.PATCH(
        `/api/v1/vehicles/capacity?capacity=${newCapacity}`
      );
      if (error) throw error;
      return data;
    },
    onMutate: async (newCapacity) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["parking", "status"] });

      // Snapshot the previous value
      const previousStatus = queryClient.getQueryData(["parking", "status"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["parking", "status"], (old: any) => ({
        ...old,
        totalCapacity: newCapacity,
        remainingSpace: newCapacity - (old?.activeCount || 0),
      }));

      return { previousStatus };
    },
    onSuccess: () => {
      setIsEditingCapacity(false);
    },
    onError: (_, __, context: any) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousStatus) {
        queryClient.setQueryData(["parking", "status"], context.previousStatus);
      }
      setNewCapacity(parkingStatus?.totalCapacity || 0);
    },
    onSettled: () => {
      // Always refetch after error or success to make sure our local data is correct
      queryClient.invalidateQueries({ queryKey: ["parking", "status"] });
    },
  });

  // Add this state for editing mode
  const [isEditingCapacity, setIsEditingCapacity] = useState(false);
  const [newCapacity, setNewCapacity] = useState<number>(0);

  // handleCapacityUpdate 함수 수정
  const handleCapacityUpdate = () => {
    if (!newCapacity || newCapacity <= 0) {
      alert("수용량은 1대 이상이어야 합니다.");
      return;
    }

    if (newCapacity < (parkingStatus?.activeCount || 0)) {
      alert("현재 주차된 차량 수보다 적은 수용량으로 변경할 수 없습니다.");
      return;
    }

    updateMaxCapacityMutation.mutate(newCapacity);
  };

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
          {/* 주차장 현황 섹션 */}
          <div className="mb-6 p-6 bg-white rounded-lg border border-gray-200 w-full">
            <h2 className="text-lg font-semibold mb-4">주차장 현황</h2>
            <div className="grid grid-cols-3 gap-10 max-w-[1200px] mx-auto">
              <div className="text-center p-6 bg-gray-50 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600 mb-2">전체 주차공간</p>
                {isEditingCapacity ? (
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="number"
                      value={newCapacity}
                      onChange={(e) => setNewCapacity(Number(e.target.value))}
                      className="w-20 px-2 py-1 text-2xl font-bold text-gray-900 border rounded-md"
                      min="1"
                    />
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        className="bg-[#FF4081] hover:bg-[#ff679b]"
                        onClick={() => {
                          updateMaxCapacityMutation.mutate(newCapacity);
                          setIsEditingCapacity(false);
                        }}
                      >
                        확인
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditingCapacity(false);
                          setNewCapacity(parkingStatus?.totalCapacity || 0);
                        }}
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="group relative cursor-pointer"
                    onClick={() => {
                      setIsEditingCapacity(true);
                      setNewCapacity(parkingStatus?.totalCapacity || 0);
                    }}
                  >
                    <p className="text-3xl font-bold text-gray-900">
                      {parkingStatus?.totalCapacity || 0}
                      <span className="text-base font-normal text-gray-600 ml-1">
                        면
                      </span>
                    </p>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-lg transition-colors">
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-transparent group-hover:text-gray-600 text-sm">
                        클릭하여 수정
                      </span>
                    </div>
                  </div>
                )}
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
                        key={vehicle.id} // vehicle.id만 사용하여 고유성 보장
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          router.push(
                            `/admin/addash/vehicles/ad/${vehicle.id}`
                          );
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
