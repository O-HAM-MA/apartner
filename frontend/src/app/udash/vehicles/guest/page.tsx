"use client";

import * as React from "react";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { components } from "@/lib/backend/apiV1/schema";
import client from "@/lib/backend/client";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type ForeignVehicleRequestDto =
  components["schemas"]["ForeignVehicleRequestDto"];

export default function GuestVehicleRegistration() {
  const router = useRouter();
  const [formData, setFormData] = useState<ForeignVehicleRequestDto>({
    vehicleNum: "",
    type: "",
    phone: "",
    reason: "",
    apartmentName: "",
    buildingNum: "",
    unitNum: "",
  });

  const registerMutation = useMutation({
    mutationFn: (data: ForeignVehicleRequestDto) => {
      console.log("외부 차량 등록 요청 데이터:", data);
      return client.POST("/api/v1/vehicles/foreigns", {
        body: data,
      });
    },
    onSuccess: () => {
      alert("차량이 등록되었습니다.");
      // 폼 초기화
      setFormData({
        vehicleNum: "",
        type: "",
        phone: "",
        reason: "",
        apartmentName: "",
        buildingNum: "",
        unitNum: "",
      });
    },
    onError: (error) => {
      console.error("외부 차량 등록 실패:", error);
      alert("차량 등록에 실패했습니다.");
    },
  });

  const { data: foreignVehicles, isLoading } = useQuery({
    queryKey: ["vehicles", "foreigns"],
    queryFn: async () => {
      const { data, error } = await client.GET(
        "/api/v1/vehicles/registrationsForeignsWithStatus"
      );
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* 외부 차량 목록 테이블 추가 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">등록된 외부 차량 목록</h2>
          {isLoading ? (
            <div className="text-center py-4">데이터를 불러오는 중...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      차량 번호
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      차종
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      방문 사유
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      승인 상태
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      등록 시간
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {foreignVehicles?.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm">
                        {vehicle.vehicleNum}
                      </td>
                      <td className="px-4 py-4 text-sm">{vehicle.type}</td>
                      <td className="px-4 py-4 text-sm">
                        {vehicle.reason || "-"}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={vehicle.status} />
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {formatDate(vehicle.createdAt)}
                      </td>
                    </tr>
                  ))}
                  {!foreignVehicles?.length && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        등록된 외부 차량이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 기존 폼 유지 */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">외부 차량 등록</h2>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="vehicleNum">차량 번호</Label>
                  <Input
                    id="vehicleNum"
                    name="vehicleNum"
                    value={formData.vehicleNum}
                    onChange={handleChange}
                    placeholder="예: 12가3456"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">차종</Label>
                  <Input
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    placeholder="예: 소나타"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">연락처</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="예: 01012345678"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">방문 사유</Label>
                <Input
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="방문 사유를 입력해주세요"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apartmentName">아파트명</Label>
                  <Input
                    id="apartmentName"
                    name="apartmentName"
                    value={formData.apartmentName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buildingNum">동</Label>
                  <Input
                    id="buildingNum"
                    name="buildingNum"
                    value={formData.buildingNum}
                    onChange={handleChange}
                    placeholder="예: 101"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitNum">호</Label>
                  <Input
                    id="unitNum"
                    name="unitNum"
                    value={formData.unitNum}
                    onChange={handleChange}
                    placeholder="예: 101"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="bg-[#FF4081] hover:bg-[#ff679b]"
                >
                  {registerMutation.isPending ? "등록 중..." : "등록하기"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// 상태 배지 컴포넌트
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "AGREE":
        return { label: "승인됨", className: "bg-green-100 text-green-800" };
      case "INAGREE":
        return { label: "미승인", className: "bg-red-100 text-red-800" };
      case "PENDING":
        return { label: "대기중", className: "bg-yellow-100 text-yellow-800" };
      case "INVITER_AGREE":
        return { label: "초대자 승인", className: "bg-blue-100 text-blue-800" };
      default:
        return { label: "알 수 없음", className: "bg-gray-100 text-gray-800" };
    }
  };

  const statusInfo = getStatusInfo(status);
  return (
    <span className={`px-2 py-1 text-sm rounded-full ${statusInfo.className}`}>
      {statusInfo.label}
    </span>
  );
};
