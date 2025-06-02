"use client";
import {
  ArrowLeft,
  Play,
  Square,
  User,
  CheckCircle,
  AlertCircle,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Sidebar from "@/components/sidebar";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useGlobalLoginMember } from "@/auth/loginMember";
import { Badge } from "@/components/ui/badge";

export default function InspectionDetail() {
  const router = useRouter();
  const params = useParams();
  const { loginMember } = useGlobalLoginMember();
  const [inspectionData, setInspectionData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Array<{
    id: number;
    inspectionId: number;
    userId: number;
    userName: string;
    title: string;
    description: string;
    typeName: string;
    createdAt: string;
    modifiedAt: string;
  }>>([]);
  const [issuesError, setIssuesError] = useState<string | null>(null);

  // 점검 데이터 가져오기
  useEffect(() => {
    async function fetchInspection() {
      setLoading(true);
      setError(null);
      try {
        const id = params.id;
        const res = await fetch(`/api/v1/inspection/manager/${id}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("점검 데이터를 불러오지 못했습니다.");
        const data = await res.json();
        setInspectionData(data);
      } catch (e: any) {
        setError(e.message || "알 수 없는 에러가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchInspection();
  }, [params.id]);

  // 이슈 데이터 가져오기
  useEffect(() => {
    async function fetchIssues() {
      setIssuesError(null);
      try {
        const id = params.id;
        const res = await fetch(`/api/v1/inspection/issue/show/${id}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("이슈 데이터를 불러오지 못했습니다.");
        const data = await res.json();
        setIssues(data);
      } catch (e: any) {
        console.error("이슈 데이터 로딩 중 에러:", e);
        setIssuesError(e.message || "이슈 데이터를 불러오지 못했습니다.");
        setIssues([]); // 에러 발생 시 빈 배열로 초기화
      }
    }
    if (params.id) fetchIssues();
  }, [params.id]);

  // Status style mapping based on result field
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "CHECKED":
        return {
          bgColor: "bg-green-100 dark:bg-green-900/30",
          textColor: "text-green-800 dark:text-green-300",
          icon: <CheckCircle size={16} className="mr-1" />,
          text: "정상 완료",
        };
      case "ISSUE":
        return {
          bgColor: "bg-red-100 dark:bg-red-900/30",
          textColor: "text-red-800 dark:text-red-300",
          icon: <AlertCircle size={16} className="mr-1" />,
          text: "이슈 발생",
        };
      case "PENDING":
        return {
          bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
          textColor: "text-yellow-800 dark:text-yellow-300",
          icon: <Play size={16} className="mr-1" />,
          text: "진행 중",
        };
      case "NOTYET":
        return {
          bgColor: "bg-gray-100 dark:bg-gray-800",
          textColor: "text-gray-800 dark:text-gray-300",
          icon: <Square size={16} className="mr-1" />,
          text: "예정됨",
        };
      default:
        return {
          bgColor: "bg-gray-100 dark:bg-gray-800",
          textColor: "text-gray-800 dark:text-gray-300",
          icon: <Square size={16} className="mr-1" />,
          text: "상태 미정",
        };
    }
  };

  const statusStyle = getStatusStyle(inspectionData?.result);

  // 날짜 포맷 함수 추가
  function formatDateTime(dt?: string) {
    if (!dt) return "-";
    // ISO 형식: 2025-05-28T15:30:00
    const [date, time] = dt.split("T");
    if (!date || !time) return dt;
    const [hh, mm] = time.split(":");
    return `${date}  ${hh}:${mm}`;
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">로딩 중...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      <div className="flex flex-1 flex-col bg-background">
        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto bg-background">
          {/* Header with Title and Back Button */}
          <header className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-foreground">시설점검</h2>
            {/* Back Button */}
            <Link href="/udash/inspections">
              <Button
                variant="outline"
                className="flex items-center gap-2 text-pink-600 border-pink-200 hover:bg-pink-50 hover:text-pink-700 dark:text-pink-400 dark:border-pink-900/30 dark:hover:bg-pink-950/30 dark:hover:text-pink-300"
              >
                <ArrowLeft size={16} />
                <span>점검 목록으로 돌아가기</span>
              </Button>
            </Link>
          </header>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Inspection Information (2/3 width on large screens) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Inspection Detail Header */}
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Badge variant="secondary" className="mb-2 dark:text-foreground">
                        점검 ID: {inspectionData?.inspectionId}
                      </Badge>
                      <Tag size={16} className="mr-1 text-muted-foreground dark:text-foreground" />
                      <span className="text-muted-foreground dark:text-foreground">{inspectionData?.typeName || "분류 미지정"}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">
                      {inspectionData?.title}
                    </h1>
                    <div className="mt-2 text-sm text-muted-foreground">
                      작성자: {inspectionData?.userName || "-"}
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <span
                      className={`inline-flex items-center rounded-full ${statusStyle?.bgColor} px-3 py-1 text-sm font-medium ${statusStyle?.textColor}`}
                    >
                      {statusStyle?.icon}
                      {statusStyle?.text}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border pt-4">
                  <div className="flex items-center text-sm text-muted-foreground dark:text-foreground">
                    <Play size={16} className="mr-1 flex-shrink-0" />
                    <span>
                      {formatDateTime(inspectionData?.startAt)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground dark:text-foreground">
                    <Square size={16} className="mr-1 flex-shrink-0" />
                    <span>
                      {formatDateTime(inspectionData?.finishAt)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground dark:text-foreground">
                    <User size={16} className="mr-1 flex-shrink-0" />
                    <span>
                      {inspectionData?.userName || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inspection Content */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  점검 내용
                </h2>
                <div className="space-y-4">
                  <div className="text-foreground" dangerouslySetInnerHTML={{ __html: inspectionData?.detail || '' }} />
                </div>
              </div>
            </div>

            {/* Right Column - Results */}
            <div className="space-y-6 lg:col-span-1">
              {/* Inspection Results */}
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    점검 결과
                  </h2>
                </div>
                <div className="space-y-4">
                  {inspectionData?.result === "CHECKED" ? (
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">
                          점검 완료
                        </p>
                        <p className="text-foreground">
                          점검이 정상적으로 완료되었습니다. 발견된 이슈가 있다면 아래에서 확인하실 수 있습니다.
                        </p>
                      </div>
                    </div>
                  ) : inspectionData?.result === "ISSUE" ? (
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">
                          이슈 발생
                        </p>
                        <p className="text-foreground">
                          점검 중 발견된 이슈가 있습니다. 이슈 내용을 확인하고 필요한 조치를 취해주세요.
                        </p>
                      </div>
                    </div>
                  ) : inspectionData?.result === "PENDING" ? (
                    <div className="flex items-start gap-2">
                      <Play className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">
                          점검 진행 중
                        </p>
                        <p className="text-foreground">
                          현재 점검이 진행 중입니다.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <Square className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">
                          점검 예정
                        </p>
                        <p className="text-foreground">
                          아직 점검이 시작되지 않았습니다.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-border pt-4 mt-4">
                    <h3 className="font-medium text-foreground mb-3">
                      발견된 이슈
                    </h3>
                    {issuesError ? (
                      <div className="text-sm text-muted-foreground">
                        이슈 데이터를 불러오는 중 문제가 발생했습니다
                      </div>
                    ) : issues.length > 0 ? (
                      <div className="space-y-4">
                        {issues.map((issue) => (
                          <div
                            key={issue.id}
                            className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50 dark:bg-secondary/20"
                          >
                            <AlertCircle className="h-5 w-5 text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <p className="text-foreground whitespace-pre-wrap flex-1">
                                  {issue.description}
                                </p>
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground">
                                {formatDateTime(issue.createdAt)}
                                {issue.modifiedAt !== issue.createdAt && (
                                  <span className="ml-2">(수정됨: {formatDateTime(issue.modifiedAt)})</span>
                                )}
                                <span className="ml-2">• 이슈 ID: {issue.id}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        발견된 이슈가 없습니다
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card p-6 text-center text-sm text-muted-foreground">
          © 2025 APTner. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
