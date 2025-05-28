"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import client from "@/lib/backend/client";
import { components } from "@/lib/backend/apiV1/schema";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type VehicleRegistrationInfoDto =
  components["schemas"]["VehicleRegistrationInfoDto"];
type EntryRecordResponseDto = components["schemas"]["EntryRecordResponseDto"];

export default function VehicleDetailPage({
  params,
}: {
  params: { vehicleId: string };
}) {
  const vehicleId = React.use(params).vehicleId;

  // 차량 상세 정보 조회
  const { data: vehicle } = useQuery<VehicleRegistrationInfoDto>({
    queryKey: ["vehicles", vehicleId],
    queryFn: async () => {
      const { data, error } = await client.GET(
        `/api/v1/vehicles/registrationsWithStatus`
      );
      if (error) throw error;

      // 모든 차량 중에서 해당 ID의 차량 찾기
      const foundVehicle = data.find((v) => v.id === Number(vehicleId));
      if (!foundVehicle) throw new Error("Vehicle not found");

      return foundVehicle;
    },
  });

  // 출입 기록 조회
  const { data: records } = useQuery<EntryRecordResponseDto[]>({
    queryKey: ["vehicle", "records", params.vehicleId],
    queryFn: async () => {
      const { data, error } = await client.GET(
        `/api/v1/entry-records/${params.vehicleId}`
      );
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* 상단 버튼과 제목 */}
        <div className="mb-6">
          <Link href="/admin/addash/vehicles">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로 돌아가기
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">차량 상세 정보</h1>
        </div>

        {/* 차량 상세 정보 카드 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-2 gap-6">
            {/* 차량 기본 정보 */}
            <div>
              <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
              <div className="space-y-3">
                <p>
                  <span className="font-medium">차량번호:</span>{" "}
                  {vehicle?.vehicleNum}
                </p>
                <p>
                  <span className="font-medium">차종:</span> {vehicle?.type}
                </p>
                <p>
                  <span className="font-medium">등록유형:</span>{" "}
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      vehicle?.registerType === "거주자"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {vehicle?.registerType}
                  </span>
                </p>
                <p>
                  <span className="font-medium">
                    {vehicle?.registerType === "거주자"
                      ? "차주명:"
                      : "방문사유:"}
                  </span>{" "}
                  <span
                    className={
                      vehicle?.applicantName === "탈퇴한 사용자"
                        ? "text-red-600"
                        : ""
                    }
                  >
                    {vehicle?.applicantName}
                  </span>
                </p>
                <p>
                  <span className="font-medium">연락처:</span>{" "}
                  {vehicle?.userPhone}
                </p>
              </div>
            </div>

            {/* 주소 정보 */}
            <div>
              <h2 className="text-lg font-semibold mb-4">
                {vehicle?.registerType === "거주자"
                  ? "입주민 주소 정보"
                  : "방문 주소 정보"}
              </h2>
              <div className="space-y-3">
                <p>
                  <span className="font-medium">아파트:</span>{" "}
                  {vehicle?.apartmentName}
                </p>
                <p>
                  <span className="font-medium">동:</span>{" "}
                  {vehicle?.buildingName}
                </p>
                <p>
                  <span className="font-medium">호:</span> {vehicle?.unitName}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 출입 기록 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <h2 className="text-lg font-semibold p-6 border-b">출입 기록</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    입차 시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    출차 시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records?.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.entryTime
                        ? new Date(record.entryTime).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.exitTime
                        ? new Date(record.exitTime).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === "AGREE"
                            ? "bg-green-100 text-green-800"
                            : record.status === "INVITER_AGREE"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {record.status === "AGREE"
                          ? " 최종 승인"
                          : record.status === "INVITER_AGREE"
                          ? "입주민 승인"
                          : "미승인"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
