"use client";
import {
  BellRing,
  ChevronDown,
  FileEdit,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Sidebar from "@/components/sidebar";
import { useState, useEffect } from "react";


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
  startAt: string;      // LocalDateTime → string (ISO 포맷 등)
  finishAt: string;     // LocalDateTime → string (ISO 포맷 등)
  title: string;
  detail: string;
  result: "CHECKED" | "PENDING" | "NOTYET" |"ISSUE";
  typeName: string;
};

export default function AdminDashboard() {
  const [inspections, setInspections] = useState([]);
  const [activeTab, setActiveTab] = useState("inspections");
  const [issues, setIssues] = useState<IssueResponseDetailDto[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (tab === "issues") {
      setIsLoadingIssues(true);
      setTimeout(() => {
        const mockIssues = [
          { id: 1, inspectionId: 1, userId: 1, userName: "김기술", title: "엘레베이터 1호기 소음", description: "2층에서 3층 이동 시 경미한 소음 발생", typeName: "소방", createdAt: "2023-05-15 10:45", modifiedAt: "2023-05-15 11:00" },
          { id: 2, inspectionId: 2, userId: 2, userName: "이점검", title: "비상 통신 시스템 점검", description: "비상 통신 시스템 점검 중 일부 통신 불안정", typeName: "소방", createdAt: "2023-05-16 09:00", modifiedAt: "2023-05-16 09:30" }
        ];
        setIssues(mockIssues);
        setIsLoadingIssues(false);
      }, 1000);
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
              <div className="inline-flex items-center rounded-md border border-border bg-card shadow-sm">
                <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-foreground">
                  전체 시설
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
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
                inspections.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {inspections.map((inspection) => (
                      <Link key={inspection.check_id} href={`/udash/inspections/${inspection.check_id}`}>
                        <div className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-xs font-medium">
                              <Tag size={12} />
                              {inspection.type}
                            </span>
                            <span className={`inline-flex items-center rounded-full ${getStatusStyle(inspection.result).bgColor} px-2 py-0.5 text-xs font-medium ${getStatusStyle(inspection.result).textColor}`}>
                              {getStatusStyle(inspection.result).icon}
                              {getStatusStyle(inspection.result).text}
                            </span>
                          </div>
                          <h3 className="font-bold text-foreground mb-1">{inspection.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{inspection.detail}</p>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>시작: {inspection.start_at}</span>
                            <span>종료: {inspection.finish_at}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">등록된 점검 내역이 없습니다.</p>
                )
              ) : (
                isLoadingIssues ? (
                  <p className="text-center text-muted-foreground">이슈 목록을 불러오는 중입니다...</p>
                ) : issues.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {issues.map((issue) => (
                      <div key={issue.id} className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-xs font-medium">
                            {issue.typeName}
                          </span>
                          <span className="text-xs text-muted-foreground">(inspection ID: {issue.inspectionId})</span>
                        </div>
                        <h3 className="font-bold text-foreground mb-1">{issue.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>작성자: {issue.userName}</span>
                          <span>생성: {issue.createdAt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">등록된 이슈 내역이 없습니다.</p>
                )
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-border bg-card px-4 py-3">
              <div className="text-sm text-muted-foreground">
                총 24개 항목 중 1-6 표시
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-md border-border bg-card text-muted-foreground hover:bg-secondary"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronDown className="h-4 w-4 rotate-90" />
                </Button>
                <Button
                  size="sm"
                  className="h-8 min-w-8 rounded-md bg-pink-500 px-3 text-white hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700"
                >
                  1
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 min-w-8 rounded-md border-border bg-card px-3 text-muted-foreground hover:bg-secondary"
                >
                  2
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 min-w-8 rounded-md border-border bg-card px-3 text-muted-foreground hover:bg-secondary"
                >
                  3
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 min-w-8 rounded-md border-border bg-card px-3 text-muted-foreground hover:bg-secondary"
                >
                  4
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-md border-border bg-card text-muted-foreground hover:bg-secondary"
                >
                  <span className="sr-only">Next</span>
                  <ChevronDown className="h-4 w-4 -rotate-90" />
                </Button>
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
