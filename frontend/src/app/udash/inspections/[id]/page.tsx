"use client";
import {
  BellRing,
  ArrowLeft,
  Play,
  Square,
  User,
  CheckCircle,
  AlertCircle,
  Tag,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import Sidebar from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";

export default function InspectionDetail() {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newIssueComment, setNewIssueComment] = useState("");

  // Database-driven inspection data (would be replaced with API call in production)
  const inspectionData = {
    check_id: "FAC-001",
    user_id: "USER-123",
    created_at: "2023-05-10",
    updated_at: "2023-05-15",
    start_at: "2023-05-15 09:00",
    finish_at: "2023-05-15 11:30",
    type: "소방",
    detail:
      "엘레베이터 1호기에 대한 정기 점검을 실시하였습니다. 점검 결과, 모든 기능이 정상적으로 작동하고 있으며 안전 기준을 충족하고 있습니다.",
    result: "CHECKED",
    userName: "김기술",
    title: "엘레베이터 1호기 정기 점검",
  };

  // Inspection issues data (would be replaced with API call in production)
  const issueData = [
    {
      wrong_id: "ISSUE-001",
      check_id: "FAC-001",
      user_id: "USER-123",
      description:
        "2층에서 3층으로 이동 시 경미한 소음이 발생하나, 안전에는 문제가 없습니다. 다음 정기 점검 시 재확인이 필요합니다.",
      created_at: "2023-05-15 10:45",
      updated_at: "2023-05-15 11:00",
    },
  ];

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

  const statusStyle = getStatusStyle(inspectionData.result);

  // Handle edit button click
  const handleEdit = () => {
    // Navigate to edit page with inspection ID
    router.push(`/inspection-edit/${inspectionData.check_id}`);
  };

  // Handle delete button click
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Mock API call for demo purposes
      console.log(`Deleting inspection with ID: ${inspectionData.check_id}`);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Show success message (in real app, you might use a toast notification)
      alert("점검 기록이 성공적으로 삭제되었습니다.");

      // Navigate back to inspection list
      router.push("/admin-dashboard");
    } catch (error) {
      console.error("Error deleting inspection:", error);
      alert("점검 기록 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleNewIssueCommentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setNewIssueComment(e.target.value);
  };

  const handleAddIssue = () => {
    if (newIssueComment.trim() === "") {
      alert("이슈 코멘트를 입력해 주세요.");
      return;
    }
    alert("새로운 이슈 추가 기능은 준비 중입니다. 입력한 코멘트: " + newIssueComment);
    setNewIssueComment("");
  };

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      <div className="flex flex-1 flex-col bg-background">
        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto bg-background">
          {/* Header with Title, Theme Toggle and Bell Icon */}
          <header className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-foreground">시설점검</h2>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <button className="relative p-2 rounded-full hover:bg-secondary focus:outline-none">
                <BellRing size={22} className="text-muted-foreground" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-pink-500 ring-2 ring-background"></span>
              </button>
            </div>
          </header>

          {/* Back Button */}
          <div className="mb-6">
            <Link href="/admin-dashboard">
              <Button
                variant="outline"
                className="flex items-center gap-2 text-pink-600 border-pink-200 hover:bg-pink-50 hover:text-pink-700 dark:text-pink-400 dark:border-pink-900/30 dark:hover:bg-pink-950/30 dark:hover:text-pink-300"
              >
                <ArrowLeft size={16} />
                <span>점검 목록으로 돌아가기</span>
              </Button>
            </Link>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Inspection Information (2/3 width on large screens) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Inspection Detail Header */}
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <span>점검 ID: {inspectionData.check_id}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-xs font-medium">
                        <Tag size={12} />
                        {inspectionData.type}
                      </span>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">
                      {inspectionData.title}
                    </h1>
                  </div>
                  <div className="mt-4 md:mt-0 flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full ${statusStyle.bgColor} px-3 py-1 text-sm font-medium ${statusStyle.textColor}`}
                    >
                      {statusStyle.icon}
                      {statusStyle.text}
                    </span>
                    {/* Edit and Delete Buttons */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/udash/inspections/${inspectionData.check_id}/edit`}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:border-blue-900/30 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
                        >
                          <Edit size={16} />
                          <span>편집</span>
                        </Button>
                      </Link>
                      <Button
                        onClick={() => setShowDeleteDialog(true)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-900/30 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                      >
                        <Trash2 size={16} />
                        <span>삭제</span>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border pt-4">
                  <div className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <div className="text-sm text-muted-foreground">
                        점검 시작
                      </div>
                      <div className="font-medium text-foreground">
                        {inspectionData.start_at}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Square className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <div>
                      <div className="text-sm text-muted-foreground">
                        점검 종료
                      </div>
                      <div className="font-medium text-foreground">
                        {inspectionData.finish_at}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">
                        담당자
                      </div>
                      <div className="font-medium text-foreground">
                        {inspectionData.userName}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inspection Content */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  점검 내용
                </h2>
                <div className="space-y-4">
                  <p className="text-foreground">{inspectionData.detail}</p>
                  <div className="border-t border-border pt-4">
                    <h3 className="font-medium text-foreground mb-2">
                      점검 항목
                    </h3>
                    <ul className="list-disc pl-5 space-y-2 text-foreground">
                      <li>엘레베이터 작동 상태 확인</li>
                      <li>안전장치 작동 여부 확인</li>
                      <li>비상 통신 시스템 점검</li>
                      <li>도어 센서 및 개폐 시스템 점검</li>
                      <li>케이블 및 기계 장치 점검</li>
                      <li>소음 및 진동 상태 확인</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Results and Metadata (1/3 width on large screens) */}
            <div className="space-y-6">
              {/* Inspection Results */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  점검 결과
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">
                        모든 기능 정상 작동
                      </p>
                      <p className="text-foreground">
                        엘레베이터의 모든 기능이 정상적으로 작동하고 있습니다.
                      </p>
                    </div>
                  </div>

                  {issueData.length > 0 && (
                    <div className="border-t border-border pt-4 mt-4">
                      <h3 className="font-medium text-foreground mb-3">
                        발견된 이슈
                      </h3>
                      {issueData.map((issue) => (
                        <div
                          key={issue.wrong_id}
                          className="flex items-start gap-2 mb-3 pb-3 border-b border-border last:border-0 last:mb-0 last:pb-0"
                        >
                          <AlertCircle className="h-5 w-5 text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-foreground">
                              경미한 소음 발생
                            </p>
                            <p className="text-foreground">
                              {issue.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              보고 시간: {issue.created_at}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div className="mt-4 space-y-2">
                        <Textarea
                          placeholder="새로운 이슈 코멘트를 입력하세요"
                          value={newIssueComment}
                          onChange={handleNewIssueCommentChange}
                          className="w-full border border-border rounded-lg p-2 text-foreground bg-card"
                        />
                        <div className="flex justify-end">
                          <Button
                            className="bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-lg shadow-sm"
                            onClick={handleAddIssue}
                          >
                            + 이슈 추가
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  점검 메타데이터
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">생성일</span>
                    <span className="text-foreground font-medium">
                      {inspectionData.created_at}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">최종 수정일</span>
                    <span className="text-foreground font-medium">
                      {inspectionData.updated_at}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">점검자 ID</span>
                    <span className="text-foreground font-medium">
                      {inspectionData.user_id}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">점검 상태</span>
                    <span className={`${statusStyle.textColor} font-medium`}>
                      {statusStyle.text}
                    </span>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash2 size={20} />
              점검 기록 삭제
            </DialogTitle>
            <DialogDescription className="text-foreground">
              정말로 이 점검 기록을 삭제하시겠습니까?
              <br />
              <br />
              <strong>점검 ID:</strong> {inspectionData.check_id}
              <br />
              <strong>점검 제목:</strong> {inspectionData.title}
              <br />
              <br />
              <span className="text-red-600 dark:text-red-400 font-medium">
                이 작업은 되돌릴 수 없습니다.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
              className="border-border text-foreground hover:bg-secondary"
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
