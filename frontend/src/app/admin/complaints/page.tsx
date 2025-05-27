"use client";

import { useState, useEffect } from "react";
import { FiEye, FiTrash2, FiEdit2, FiMessageSquare } from "react-icons/fi";
import client from "@/lib/backend/client";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Complaint {
  id: number;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  complaintStatus: "pending" | "in_progress" | "completed" | "rejected";
  user: string;
  feedbacks?: {
    feedbackId: number;
    userName: string;
    content: string;
    createAt: string;
  }[];
}

const statusOptions = [
  { value: "pending", label: "대기중" },
  { value: "in_progress", label: "처리중" },
  { value: "completed", label: "완료" },
  { value: "rejected", label: "반려" },
];

// 상태 문자열 -> 숫자 매핑 테이블
const statusToCodeMap: Record<Complaint["complaintStatus"], number> = {
  pending: 1,
  in_progress: 2,
  completed: 3,
  rejected: 4,
};

// 민원 상태 값을 한글 라벨로 매핑하는 함수수
const getStatusLabel = (
  status: Complaint["complaintStatus"] | string
): string => {
  const option = statusOptions.find((opt) => opt.value === status);
  return option ? option.label : status; // 매핑되는 라벨이 있으면 라벨 반환, 없으면 원래 값 반환
};

export default function ComplaintsPage() {
  const [selectedComplaints, setSelectedComplaints] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("title");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [newFeedback, setNewFeedback] = useState("");

  // 삭제 버튼 로직 처리리
  const handleDeleteComplaint = async (id: number) => {
    try {
      await client.PATCH(`/api/v1/complaints/${id}/inactive`);

      // 삭제 성공 시 프론트에서도 리스트에서 제거하거나 상태 변경
      setComplaints((prev) => prev.filter((complaint) => complaint.id !== id));
    } catch (error) {
      console.error("민원 삭제 실패:", error);
      alert("민원 삭제에 실패했습니다.");
    }
  };

  // 선택 항목 일괄 삭제제
  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        selectedComplaints.map((id) =>
          client.PATCH(`/api/v1/complaints/${id}/inactive`)
        )
      );
      setComplaints((prev) =>
        prev.filter((complaint) => !selectedComplaints.includes(complaint.id))
      );
      setSelectedComplaints([]);
    } catch (error) {
      console.error("일괄 삭제 실패:", error);
      alert("일부 민원 삭제에 실패했습니다.");
    }
  };

  // 모든 민원 불러오기
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const { data } = await client.GET("/api/v1/complaints/manager", {});

        const normalized = data.map((item: any) => ({
          ...item,
          complaintStatus: item.complaintStatus.toLowerCase(),
          status: item.status.toLowerCase(),
          user: item.userName,
        }));

        console.log("data : ", normalized);
        setComplaints(normalized);
      } catch (error) {
        console.error("민원 데이터를 불러오는 데 실패했습니다:", error);
      }
    };

    fetchComplaints();
  }, []);

  // 상세보기 클릭시 모달 띄우기
  const handleViewDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsModalOpen(true);
  };

  const handleViewFeedback = async (complaint: Complaint) => {
    try {
      const { data } = await client.GET(
        `/api/v1/complaint-feedbacks/${complaint.id}`
      );
      setSelectedComplaint({
        ...complaint,
        feedbacks: data,
      });
      setIsFeedbackModalOpen(true);
      console.log("피드백 : " + data);
    } catch (error) {
      console.error("피드백 조회 실패:", error);
      alert("피드백 조회에 실패했습니다.");
    }
  };

  const [complaints, setComplaints] = useState<Complaint[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedComplaints(complaints.map((complaint) => complaint.id));
    } else {
      setSelectedComplaints([]);
    }
  };

  const handleSelectComplaint = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedComplaints([...selectedComplaints, id]);
    } else {
      setSelectedComplaints(
        selectedComplaints.filter((complaintId) => complaintId !== id)
      );
    }
  };

  const handleStatusChange = async (
    id: number,
    status: Complaint["complaintStatus"]
  ) => {
    console.log("변경 시도:", id, status); // ✅ 확인용

    try {
      const statusCode = statusToCodeMap[status];
      if (statusCode === undefined) {
        console.warn("❌ 매핑 안 된 상태:", status);
        return;
      }

      console.log("✅ statusCode:", statusCode);

      await client.PATCH(
        `/api/v1/complaints/${id}/status?status=${statusCode}`
      );

      setComplaints((prev) =>
        prev.map((complaint) =>
          complaint.id === id
            ? { ...complaint, complaintStatus: status }
            : complaint
        )
      );
    } catch (error) {
      console.error("민원 상태 변경 실패:", error);
      alert("상태 변경에 실패했습니다.");
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    try {
      const statusCode =
        statusToCodeMap[status as Complaint["complaintStatus"]];
      if (statusCode === undefined) {
        console.warn("❌ 매핑 안 된 상태:", status);
        return;
      }

      // 선택된 모든 민원에 대해 상태 변경 API 호출
      await Promise.all(
        selectedComplaints.map((id) =>
          client.PATCH(
            `/api/v1/complaints/${id}/status?status=${statusCode}`,
            {}
          )
        )
      );

      // 성공 시 프론트엔드 상태 업데이트
      setComplaints(
        complaints.map((complaint) =>
          selectedComplaints.includes(complaint.id)
            ? {
                ...complaint,
                complaintStatus: status as Complaint["complaintStatus"],
              }
            : complaint
        )
      );

      // 선택 초기화
      setSelectedComplaints([]);
    } catch (error) {
      console.error("일괄 상태 변경 실패:", error);
      alert("일부 민원의 상태 변경에 실패했습니다.");
    }
  };

  const searchCategories = [
    { value: "title", label: "제목" },
    { value: "status", label: "상태" },
    { value: "user", label: "작성자" },
  ];

  const filteredComplaints = complaints
    .filter((complaint) => complaint.status !== "inactive")
    .filter((complaint) => {
      const searchValue = searchQuery.toLowerCase();
      switch (searchCategory) {
        case "title":
          return complaint.title.toLowerCase().includes(searchValue);
        case "status":
          const statusLabel = getStatusLabel(
            complaint.complaintStatus
          ).toLowerCase();
          return (
            statusLabel.includes(searchValue) ||
            complaint.complaintStatus.toLowerCase().includes(searchValue)
          );
        case "user":
          return complaint.user.toLowerCase().includes(searchValue);
        default:
          return true;
      }
    });

  const handleSubmitFeedback = async () => {
    if (!selectedComplaint || !newFeedback.trim()) return;

    try {
      await client.POST(`/api/v1/complaint-feedbacks`, {
        body: {
          complaintId: selectedComplaint.id,
          content: newFeedback,
        },
      });

      // Refresh feedbacks after submission
      const { data } = await client.GET(
        `/api/v1/complaint-feedbacks/${selectedComplaint.id}`,
        {}
      );

      setSelectedComplaint({
        ...selectedComplaint,
        feedbacks: data,
      });

      setNewFeedback(""); // Clear the input
    } catch (error) {
      console.error("피드백 작성 실패:", error);
      alert("피드백 작성에 실패했습니다.");
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>민원 관리</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedComplaints.length === complaints.length}
                onCheckedChange={handleSelectAll}
              />
              <span>전체 선택</span>
            </div>
            <div className="flex items-center gap-2">
              <Select value={searchCategory} onValueChange={setSearchCategory}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {searchCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="검색어를 입력하세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <Select onValueChange={handleBulkStatusChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="상태 변경" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleBulkDelete}>
                선택 항목 삭제
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>제목</TableHead>
                <TableHead>작성자</TableHead>
                <TableHead>작성일</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComplaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedComplaints.includes(complaint.id)}
                      onCheckedChange={(checked) =>
                        handleSelectComplaint(complaint.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>{complaint.title}</TableCell>
                  <TableCell>{complaint.user}</TableCell>
                  <TableCell>
                    {format(
                      new Date(complaint.createdAt),
                      "yyyy년 MM월 dd일 HH:mm",
                      { locale: ko }
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={complaint.complaintStatus}
                      onValueChange={(value) =>
                        handleStatusChange(complaint.id, value)
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleViewDetails(complaint)}
                      >
                        <FiEye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleViewFeedback(complaint)}
                      >
                        <FiMessageSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteComplaint(complaint.id)}
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>민원 상세 내용</DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">제목</h3>
                <p>{selectedComplaint.title}</p>
              </div>
              <div>
                <h3 className="font-semibold">작성자</h3>
                <p>{selectedComplaint.user}</p>
              </div>
              <div>
                <h3 className="font-semibold">작성일</h3>
                <p>{selectedComplaint.createdAt}</p>
              </div>
              <div>
                <h3 className="font-semibold">상태</h3>
                <p>{getStatusLabel(selectedComplaint.complaintStatus)}</p>
              </div>
              <div>
                <h3 className="font-semibold">내용</h3>
                <p className="whitespace-pre-wrap">
                  {selectedComplaint.content}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isFeedbackModalOpen} onOpenChange={setIsFeedbackModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>민원 피드백</DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">제목</h3>
                <p>{selectedComplaint.title}</p>
              </div>
              <div>
                <h3 className="font-semibold">작성자</h3>
                <p>{selectedComplaint.user}</p>
              </div>
              <div>
                <h3 className="font-semibold">피드백 작성</h3>
                <div className="space-y-2">
                  <textarea
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    value={newFeedback}
                    onChange={(e) => setNewFeedback(e.target.value)}
                    placeholder="피드백을 입력하세요..."
                  />
                  <Button onClick={handleSubmitFeedback}>피드백 등록</Button>
                </div>
              </div>
              <div>
                <h3 className="font-semibold">피드백 목록</h3>
                {selectedComplaint.feedbacks &&
                selectedComplaint.feedbacks.length > 0 ? (
                  <div className="space-y-4">
                    {selectedComplaint.feedbacks.map((feedback) => (
                      <div
                        key={feedback.feedbackId}
                        className="border p-4 rounded-lg"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">
                            {feedback.userName}
                          </span>
                          <span className="text-sm text-gray-500">
                            {format(
                              new Date(feedback.createAt),
                              "yyyy년 MM월 dd일 HH:mm",
                              { locale: ko }
                            )}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">
                          {feedback.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>등록된 피드백이 없습니다.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
