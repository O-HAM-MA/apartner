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

// 타입 선언
type CommunityRequestDto = components["schemas"]["CommunityRequestDto"];
type CommunityResponseDto = components["schemas"]["CommunityResponseDto"];

export default function CommunityPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // 삭제 mutation 추가
  const deletePostMutation = useMutation({
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

  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }
    createPostMutation.mutate(newPost);
  };

  // 삭제 핸들러 추가
  const handleDelete = async (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    if (confirm("정말 삭제하시겠습니까?")) {
      deletePostMutation.mutate(postId);
    }
  };

  // 게시글 카드 렌더링 부분 수정
  const renderPostCard = (
    post: CommunityResponseDto,
    isReply: boolean = false
  ) => {
    // 디버깅을 위한 로그 추가
    console.log("Current user ID:", loginMember?.id);
    console.log("Post author ID:", post.author?.id);
    console.log("Are IDs equal?:", loginMember?.id === post.author?.id);

    return (
      <Card
        key={post.id}
        className={`border-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group bg-white/80 backdrop-blur-sm hover:bg-white ${
          isReply
            ? "ml-12 relative before:absolute before:left-[-1rem] before:top-1/2 before:w-4 before:h-px before:bg-pink-200 border-l border-l-pink-200"
            : ""
        }`}
        onClick={() => router.push(`/udash/community/${post.id}`)}
      >
        <CardContent className={`p-4 ${isReply ? "py-3" : "p-6"}`}>
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 space-y-2">
              {/* Title with reply indicator */}
              <div className="flex items-center gap-2">
                {isReply && (
                  <div className="flex items-center text-pink-400">
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-xs font-medium">답글</span>
                  </div>
                )}
                <h3
                  className={`font-bold text-gray-900 group-hover:text-pink-600 transition-colors duration-200 line-clamp-2 ${
                    isReply ? "text-base" : "text-xl"
                  }`}
                >
                  {post.title}
                </h3>
              </div>

              {/* Content preview - 답글일 경우 더 간단하게 표시 */}
              <p
                className={`text-gray-600 line-clamp-2 leading-relaxed ${
                  isReply ? "text-sm" : ""
                }`}
              >
                {post.content}
              </p>

              {/* Meta information */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-1 text-gray-500">
                  <User className={`${isReply ? "w-3 h-3" : "w-4 h-4"}`} />
                  <span className="font-medium text-xs">{post.authorName}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Calendar className={`${isReply ? "w-3 h-3" : "w-4 h-4"}`} />
                  <span className="text-xs">{formatDate(post.createdAt)}</span>
                </div>
                {post.hasImage && (
                  <Badge
                    variant="secondary"
                    className="bg-pink-50 text-pink-600 hover:bg-pink-100 text-xs py-0"
                  >
                    <ImageIcon className="w-3 h-3 mr-1" />
                    이미지
                  </Badge>
                )}
              </div>
            </div>

            {/* Image placeholder - 답글일 경우 더 작게 표시 */}
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

          {/* Meta information 섹션 끝에 답글 버튼 추가 */}
          <div className="flex justify-between items-center mt-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {/* ...existing meta information... */}
            </div>
            <div className="flex items-center gap-2">
              {/* 작성자 체크 로직 수정 - 명시적 타입 변환 추가 */}
              {Number(loginMember?.id) === Number(post.author?.id) && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-600 hover:bg-gray-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Edit clicked");
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    수정
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => handleDelete(e, post.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    삭제
                  </Button>
                </>
              )}
              {/* 기존 답글 버튼 */}
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
                  <MessageSquare className="w-4 h-4 mr-1" />
                  답글 작성
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50 to-rose-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header section */}
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
                {posts.map((post) => (
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

          {/* Floating action button for mobile */}
          <div className="fixed bottom-6 right-6 sm:hidden">
            <Button
              onClick={() => router.push("/udash/community/write")}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110"
              size="icon"
            >
              <PlusCircle className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </main>
      <Footer />

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
    </div>
  );
}
