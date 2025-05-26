"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import client from "@/lib/backend/client";
import { components } from "@/lib/backend/apiV1/schema";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type EntryRecordResponseDto = components["schemas"]["EntryRecordResponseDto"];

export default function VehicleDetailPage({
  params,
}: {
  params: { vehicleId: string };
}) {
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
    <div className="container mx-auto p-8">
      <div className="mb-6">
        <Link href="/udash/vehicles">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">차량 출입 기록</h1>
      </div>

      <div className="bg-white rounded-lg shadow">
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
                <tr key={index}>
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
                      className={`px-2 py-1 rounded-full text-xs ${
                        record.status === "AGREE"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
