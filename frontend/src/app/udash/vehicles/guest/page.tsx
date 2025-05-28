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
import { Badge } from "@/components/ui/badge";

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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const registerMutation = useMutation({
    mutationFn: (data: ForeignVehicleRequestDto) => {
      console.log("외부 차량 등록 요청 데이터:", data);
      return client.POST("/api/v1/vehicles/foreigns", {
        body: data, // json 대신 body 사용
      });
    },
    onSuccess: () => {
      alert("차량이 등록되었습니다."); // toast 대신 alert 사용
      //router.push("/udash/vehicles"); // 등록 후 차량 목록 페이지로 이동
    },
    onError: (error) => {
      console.error("외부 차량 등록 실패:", error);
      alert("차량 등록에 실패했습니다.");
    },
  });

  const { data: recentVehicles, isLoading } = useQuery<
    VehicleRegistrationInfoDto[]
  >({
    queryKey: ["vehicles", "recent-foreigns"],
    queryFn: async () => {
      const { data, error } = await client.GET(
        "/api/v1/vehicles/registrationsWithStatus"
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaginatedData = (data: VehicleRegistrationInfoDto[] = []) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Add Recent Foreign Vehicles Table */}
        <div className="max-w-2xl mx-auto mb-8">
          <h2 className="text-xl font-semibold mb-4">
            24시간 내 등록된 외부 차량
          </h2>
          <div className="bg-white rounded-lg shadow-sm p-6">
            {isLoading ? (
              <div className="text-center py-4">로딩중...</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">차량번호</th>
                        <th className="text-left p-4 font-medium">차종</th>
                        <th className="text-left p-4 font-medium">상태</th>
                        <th className="text-left p-4 font-medium">등록시간</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {getPaginatedData(recentVehicles)?.map((vehicle) => (
                        <tr key={vehicle.id} className="hover:bg-gray-50">
                          <td className="p-4">{vehicle.vehicleNum}</td>
                          <td className="p-4">{vehicle.type}</td>
                          <td className="p-4">
                            <StatusBadge status={vehicle.status} />
                          </td>
                          <td className="p-4">
                            {formatDate(vehicle.createdAt)}
                          </td>
                        </tr>
                      ))}
                      {!recentVehicles?.length && (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-center py-8 text-gray-500"
                          >
                            24시간 내 등록된 외부 차량이 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {recentVehicles && recentVehicles.length > itemsPerPage && (
                  <div className="mt-4 flex justify-center">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={Math.ceil(
                        recentVehicles.length / itemsPerPage
                      )}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Existing registration form */}
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">외부 차량 등록</h1>
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
                    placeholder="예: 1001"
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

// Add StatusBadge component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "AGREE":
        return "bg-green-100 text-green-800";
      case "INAGREE":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "INVITER_AGREE":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "AGREE":
        return "승인됨";
      case "INAGREE":
        return "미승인";
      case "PENDING":
        return "대기중";
      case "INVITER_AGREE":
        return "초대자 승인";
      default:
        return "알 수 없음";
    }
  };

  return (
    <Badge className={getStatusStyle(status)}>{getStatusText(status)}</Badge>
  );
};
