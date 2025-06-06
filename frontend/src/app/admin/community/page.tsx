"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Eye,
  User,
  Calendar,
  MessageSquare,
  ImageIcon,
  ChevronRight,
  Trash2,
  Edit,
} from "lucide-react";
import client from "@/lib/backend/client";
import { components } from "@/lib/backend/apiV1/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useGlobalLoginMember } from "@/auth/loginMember";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// 타입 선언
type CommunityRequestDto = components["schemas"]["CommunityRequestDto"];
type CommunityResponseDto = components["schemas"]["CommunityResponseDto"];

export default function CommunityPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // API 연동을 위한 쿼리 추가
  const { data: posts, isLoading } = useQuery<CommunityResponseDto[]>({
    queryKey: ["community", "posts"],
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/community");
      if (error) throw error;
      return data;
    },
  });

  // 답글 목록을 가져오는 쿼리 추가
  const { data: replies } = useQuery<{ [key: string]: CommunityResponseDto[] }>(
    {
      queryKey: ["community", "replies"],
      queryFn: async () => {
        if (!posts) return {};

        // 모든 게시글의 답글을 병렬로 가져오기
        const repliesMap: { [key: string]: CommunityResponseDto[] } = {};
        await Promise.all(
          posts.map(async (post) => {
            const { data } = await client.GET(`/api/v1/community/${post.id}`);
            if (data && data.length > 0) {
              repliesMap[post.id] = data;
            }
          })
        );
        return repliesMap;
      },
      enabled: !!posts, // posts가 있을 때만 실행
    }
  );

  // 삭제된 게시글 목록을 위한 쿼리 추가
  const { data: inactivePosts, isLoading: isInactiveLoading } = useQuery<
    CommunityResponseDto[]
  >({
    queryKey: ["community", "inactive"],
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/community/inactive");
      if (error) throw error;
      return data;
    },
  });

  // Format date helper function
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "yyyy.MM.dd HH:mm", { locale: ko });
  };

  // 상태 관리 부분에 답글 작성을 위한 상태 추가
  const [replyToPost, setReplyToPost] = useState<number | null>(null);

  // 모달 상태 관리
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [newPost, setNewPost] = useState<CommunityRequestDto>({
    content: "",
    parentId: null,
  });

  // 현재 로그인한 사용자 정보 가져오기
  const { loginMember } = useGlobalLoginMember();

  // 글 작성 mutation
  const createPostMutation = useMutation<
    CommunityResponseDto,
    Error,
    CommunityRequestDto
  >({
    mutationFn: async (data: CommunityRequestDto) => {
      const { data: response, error } = await client.POST("/api/v1/community", {
        body: data,
      });
      if (error) throw error;
      return response;
    },
    onSuccess: () => {
      setIsWriteModalOpen(false);
      setNewPost({ content: "", parentId: null });
      // 전체 게시글 목록과 답글 목록 모두 갱신
      queryClient.invalidateQueries({ queryKey: ["community", "posts"] });
      queryClient.invalidateQueries({ queryKey: ["community", "replies"] });

      // 특정 게시글의 답글만 갱신 (최적화)
      if (replyToPost) {
        queryClient.invalidateQueries({
          queryKey: ["community", replyToPost.toString()],
        });
      }

      // replyToPost 초기화
      setReplyToPost(null);
    },
    onError: (error) => {
      console.error("글 작성 실패:", error);
      alert("글 작성에 실패했습니다.");
    },
  });

  // 수정 상태 관리 추가
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<CommunityResponseDto | null>(
    null
  );
  const [editContent, setEditContent] = useState("");

  // 수정 mutation 추가
  const updatePostMutation = useMutation<
    CommunityResponseDto,
    Error,
    { id: number; dto: CommunityRequestDto }
  >({
    mutationFn: async ({ id, dto }) => {
      try {
        const { data, error } = await client.PUT(
          `/api/v1/community/update/${id}`,
          {
            body: dto,
          }
        );

        if (error) {
          console.error("API Error:", error);
          throw new Error(error.message || "Failed to update post");
        }

        return data;
      } catch (err) {
        console.error("Mutation Error:", err);
        throw err;
      }
    },
    onSuccess: () => {
      setIsEditModalOpen(false);
      setEditingPost(null);
      setEditContent("");
      queryClient.invalidateQueries({ queryKey: ["community", "posts"] });
      queryClient.invalidateQueries({ queryKey: ["community", "replies"] });
    },
    onError: (error: Error) => {
      console.error("글 수정 실패:", error.message);
      alert(`글 수정에 실패했습니다: ${error.message}`);
    },
  });

  // 삭제 mutation 수정
  const deletePostMutation = useMutation<void, Error, number>({
    mutationFn: async (postId: number) => {
      const { error } = await client.DELETE(
        `/api/v1/community/delete/${postId}`
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", "posts"] });
      queryClient.invalidateQueries({ queryKey: ["community", "replies"] });
    },
    onError: (error) => {
      console.error("글 삭제 실패:", error);
      alert("글 삭제에 실패했습니다.");
    },
  });

  // Pin mutation 수정
  const pinPostMutation = useMutation<
    CommunityResponseDto,
    Error,
    { id: number; pinned: boolean }
  >({
    mutationFn: async ({ id, pinned }) => {
      // pinned 상태의 반대 값을 보내도록 수정
      const newPinValue = pinned ? 0 : 1;
      console.log(`Setting pin value to: ${newPinValue} for post ${id}`);

      const { data, error } = await client.POST(`/api/v1/community/${id}/pin`, {
        body: JSON.stringify({ pinned: newPinValue }), // JSON 문자열로 변환
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (error) {
        console.error("Pin mutation error:", error);
        throw error;
      }

      // 응답 확인 로깅
      console.log("Pin mutation response:", data);
      return data;
    },
    onSuccess: (data, variables) => {
      console.log("Pin mutation successful:", data);
      // 캐시 무효화 전에 현재 상태 로깅
      queryClient.invalidateQueries({ queryKey: ["community", "posts"] });
    },
    onError: (error) => {
      console.error("글 고정/해제 실패:", error);
      alert("작업에 실패했습니다.");
    },
  });

  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }
    createPostMutation.mutate(newPost);
  };

  // 수정 핸들러 추가
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost?.id) {
      alert("수정할 게시글을 찾을 수 없습니다.");
      return;
    }

    if (!editContent.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    const dto: CommunityRequestDto = {
      content: editContent,
      parentId: editingPost.parentId || null,
    };

    try {
      await updatePostMutation.mutateAsync({ id: editingPost.id, dto });
    } catch (error) {
      console.error("Edit submission error:", error);
    }
  };

  // 삭제 핸들러 추가
  const handleDelete = async (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    if (confirm("정말 삭제하시겠습니까?")) {
      deletePostMutation.mutate(postId);
    }
  };

  // 토글 핸들러 부분 수정
  const handlePinToggle = async (
    e: React.MouseEvent,
    postId: number,
    isPinned: boolean
  ) => {
    e.stopPropagation();
    try {
      console.log(
        `Toggling pin for post ${postId}. Current pinned status: ${isPinned}`
      );
      await pinPostMutation.mutateAsync({
        id: postId,
        pinned: isPinned, // 현재 상태 전달
      });
    } catch (error) {
      console.error("Pin toggle failed:", error);
    }
  };

  // 게시글 카드 렌더링 부분 수정
  const renderPostCard = (
    post: CommunityResponseDto,
    isReply: boolean = false
  ) => (
    <Card
      key={post.id}
      className={`
        border-0 transition-all duration-300 cursor-pointer group
        ${
          post.pinned
            ? "shadow-lg ring-1 ring-pink-200 bg-gradient-to-r from-rose-200/80 via-pink-50 to-white border-l-4 border-l-pink-400"
            : "shadow-sm hover:shadow-md bg-white/80"
        }
        backdrop-blur-sm hover:bg-white
        ${
          isReply
            ? "ml-12 relative before:absolute before:left-[-1rem] before:top-1/2 before:w-4 before:h-px before:bg-pink-200 border-l border-l-pink-200"
            : ""
        }
      `}
      // onClick={() => router.push(`/udash/community/${post.id}`)}
    >
      <CardContent className={`p-4 ${isReply ? "py-3" : "p-6"}`}>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-2">
            {/* 작성자 정보 표시 */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User className="w-4 h-4" />
              <span className={post.pinned ? "font-medium text-gray-900" : ""}>
                {post.author?.username || "익명"}
              </span>
            </div>

            {/* 제목과 내용 */}
            <h3
              className={`
                font-bold transition-colors duration-200 line-clamp-2
                ${
                  post.pinned
                    ? "text-pink-900 group-hover:text-pink-700 text-[1.2em]"
                    : "text-gray-800 group-hover:text-pink-500"
                }
                ${isReply ? "text-base" : "text-xl"}
              `}
            >
              {post.content}
            </h3>
          </div>

          {/* Image placeholder */}
          {post.hasImage && (
            <div className="flex-shrink-0">
              <div
                className={`bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg flex items-center justify-center ${
                  isReply ? "w-16 h-16" : "w-24 h-24"
                }`}
              >
                <ImageIcon
                  className={`text-pink-400 ${isReply ? "w-6 h-6" : "w-8 h-8"}`}
                />
              </div>
            </div>
          )}
        </div>

        {/* 하단 메타 정보와 버튼 */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1 text-gray-500">
            <Calendar className={`${isReply ? "w-3 h-3" : "w-4 h-4"}`} />
            <span className="text-xs">{formatDate(post.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                className={`
          transition-colors
          ${
            post.pinned
              ? "text-pink-600 hover:text-pink-700 hover:bg-pink-50"
              : "text-gray-500 hover:text-gray-600 hover:bg-gray-50"
          }
        `}
                onClick={(e) => handlePinToggle(e, post.id, post.pinned)}
              >
                {post.pinned ? "고정해제" : "고정하기"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-600 hover:bg-gray-50"
              onClick={(e) => {
                e.stopPropagation();
                setEditingPost(post);
                setEditContent(post.content);
                setIsEditModalOpen(true);
              }}
            >
              수정
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={(e) => handleDelete(e, post.id)}
            >
              삭제
            </Button>
            {!isReply && (
              <Button
                variant="ghost"
                size="sm"
                className="text-pink-500 hover:text-pink-600 hover:bg-pink-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setReplyToPost(post.id);
                  setIsWriteModalOpen(true);
                }}
              >
                답글 작성
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // 페이지네이션 관련 로직 추가 (중복 선언 제거)
  const totalPages = Math.ceil((posts?.length || 0) / itemsPerPage);

  // 현재 페이지에 표시할 게시글 필터링
  const currentPosts = posts?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 삭제된 게시글용 페이지네이션 상태 추가
  const [inactiveCurrentPage, setInactiveCurrentPage] = useState(1);
  const inactiveItemsPerPage = 7;

  // 삭제된 게시글 페이지네이션 로직
  const inactiveTotalPages = Math.ceil(
    (inactivePosts?.length || 0) / inactiveItemsPerPage
  );
  const currentInactivePosts = inactivePosts?.slice(
    (inactiveCurrentPage - 1) * inactiveItemsPerPage,
    inactiveCurrentPage * inactiveItemsPerPage
  );

  // 삭제된 게시글 페이지 변경 핸들러
  const handleInactivePageChange = (page: number) => {
    setInactiveCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 삭제된 게시글 카드 렌더링 함수 수정
  const renderInactivePostCard = (post: CommunityResponseDto) => (
    <Card
      key={post.id}
      className="border-0 shadow-sm bg-gray-50/80 hover:bg-gray-50 transition-colors duration-200 opacity-75 blur-[0.2px]"
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <User className="w-4 h-4" />
              <span>{post.author?.username || "알 수 없음"}</span>
              <span>•</span>
              <Calendar className="w-4 h-4" />
              <span>{formatDate(post.createdAt)}</span>
            </div>
            <p className="text-gray-500 line-clamp-2">{post.content}</p>
          </div>
          {post.hasImage && (
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-gray-100/50 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-300" />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50 to-rose-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Existing posts section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                커뮤니티 게시판
              </h1>
              <p className="text-gray-600">
                우리 아파트 입주민들과 소통해보세요
              </p>
            </div>
            {/* 새 글 작성 버튼 수정 */}
            <Button
              onClick={() => setIsWriteModalOpen(true)}
              className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              size="lg"
            >
              <PlusCircle className="w-5 h-5 mr-2" />새 글 작성
            </Button>
          </div>

          {/* Posts list */}
          <div className="space-y-4">
            {isLoading ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                    <p className="text-gray-500 text-lg">
                      게시글을 불러오는 중...
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : !posts?.length ? (
              <Card className="border-0 shadow-lg bg-gradient-to-r from-pink-50 to-rose-50">
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-pink-100 to-rose-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 text-pink-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-700">
                        아직 게시글이 없거나 귀하는 로그인 중이 아닙니다.
                      </h3>
                      <p className="text-gray-500">
                        회원 가입을 하거나 첫 번째 글을 작성해보세요!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {currentPosts?.map((post) => (
                  <div key={post.id} className="space-y-2">
                    {/* 원본 게시글 */}
                    {renderPostCard(post)}

                    {/* 답글 목록 */}
                    {replies?.[post.id]?.map((reply) =>
                      renderPostCard(reply, true)
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 페이지네이션 추가 */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        currentPage > 1 && handlePageChange(currentPage - 1)
                      }
                      className={`${
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }`}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => handlePageChange(i + 1)}
                        isActive={currentPage === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        currentPage < totalPages &&
                        handlePageChange(currentPage + 1)
                      }
                      className={`${
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {/* 삭제된 게시글 목록 */}
          <div className="mt-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  삭제된 게시글
                </h2>
                <p className="text-gray-600">삭제 처리된 게시글 목록입니다</p>
              </div>
              <Badge variant="secondary" className="text-gray-500">
                총 {inactivePosts?.length || 0}건
              </Badge>
            </div>

            <div className="space-y-4">
              {isInactiveLoading ? (
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                      <p className="text-gray-500 text-lg">
                        게시글을 불러오는 중...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : !inactivePosts?.length ? (
                <Card className="border-0 shadow-lg bg-gradient-to-r from-pink-50 to-rose-50">
                  <CardContent className="p-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-pink-100 to-rose-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-8 h-8 text-pink-500" />
                      </div>
                      <p className="text-gray-500">삭제된 게시글이 없습니다</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {currentInactivePosts?.map(renderInactivePostCard)}
                </div>
              )}
            </div>

            {/* 삭제된 게시글 페이지네이션 */}
            {inactiveTotalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          inactiveCurrentPage > 1 &&
                          handleInactivePageChange(inactiveCurrentPage - 1)
                        }
                        className={`${
                          inactiveCurrentPage === 1
                            ? "pointer-events-none opacity-50"
                            : ""
                        }`}
                      />
                    </PaginationItem>

                    {Array.from({ length: inactiveTotalPages }, (_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => handleInactivePageChange(i + 1)}
                          isActive={inactiveCurrentPage === i + 1}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          inactiveCurrentPage < inactiveTotalPages &&
                          handleInactivePageChange(inactiveCurrentPage + 1)
                        }
                        className={`${
                          inactiveCurrentPage === inactiveTotalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }`}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 새 글 작성 모달 */}
      <Dialog
        open={isWriteModalOpen}
        onOpenChange={(open) => {
          setIsWriteModalOpen(open);
          if (!open) setReplyToPost(null); // 모달이 닫힐 때 replyToPost 초기화
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {replyToPost ? "답글 작성" : "새 글 작성"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitPost} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {replyToPost ? "답글 내용" : "내용"}
              </label>
              <Textarea
                value={newPost.content}
                onChange={(e) =>
                  setNewPost({
                    content: e.target.value,
                    parentId: replyToPost, // 답글 작성 시 parentId 설정
                  })
                }
                placeholder={
                  replyToPost ? "답글을 입력하세요" : "내용을 입력하세요"
                }
                className="min-h-[200px] resize-none"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsWriteModalOpen(false);
                  setReplyToPost(null);
                }}
              >
                취소
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white"
                disabled={createPostMutation.isPending}
              >
                {createPostMutation.isPending ? "작성 중..." : "작성 완료"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 수정 모달 추가 */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              게시글 수정
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">내용</label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[200px] resize-none"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingPost(null);
                }}
              >
                취소
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white"
                disabled={updatePostMutation.isPending}
              >
                {updatePostMutation.isPending ? "수정 중..." : "수정 완료"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
