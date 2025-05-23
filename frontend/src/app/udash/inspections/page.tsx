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

export default function AdminDashboard() {
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
          <div className="border-b border-border bg-card mb-6 rounded-t-lg shadow-sm">
            <div className="flex overflow-x-auto">
              <button className="border-b-2 border-pink-500 px-4 py-4 text-sm font-medium text-pink-600 dark:text-pink-400">
                점검 일정
              </button>
              <button className="px-4 py-4 text-sm font-medium text-muted-foreground hover:text-foreground">
                이슈 내역
              </button>
            </div>
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
              <Link href="/inspection-register">
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
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/50 text-left text-sm font-medium text-muted-foreground">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-input"
                      />
                    </th>
                    <th className="whitespace-nowrap px-4 py-3">일정 ID</th>
                    <th className="whitespace-nowrap px-4 py-3">점검 제목</th>
                    <th className="whitespace-nowrap px-4 py-3">
                      점검 시작 시간
                    </th>
                    <th className="whitespace-nowrap px-4 py-3">
                      점검 종료 예상 시간
                    </th>
                    <th className="whitespace-nowrap px-4 py-3">작업 상태</th>
                    <th className="whitespace-nowrap px-4 py-3">담당자</th>
                    <th className="whitespace-nowrap px-4 py-3">작업</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border text-sm text-foreground hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-input"
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">
                      FAC-001
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link
                        href="/udash/inspections/1"
                        className="text-pink-600 hover:text-pink-700 hover:underline dark:text-pink-400 dark:hover:text-pink-300"
                      >
                        엘레베이터 1호기 정기 점검
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">2023-05-15</td>
                    <td className="whitespace-nowrap px-4 py-3">2023-05-15</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
                        정상 완료
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">김기술</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-secondary/70"
                        >
                          <FileEdit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-secondary/70"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {/* Additional rows would go here */}
                </tbody>
              </table>
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
