"use client";

import { useQuery } from "@tanstack/react-query";
import client from "@/lib/backend/client";
import { components } from "@/lib/backend/apiV1/schema";
import Header from "@/components/header";
import Footer from "@/components/footer";

type VehicleRegistrationInfoDto =
  components["schemas"]["VehicleRegistrationInfoDto"];
type EntryRecordResponseDto = components["schemas"]["EntryRecordResponseDto"];

export default function VehicleDetail({
  params,
}: {
  params: { vehicleId: string };
}) {
  // 차량 상세 정보 조회
  const { data: vehicle } = useQuery<VehicleRegistrationInfoDto>({
    queryKey: ["vehicle", params.vehicleId],
    queryFn: async () => {
      const { data, error } = await client.GET(
        `/api/v1/vehicles/registrationsWithStatus/${params.vehicleId}`
      );
      if (error) throw error;
      return data;
    },
  });

  // 출입 기록 조회
  const { data: entryRecords } = useQuery<EntryRecordResponseDto[]>({
    queryKey: ["entryRecords", params.vehicleId],
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
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-6">차량 상세 정보</h1>

          {/* 차량 상세 정보 */}
          <div className="grid grid-cols-2 gap-6 mb-8">
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
                  {vehicle?.registerType}
                </p>
                <p>
                  <span className="font-medium">차주명:</span>{" "}
                  {vehicle?.applicantName}
                </p>
                <p>
                  <span className="font-medium">연락처:</span>{" "}
                  {vehicle?.userPhone}
                </p>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-4">주소 정보</h2>
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

          {/* 출입 기록 */}
          <div>
            <h2 className="text-lg font-semibold mb-4">출입 기록</h2>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2">출입 시간</th>
                  <th className="px-4 py-2">퇴출 시간</th>
                  <th className="px-4 py-2">상태</th>
                </tr>
              </thead>
              <tbody>
                {entryRecords?.map((record) => (
                  <tr key={record.vehicleId} className="border-b">
                    <td className="px-4 py-2">{record.entryTime}</td>
                    <td className="px-4 py-2">{record.exitTime || "-"}</td>
                    <td className="px-4 py-2">{record.status}</td>
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
