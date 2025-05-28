"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApartnerTalkContext } from "@/contexts/ApartnerTalkContext";
import { ArrowLeft, Clock, MessageSquare } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Spinner } from "@/components/ui/spinner";
import { getUserChatrooms } from "@/utils/api";

type ChatroomType = {
  id: number;
  title: string;
  status: string;
  category: string;
  lastMessage?: string;
  lastMessageTimestamp?: string;
  createdAt: string;
};

const ChatHistory: React.FC = () => {
  const { enterChatroomById, showCategorySelection } = useApartnerTalkContext();
  const [chatrooms, setChatrooms] = useState<ChatroomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [enteringRoom, setEnteringRoom] = useState<number | null>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      setLoading(true);
      const response = await getUserChatrooms();
      console.log("[ChatHistory] 채팅방 목록 로드 완료:", response);

      // 날짜 기준 내림차순 정렬 (최신순)
      const sortedRooms = [...response].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.modifiedAt || "");
        const dateB = new Date(b.createdAt || b.modifiedAt || "");
        return dateB.getTime() - dateA.getTime();
      });

      setChatrooms(sortedRooms);
    } catch (error) {
      console.error("[ChatHistory] 채팅방 목록 로드 실패:", error);
      setChatrooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterRoom = async (roomId: number) => {
    setEnteringRoom(roomId);
    try {
      await enterChatroomById(roomId);
    } finally {
      setEnteringRoom(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return format(parseISO(dateString), "yyyy.MM.dd HH:mm");
    } catch (error) {
      return dateString;
    }
  };

  // 채팅방 상태에 따른 배지 스타일
  const getStatusBadge = (status: string) => {
    if (status === "ACTIVE") {
      return (
        <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
          진행중
        </span>
      );
    }
    return (
      <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
        종료됨
      </span>
    );
  };

  return (
    <Card className="w-full border-0 shadow-none h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={showCategorySelection}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-xl">채팅 내역</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadChatHistory}
          disabled={loading}
        >
          새로고침
        </Button>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto pt-0">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center gap-2">
              <Spinner className="h-8 w-8" />
              <span className="text-sm text-muted-foreground">로딩 중...</span>
            </div>
          </div>
        ) : chatrooms.length === 0 ? (
          <div className="flex justify-center items-center h-64 text-muted-foreground">
            채팅 내역이 없습니다.
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            {chatrooms.map((room) => (
              <div
                key={room.id}
                className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors relative"
                onClick={() => handleEnterRoom(room.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">
                      {room.title || `${room.category} 문의`}
                    </h3>
                    {getStatusBadge(room.status)}
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(room.createdAt)}
                  </div>
                </div>

                <div className="flex items-start gap-2 mt-2">
                  <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {room.lastMessage || "메시지 내용이 없습니다."}
                  </p>
                </div>

                {enteringRoom === room.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-lg">
                    <Spinner className="h-6 w-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatHistory;
