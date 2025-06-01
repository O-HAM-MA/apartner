"use client";
import {
  BellRing,
  ChevronDown,
  FileEdit,
  Plus,
  Search,
  Trash2,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Sidebar from "@/components/sidebar";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import InspectionTypeManagementModal from "@/components/InspectionTypeManagementModal";


// 날짜 포맷 함수
const formatDateTime = (dateTimeString: string) => {
  if (!dateTimeString) return "-";
  try {
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (error) {
    console.error("Invalid date string:", dateTimeString);
    return "Invalid Date";
  }
};

type IssueResponseDetailDto = {
  id: number;
  inspectionId: number;
  userId: number;
  userName: string;
  title: string;
  description: string;
  typeName: string;
  createdAt: string;
  modifiedAt: string;
};

type Inspection = {
  inspectionId: number;
  userId: number;
  userName: string;
  startAt: string;
  finishAt: string;
  title: string;
  detail: string;
  result: "CHECKED" | "PENDING" | "NOTYET" | "ISSUE";
  typeName: string;
};

function getStatusStyle(result: string) {
  switch (result) {
    case "CHECKED":
      return {
        bgColor: "bg-green-100",
        textColor: "text-green-800",
        icon: "✅",
        text: "정상 완료",
      };
    case "PENDING":
      return {
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800",
        icon: "⏳",
        text: "진행 중",
      };
    case "NOTYET":
      return {
        bgColor: "bg-gray-100",
        textColor: "text-gray-800",
        icon: "🕒",
        text: "예정됨",
      };
    case "ISSUE":
      return {
        bgColor: "bg-orange-100",
        textColor: "text-orange-800",
        icon: "⚠️",
        text: "이슈 있음",
      };
    default:
      return {
        bgColor: "bg-gray-100",
        textColor: "text-gray-800",
        icon: "❓",
        text: "상태 미정",
      };
  }
}

export default function AdminDashboard() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [activeTab, setActiveTab] = useState("inspections");
  const [issues, setIssues] = useState<IssueResponseDetailDto[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [isTypeManagementModalOpen, setIsTypeManagementModalOpen] = useState(false);
  const [issuesError, setIssuesError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    async function fetchInspections() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/inspection/manager?page=${currentPage}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("서버에서 데이터를 불러오지 못했습니다.");

        const pageData = await res.json();
        setInspections(pageData.content);
        setTotalPages(pageData.totalPages);
        setTotalElements(pageData.totalElements);

      } catch (e: any) {
        setError(e.message || "알 수 없는 에러가 발생했습니다.");
        setInspections([]);
        setTotalPages(0);
        setTotalElements(0);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInspections();
  }, [currentPage]);

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      setShowSuccessModal(true);
      const timer = setTimeout(() => setShowSuccessModal(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("deleted") === "1") {
      setShowDeleteSuccessModal(true);
      const timer = setTimeout(() => setShowDeleteSuccessModal(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleTabClick = async (tab: string) => {
    setActiveTab(tab);
    if (tab === "issues") {
      setIsLoadingIssues(true);
      setIssuesError(null);
      try {
        const res = await fetch('/api/v1/inspection/issue/show_all', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          let errorMessage = '이슈 목록을 불러오는데 실패했습니다.';
          try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            const text = await res.text();
            errorMessage = text || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const data: IssueResponseDetailDto[] = await res.json();
        setIssues(data);

      } catch (err: any) {
        console.error('Failed to fetch all issues:', err);
        setIssuesError(err.message || '이슈 데이터를 불러오는 중 오류가 발생했습니다.');
        setIssues([]);
      } finally {
        setIsLoadingIssues(false);
      }
    } else {
      setIssues([]);
    }
  };

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      <div className="flex flex-1 flex-col bg-background">
        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto bg-background">
          {/* Header with Title and Bell Icon */}
          <header className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-foreground">시설점검</h2>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTypeManagementModalOpen(true)}
              >
                분류 관리
              </Button>
              <button className="relative p-2 rounded-full hover:bg-secondary focus:outline-none">
                <BellRing size={22} className="text-muted-foreground" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-pink-500 ring-2 ring-background"></span>
              </button>
            </div>
          </header>

          {/* Tab Navigation */}
          <div className="flex border-b border-border mb-6">
            <button
              onClick={() => handleTabClick("inspections")}
              className={`px-4 py-2 font-semibold ${activeTab === "inspections" ? "text-pink-600 border-b-2 border-pink-600" : "text-muted-foreground hover:text-foreground"}`}
            >
              점검 내역
            </button>
            <button
              onClick={() => handleTabClick("issues")}
              className={`px-4 py-2 font-semibold ${activeTab === "issues" ? "text-pink-600 border-b-2 border-pink-600" : "text-muted-foreground hover:text-foreground"}`}
            >
              이슈 내역 보기
            </button>
          </div>

          {/* Filters and Actions */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {/* "전체 시설" 필터 제거 */}
              {/*
              <div className="inline-flex items-center rounded-md border border-border bg-card shadow-sm">
                <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-foreground">
                  전체 시설
                </button>
              </div>
              */}
              <div className="inline-flex items-center rounded-md border border-border bg-card shadow-sm">
                <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-foreground">
                  전체 상태
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="점검명 검색"
                  className="w-full rounded-md border border-border bg-card pl-9 md:w-[240px] text-foreground"
                />
              </div>
              <Link href="/udash/inspections/new">
                <Button className="bg-pink-500 text-white hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700 dark:text-white">
                  <Plus className="mr-1 h-4 w-4" />
                  점검 추가
                </Button>
              </Link>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              {activeTab === "inspections" ? (
                isLoading ? (
                  <div className="text-center py-10 text-muted-foreground">로딩 중...</div>
                ) : error ? (
                  <div className="text-center py-10 text-red-500">{error}</div>
                ) : inspections.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="px-4 py-3 text-left">일정 ID</th>
                          <th className="px-4 py-3 text-left">점검 제목</th>
                          <th className="px-4 py-3 text-center">점검 시작 시간</th>
                          <th className="px-4 py-3 text-center">점검 종료 예상 시간</th>
                          <th className="px-4 py-3 text-center">작업 상태</th>
                          <th className="px-4 py-3 text-center">담당자</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspections.map((inspection) => {
                          return (
                            <tr key={inspection.inspectionId} className="border-b border-border hover:bg-secondary/30 transition-colors">
                              <td className="px-4 py-3 text-left font-medium">{inspection.inspectionId}</td>
                              <td className="px-4 py-3 text-left">
                                <Link href={`/udash/inspections/${inspection.inspectionId}`} className="text-pink-500 hover:underline">
                                  {inspection.title}
                                </Link>
                              </td>
                              <td className="px-4 py-3 text-center">{formatDateTime(inspection.startAt)}</td>
                              <td className="px-4 py-3 text-center">{formatDateTime(inspection.finishAt)}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center rounded-full ${getStatusStyle(inspection.result).bgColor} px-2 py-0.5 text-xs font-medium ${getStatusStyle(inspection.result).textColor}`}>
                                  {getStatusStyle(inspection.result).text}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">{inspection.userName}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">등록된 점검 내역이 없습니다.</div>
                )
              ) : activeTab === "issues" ? (
                isLoadingIssues ? (
                  <div className="text-center py-10 text-muted-foreground">이슈 목록을 불러오는 중입니다...</div>
                ) : issuesError ? (
                  <div className="text-center py-10 text-red-500">{issuesError}</div>
                ) : issues.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                    {issues.map((issue) => (
                      <div key={issue.id} className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-xs font-medium">
                            {issue.typeName}
                          </span>
                          <span className="text-xs text-muted-foreground">이슈 ID: {issue.id}</span>
                        </div>
                        <h3 className="font-bold text-foreground mb-1">
                          점검 제목: <Link href={`/udash/inspections/${issue.inspectionId}`} className="text-pink-500 hover:underline">{issue.title || '제목 없음'}</Link>
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">{issue.description}</p>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>작성자: {issue.userName || '알 수 없음'}</span>
                          <span>생성: {formatDateTime(issue.createdAt)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {issue.modifiedAt !== issue.createdAt && issue.modifiedAt !== null && (
                            <span className="mr-4">수정: {formatDateTime(issue.modifiedAt)}</span>
                          )}
                          <span>점검 ID: {issue.inspectionId}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-10">발견된 이슈가 없습니다.</div>
                )
              ) : null /* activeTab이 inspections 또는 issues가 아닐 경우 */}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-border bg-card px-4 py-3">
              <div className="text-sm text-muted-foreground">
                총 {totalElements}개 항목 중 {(currentPage - 1) * 6 + 1}-{Math.min(currentPage * 6, totalElements)} 표시
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-md border-border bg-card text-muted-foreground hover:bg-secondary"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronDown className="h-4 w-4 rotate-90" />
                </Button>
                <span className="text-sm font-medium text-foreground">
                  {currentPage} / {totalPages === 0 ? 1 : totalPages} 페이지
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-md border-border bg-card text-muted-foreground hover:bg-secondary"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage === totalPages || totalPages === 0 || isLoading}
                >
                  <span className="sr-only">Next</span>
                  <ChevronDown className="h-4 w-4 -rotate-90" />
                </Button>
              </div>
            </div>
          </div>

          {/* 등록 성공 모달 */}
          {showSuccessModal && (
            <div className="fixed top-8 right-8 z-50 bg-green-500 text-white px-6 py-3 rounded shadow-lg text-sm animate-fade-in-out">
              점검이 성공적으로 등록되었습니다.
            </div>
          )}
          {/* 삭제 성공 모달 */}
          {showDeleteSuccessModal && (
            <div className="fixed top-8 right-8 z-50 bg-red-500 text-white px-6 py-3 rounded shadow-lg text-sm animate-fade-in-out">
              점검 기록이 성공적으로 삭제되었습니다.
            </div>
          )}
          {/* Type Management Modal */}
          <InspectionTypeManagementModal
            isOpen={isTypeManagementModalOpen}
            onClose={() => setIsTypeManagementModalOpen(false)}
          />
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card p-6 text-center text-sm text-muted-foreground">
          © 2025 APTner. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
