"use client";

import { useState, useEffect } from "react";
import { FiEye, FiTrash2, FiMessageSquare } from "react-icons/fi";
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
} from "@/components/ui/dialog";

interface CommunityOpinion {
  id: number;
  title: string;
  userName: string;
  content: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  userRole?: string;
  replies?: {
    id: number;
    userName: string;
    reply: string;
    createdAt: string;
    userRole?: string;
  }[];
}

// Add role label mapping
const roleLabels: Record<string, string> = {
  ADMIN: "관리자",
  MANAGER: "매니저",
  USER: "일반회원",
};

// Add role color mapping
const roleColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800",
  MANAGER: "bg-orange-100 text-orange-800",
  USER: "bg-blue-100 text-blue-800",
};

const formatOpinionId = (id: number) => {
  return `OPM-${String(id).padStart(3, "0")}`;
};

export default function CommunityPage() {
  const [selectedOpinions, setSelectedOpinions] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("title");
  const [selectedOpinion, setSelectedOpinion] =
    useState<CommunityOpinion | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [opinions, setOpinions] = useState<CommunityOpinion[]>([]);
  const [newOpinion, setNewOpinion] = useState({ title: "", content: "" });
  const [newComment, setNewComment] = useState("");

  const handleDeleteOpinion = async (id: number) => {
    try {
      await client.PATCH(`/api/v1/opinions/${id}/inactive`);
      setOpinions((prev) => prev.filter((opinion) => opinion.id !== id));
    } catch (error) {
      console.error("의견 삭제 실패:", error);
      alert("의견 삭제에 실패했습니다.");
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        selectedOpinions.map((id) =>
          client.PATCH(`/api/v1/opinions/${id}/inactive`)
        )
      );
      setOpinions((prev) =>
        prev.filter((opinion) => !selectedOpinions.includes(opinion.id))
      );
      setSelectedOpinions([]);
    } catch (error) {
      console.error("일괄 삭제 실패:", error);
      alert("일부 의견 삭제에 실패했습니다.");
    }
  };

  const handleCreate = async () => {
    try {
      await client.POST("/api/v1/opinions/manager", {
        body: {
          title: newOpinion.title,
          content: newOpinion.content,
        },
      });

      // Refresh the opinions list to get complete data including username
      const { data } = await client.GET("/api/v1/opinions/manager", {});
      setOpinions(data || []);

      setIsCreateModalOpen(false);
      setNewOpinion({ title: "", content: "" });
    } catch (error) {
      console.error("의견 작성에 실패했습니다:", error);
      alert("의견 작성에 실패했습니다.");
    }
  };

  const handleViewDetails = (opinion: CommunityOpinion) => {
    setSelectedOpinion(opinion);
    setIsModalOpen(true);
  };

  const handleViewComments = async (opinion: CommunityOpinion) => {
    try {
      const { data } = await client.GET(`/api/v1/opinions/reply/${opinion.id}`);
      setSelectedOpinion({
        ...opinion,
        replies: data,
      });
      setIsCommentModalOpen(true);
    } catch (error) {
      console.error("댓글 조회 실패:", error);
      alert("댓글 조회에 실패했습니다.");
    }
  };

  const handleSubmitComment = async () => {
    if (!selectedOpinion || !newComment.trim()) return;

    try {
      await client.POST(`/api/v1/opinions/reply/${selectedOpinion.id}`, {
        body: {
          reply: newComment,
        },
      });

      // Refresh replies after submission
      const { data } = await client.GET(
        `/api/v1/opinions/reply/${selectedOpinion.id}`
      );

      setSelectedOpinion({
        ...selectedOpinion,
        replies: data,
      });

      setNewComment(""); // Clear the input
    } catch (error) {
      console.error("댓글 작성 실패:", error);
      alert("댓글 작성에 실패했습니다.");
    }
  };

  useEffect(() => {
    const fetchOpinions = async () => {
      try {
        const { data } = await client.GET("/api/v1/opinions/manager", {});
        setOpinions(data || []);
      } catch (error) {
        console.error("의견 데이터를 불러오는 데 실패했습니다:", error);
        setOpinions([]);
      }
    };

    fetchOpinions();
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOpinions(opinions.map((opinion) => opinion.id));
    } else {
      setSelectedOpinions([]);
    }
  };

  const handleSelectOpinion = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedOpinions([...selectedOpinions, id]);
    } else {
      setSelectedOpinions(
        selectedOpinions.filter((opinionId) => opinionId !== id)
      );
    }
  };

  const searchCategories = [
    { value: "title", label: "제목" },
    { value: "user", label: "작성자" },
  ];

  const filteredOpinions = opinions.filter((opinion) => {
    if (opinion.status === "INACTIVE") return false;

    const searchValue = searchQuery.toLowerCase();
    switch (searchCategory) {
      case "title":
        return opinion.title.toLowerCase().includes(searchValue);
      case "user":
        return opinion.userName.toLowerCase().includes(searchValue);
      default:
        return true;
    }
  });

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>동 대표 의견 관리</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedOpinions.length === opinions.length}
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
              <Button variant="outline" onClick={handleBulkDelete}>
                선택 항목 삭제
              </Button>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                동 대표 의견 작성
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>제목</TableHead>
                <TableHead>내용</TableHead>
                <TableHead>작성자</TableHead>
                <TableHead>작성일</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOpinions.map((opinion) => (
                <TableRow key={opinion.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedOpinions.includes(opinion.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOpinion(opinion.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>{formatOpinionId(opinion.id)}</TableCell>
                  <TableCell>{opinion.title}</TableCell>
                  <TableCell>{opinion.content}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{opinion.userName}</span>
                      {opinion.userRole && (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            roleColors[opinion.userRole]
                          }`}
                        >
                          {roleLabels[opinion.userRole] || opinion.userRole}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(
                      new Date(opinion.createdAt),
                      "yyyy년 MM월 dd일 HH:mm",
                      {
                        locale: ko,
                      }
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleViewDetails(opinion)}
                      >
                        <FiEye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleViewComments(opinion)}
                      >
                        <FiMessageSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteOpinion(opinion.id)}
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
            <DialogTitle>의견 상세 내용</DialogTitle>
          </DialogHeader>
          {selectedOpinion && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">제목</h3>
                <p>{selectedOpinion.title}</p>
              </div>
              <div>
                <h3 className="font-semibold">작성자</h3>
                <p>{selectedOpinion.userName}</p>
              </div>
              <div>
                <h3 className="font-semibold">내용</h3>
                <p className="whitespace-pre-wrap">{selectedOpinion.content}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>동 대표 의견 작성</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">제목</h3>
              <Input
                placeholder="제목을 입력하세요"
                value={newOpinion.title}
                onChange={(e) =>
                  setNewOpinion((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>
            <div>
              <h3 className="font-semibold">내용</h3>
              <textarea
                className="w-full min-h-[200px] p-2 border rounded-md"
                placeholder="내용을 입력하세요"
                value={newOpinion.content}
                onChange={(e) =>
                  setNewOpinion((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                취소
              </Button>
              <Button onClick={handleCreate}>저장</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCommentModalOpen} onOpenChange={setIsCommentModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>댓글</DialogTitle>
          </DialogHeader>
          {selectedOpinion && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">제목</h3>
                <p>{selectedOpinion.title}</p>
              </div>
              <div>
                <h3 className="font-semibold">작성자</h3>
                <p>{selectedOpinion.userName}</p>
              </div>
              <div>
                <h3 className="font-semibold">댓글 작성</h3>
                <div className="space-y-2">
                  <textarea
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="댓글을 입력하세요..."
                  />
                  <Button onClick={handleSubmitComment}>댓글 등록</Button>
                </div>
              </div>
              <div>
                <h3 className="font-semibold">댓글 목록</h3>
                {selectedOpinion.replies &&
                selectedOpinion.replies.length > 0 ? (
                  <div className="space-y-4">
                    {selectedOpinion.replies.map((reply) => (
                      <div key={reply.id} className="border p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {reply.userName}
                            </span>
                            {reply.userRole && (
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  roleColors[reply.userRole]
                                }`}
                              >
                                {roleLabels[reply.userRole] || reply.userRole}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            {format(
                              new Date(reply.createdAt),
                              "yyyy년 MM월 dd일 HH:mm",
                              { locale: ko }
                            )}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{reply.reply}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>등록된 댓글이 없습니다.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
