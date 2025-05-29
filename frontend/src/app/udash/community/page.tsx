"use client";
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
} from "lucide-react";

// Mock data for demonstration since we don't have the actual API client
const mockPosts = [
  {
    id: 1,
    title: "아파트 주차장 이용 안내",
    content:
      "주차장 이용 시 주의사항과 새로운 규정에 대해 안내드립니다. 모든 입주민분들께서는 반드시 확인해주시기 바랍니다.",
    authorName: "관리사무소",
    viewCount: 245,
    createdAt: "2024-01-15T10:30:00Z",
    hasImage: true,
  },
  {
    id: 2,
    title: "엘리베이터 점검 일정 공지",
    content:
      "정기 점검을 위해 엘리베이터 운행이 일시 중단됩니다. 불편을 드려 죄송합니다.",
    authorName: "김관리",
    viewCount: 189,
    createdAt: "2024-01-14T14:20:00Z",
    hasImage: false,
  },
  {
    id: 3,
    title: "아이들 놀이터 새 시설 설치 완료",
    content:
      "아이들이 더욱 안전하고 즐겁게 놀 수 있도록 새로운 놀이기구를 설치했습니다. 많은 이용 부탁드립니다.",
    authorName: "이주민",
    viewCount: 156,
    createdAt: "2024-01-13T16:45:00Z",
    hasImage: true,
  },
  {
    id: 4,
    title: "분리수거 요일 변경 안내",
    content:
      "환경부 정책 변경에 따라 분리수거 요일이 변경됩니다. 새로운 일정을 확인해주세요.",
    authorName: "박환경",
    viewCount: 203,
    createdAt: "2024-01-12T09:15:00Z",
    hasImage: false,
  },
];

export default function CommunityPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mock query for demonstration
  const { data: posts, isLoading } = {
    data: mockPosts,
    isLoading: false,
  };

  // Format date helper function
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "yyyy.MM.dd HH:mm", { locale: ko });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                커뮤니티 게시판
              </h1>
              <p className="text-gray-600">
                우리 아파트 입주민들과 소통해보세요
              </p>
            </div>
            <Button
              onClick={() => router.push("/udash/community/write")}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="text-gray-500 text-lg">
                      게시글을 불러오는 중...
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : !posts?.length ? (
              <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-700">
                        아직 게시글이 없습니다
                      </h3>
                      <p className="text-gray-500">
                        첫 번째 글을 작성해보세요!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {posts.map((post, index) => (
                  <Card
                    key={post.id}
                    className="border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group bg-white/80 backdrop-blur-sm hover:bg-white"
                    onClick={() => router.push(`/udash/community/${post.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 space-y-3">
                          {/* Title */}
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                            {post.title}
                          </h3>

                          {/* Content preview */}
                          <p className="text-gray-600 line-clamp-2 leading-relaxed">
                            {post.content}
                          </p>

                          {/* Meta information */}
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-gray-500">
                              <User className="w-4 h-4" />
                              <span className="font-medium">
                                {post.authorName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-500">
                              <Eye className="w-4 h-4" />
                              <span>조회 {post.viewCount}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(post.createdAt)}</span>
                            </div>
                            {post.hasImage && (
                              <Badge
                                variant="secondary"
                                className="bg-blue-100 text-blue-700 hover:bg-blue-200"
                              >
                                <ImageIcon className="w-3 h-3 mr-1" />
                                이미지
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Image placeholder */}
                        {post.hasImage && (
                          <div className="flex-shrink-0">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-200">
                              <ImageIcon className="w-8 h-8 text-blue-500" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Hover indicator */}
                      <div className="mt-4 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Floating action button for mobile */}
          <div className="fixed bottom-6 right-6 sm:hidden">
            <Button
              onClick={() => router.push("/udash/community/write")}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110"
              size="icon"
            >
              <PlusCircle className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
