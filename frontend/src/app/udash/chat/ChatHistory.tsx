"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getUserChatrooms } from "@/utils/api";
import { useApartnerTalkContext } from "@/contexts/ApartnerTalkContext";
import { getCategoryNameByCode } from "@/constants/categoryCode";

const ChatHistory: React.FC = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { enterChatroomById, showCategorySelection } = useApartnerTalkContext();

  useEffect(() => {
    async function loadRooms() {
      try {
        const allRooms = await getUserChatrooms();
        // 생성시간 내림차순 정렬
        allRooms.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        // 카테고리코드를 카테고리 이름으로 변환하여 표시
        const enhancedRooms = allRooms.map((room) => ({
          ...room,
          categoryDisplayName: room.categoryCode
            ? getCategoryNameByCode(room.categoryCode)
            : "미분류",
        }));
        setRooms(enhancedRooms);
      } catch (error) {
        console.error("채팅방 목록 로드 오류:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadRooms();
  }, []);

  const handleEnterRoom = async (roomId: number) => {
    setIsLoading(true);
    try {
      await enterChatroomById(Number(roomId));
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    if (status === "ACTIVE") {
      return (
        <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
          진행중
        </span>
      );
    } else if (status === "INACTIVE") {
      return (
        <span className="ml-2 text-xs px-2 py-0.5 bg-gray-200 text-gray-500 rounded-full">
          종료됨
        </span>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={showCategorySelection}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-bold">메시지 목록</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-sm text-gray-500">로딩 중...</span>
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            채팅방이 없습니다.
          </div>
        ) : (
          rooms.map((room) => (
            <Button
              key={room.id}
              className={`w-full mb-1 justify-between flex items-center ${
                room.status === "INACTIVE" ? "opacity-70" : ""
              }`}
              variant="ghost"
              onClick={() => handleEnterRoom(room.id)}
            >
              <div className="flex items-center">
                <span>
                  {room.categoryDisplayName} {room.title}
                </span>
                {renderStatusBadge(room.status)}
              </div>
              <span className="text-xs text-gray-400">
                {room.createdAt && new Date(room.createdAt).toLocaleString()}
              </span>
            </Button>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatHistory;
