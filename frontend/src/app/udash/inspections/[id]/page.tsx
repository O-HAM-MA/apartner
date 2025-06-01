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
import { useState, ChangeEvent, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { useGlobalLoginMember } from "@/auth/loginMember";
import { Badge } from "@/components/ui/badge";

export default function InspectionDetail() {
  const router = useRouter();
  const params = useParams();
  const { loginMember } = useGlobalLoginMember();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [newIssueComment, setNewIssueComment] = useState("");
  const [isAddingIssue, setIsAddingIssue] = useState(false);
  const [showEditIssueDialog, setShowEditIssueDialog] = useState(false);
  const [editingIssue, setEditingIssue] = useState<{id: number, description: string} | null>(null);
  const [editedIssueComment, setEditedIssueComment] = useState("");
  const [isUpdatingIssue, setIsUpdatingIssue] = useState(false);
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

  // Database-driven inspection data (would be replaced with API call in production)
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

  // Handle edit button click
  const handleEdit = () => {
    // Navigate to edit page with inspection ID
    router.push(`/udash/inspections/${inspectionData?.inspectionId}/edit`);
  };

  // Handle delete button click
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const id = params.id;
      const res = await fetch(`/api/v1/inspection/manager/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        let errorMessage = "점검 기록 삭제에 실패했습니다.";
        try {
          const text = await res.text();
          if (text) {
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorMessage;
          }
        } catch (e) {
          // 파싱 에러 무시
        }
        throw new Error(errorMessage);
      }

      // 삭제 성공 후 점검 목록 페이지로 리다이렉트하며 성공 상태 전달
      router.push("/udash/inspections?deleted=1");
    } catch (error: any) {
      console.error("Error deleting inspection:", error);
      alert(error.message || "점검 기록 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Handle start inspection
  const handleStart = async () => {
    setIsStarting(true);
    try {
      const id = params.id;
      const res = await fetch(`/api/v1/inspection/manager/start/${id}`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        let errorMessage = "점검 시작 처리에 실패했습니다.";
        try {
          const text = await res.text();
          if (text) {
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorMessage;
          }
        } catch (e) {
          // 파싱 에러 무시
        }
        throw new Error(errorMessage);
      }

      // 시작 성공 후 페이지 새로고침
      window.location.reload();
    } catch (error: any) {
      console.error("Error starting inspection:", error);
      alert(error.message || "점검 시작 처리 중 오류가 발생했습니다.");
    } finally {
      setIsStarting(false);
    }
  };

  // Handle complete inspection
  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const id = params.id;
      const res = await fetch(`/api/v1/inspection/manager/complete/${id}`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        let errorMessage = "점검 완료 처리에 실패했습니다.";
        try {
          const text = await res.text();
          if (text) {
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorMessage;
          }
        } catch (e) {
          // 파싱 에러 무시
        }
        throw new Error(errorMessage);
      }

      // 완료 성공 후 페이지 새로고침
      window.location.reload();
    } catch (error: any) {
      console.error("Error completing inspection:", error);
      alert(error.message || "점검 완료 처리 중 오류가 발생했습니다.");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleNewIssueCommentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setNewIssueComment(e.target.value);
  };

  const handleAddIssue = async () => {
    if (newIssueComment.trim() === "") {
      alert("이슈 내역을 등록해주세요");
      return;
    }

    setIsAddingIssue(true);
    try {
      const id = params.id;
      const res = await fetch(`/api/v1/inspection/issue/${id}/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // JWT 토큰을 위한 credentials 포함
        body: JSON.stringify({
          description: newIssueComment.trim()
        }),
      });

      if (!res.ok) {
        let errorMessage = "이슈 등록에 실패했습니다.";
        try {
          const text = await res.text();
          if (text) {
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorMessage;
          }
        } catch (e) {
          // 파싱 에러 무시
        }
        throw new Error(errorMessage);
      }

      // 성공 시 입력란 초기화하고 이슈 목록 새로고침
      setNewIssueComment("");
      // 이슈 목록 새로고침
      const issuesRes = await fetch(`/api/v1/inspection/issue/show/${id}`, {
        credentials: "include",
      });
      if (issuesRes.ok) {
        const issuesData = await issuesRes.json();
        setIssues(issuesData);
      }
    } catch (error: any) {
      console.error("Error adding issue:", error);
      alert(error.message || "이슈 등록 중 오류가 발생했습니다.");
    } finally {
      setIsAddingIssue(false);
    }
  };

  const handleEditIssue = (issue: {id: number, description: string}) => {
    setEditingIssue(issue);
    setEditedIssueComment(issue.description);
    setShowEditIssueDialog(true);
  };

  const handleUpdateIssue = async () => {
    if (!editingIssue || editedIssueComment.trim() === "") {
      alert("이슈 내역을 등록해주세요");
      return;
    }

    setIsUpdatingIssue(true);
    try {
      const res = await fetch(`/api/v1/inspection/issue/${editingIssue.id}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          description: editedIssueComment.trim()
        }),
      });

      if (!res.ok) {
        let errorMessage = "이슈 수정에 실패했습니다.";
        try {
          const text = await res.text();
          if (text) {
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorMessage;
          }
        } catch (e) {
          // 파싱 에러 무시
        }
        throw new Error(errorMessage);
      }

      // 성공 시 이슈 목록 새로고침
      const inspectionId = params.id; // 현재 점검의 ID
      const issuesRes = await fetch(`/api/v1/inspection/issue/show/${inspectionId}`, {
        credentials: "include",
      });
      if (issuesRes.ok) {
        const issuesData = await issuesRes.json();
        setIssues(issuesData);
      }

      // 모달 닫기
      setShowEditIssueDialog(false);
      setEditingIssue(null);
      setEditedIssueComment("");
    } catch (error: any) {
      console.error("Error updating issue:", error);
      alert(error.message || "이슈 수정 중 오류가 발생했습니다.");
    } finally {
      setIsUpdatingIssue(false);
    }
  };

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
            <Link href="/udash/inspections">
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
                      {loginMember?.id !== inspectionData?.userId && (
                        <span className="ml-2 text-blue-600 dark:text-blue-400">
                          (작성자만 점검을 수정할 수 있습니다)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full ${statusStyle?.bgColor} px-3 py-1 text-sm font-medium ${statusStyle?.textColor}`}
                    >
                      {statusStyle?.icon}
                      {statusStyle?.text}
                    </span>
                    {/* Edit and Delete Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:border-blue-900/30 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
                        onClick={handleEdit}
                        disabled={!inspectionData}
                      >
                        <Edit size={16} />
                        <span>편집</span>
                      </Button>
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
                  {inspectionData?.result === "NOTYET" && (
                    <Button
                      variant="default"
                      size="sm"
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleStart}
                      disabled={isStarting}
                    >
                      <Play size={16} />
                      <span>{isStarting ? "처리 중..." : "점검 바로 시작하기"}</span>
                    </Button>
                  )}
                  {inspectionData?.result === "PENDING" && (
                    <Button
                      variant="default"
                      size="sm"
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleComplete}
                      disabled={isCompleting}
                    >
                      <CheckCircle size={16} />
                      <span>{isCompleting ? "처리 중..." : "점검 완료 하기"}</span>
                    </Button>
                  )}
                  {inspectionData?.result === "ISSUE" && (
                    <Button
                      variant="default"
                      size="sm"
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleComplete}
                      disabled={isCompleting}
                    >
                      <CheckCircle size={16} />
                      <span>{isCompleting ? "처리 중..." : "이슈 해결 및 점검 완료"}</span>
                    </Button>
                  )}
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
                          점검 중 발견된 이슈가 있습니다. 이슈 내용을 확인하고 필요한 조치를 취해주세요. 이슈가 해결되면 점검을 완료할 수 있습니다.
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
                          현재 점검이 진행 중입니다. 점검이 완료되면 "점검 완료 하기" 버튼을 눌러주세요.
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
                          아직 점검이 시작되지 않았습니다. 점검을 시작하고 진행해주세요.
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                  onClick={() => handleEditIssue({id: issue.id, description: issue.description})}
                                >
                                  <Edit size={16} />
                                </Button>
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
                    {inspectionData?.result !== "CHECKED" && (
                      <div className="mt-4 space-y-2">
                        <Textarea
                          placeholder="이슈 내역을 등록해주세요"
                          value={newIssueComment}
                          onChange={handleNewIssueCommentChange}
                          className="w-full border border-border rounded-lg p-2 text-foreground bg-card"
                        />
                        <div className="flex justify-end">
                          <Button
                            className="bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-lg shadow-sm"
                            onClick={handleAddIssue}
                            disabled={isAddingIssue}
                          >
                            {isAddingIssue ? "등록 중..." : "+ 이슈 추가"}
                          </Button>
                        </div>
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
              <strong>점검 ID:</strong> {inspectionData?.check_id}
              <br />
              <strong>점검 제목:</strong> {inspectionData?.title}
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

      {/* Edit Issue Dialog */}
      <Dialog open={showEditIssueDialog} onOpenChange={setShowEditIssueDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit size={20} />
              이슈 수정
            </DialogTitle>
            <DialogDescription className="text-foreground">
              이슈 내용을 수정해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="이슈 내역을 등록해주세요"
              value={editedIssueComment}
              onChange={(e) => setEditedIssueComment(e.target.value)}
              className="w-full min-h-[200px] border border-border rounded-lg p-2 text-foreground bg-card"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditIssueDialog(false);
                setEditingIssue(null);
                setEditedIssueComment("");
              }}
              disabled={isUpdatingIssue}
              className="border-border text-foreground hover:bg-secondary"
            >
              취소
            </Button>
            <Button
              variant="default"
              onClick={handleUpdateIssue}
              disabled={isUpdatingIssue}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdatingIssue ? "수정 중..." : "수정"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
