"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle, X, ArrowLeft } from "lucide-react";
import {
  ApartnerTalkProvider,
  useApartnerTalkContext,
} from "@/contexts/ApartnerTalkContext";
import CategorySelection from "@/app/udash/chat/CategorySelection";
import ChatInterface from "@/app/udash/chat/ChatInterface";
import { getUserChatrooms } from "@/utils/api";
import { useState } from "react";

// 채팅 히스토리 컴포넌트
function ChatHistory() {
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
        setRooms(allRooms);
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
              className="w-full mb-1 justify-between flex"
              variant="ghost"
              onClick={() => handleEnterRoom(room.id)}
            >
              <span>
                [{room.category}] {room.title}
              </span>
              <span className="text-xs text-gray-400">
                {room.createdAt && new Date(room.createdAt).toLocaleString()}
              </span>
            </Button>
          ))
        )}
      </div>
    </div>
  );
}

function ChatCardContent({ onClose }: { onClose: () => void }) {
  const { currentView, showCategorySelection, showChatHistory } =
    useApartnerTalkContext();

  // 카드 헤더 타이틀 설정
  const getCardTitle = () => {
    switch (currentView) {
      case "CATEGORY":
        return "APTner";
      case "CHAT":
        return "APTner";
      case "HISTORY":
        return "메시지 목록";
      default:
        return "APTner";
    }
  };

  return (
    <Card className="fixed bottom-24 right-6 w-96 h-[630px] max-h-[100vh] z-50 shadow-lg flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <span className="font-bold text-lg">{getCardTitle()}</span>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X />
        </Button>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentView === "CATEGORY" && <CategorySelection />}
        {currentView === "CHAT" && <ChatInterface />}
        {currentView === "HISTORY" && <ChatHistory />}
        {currentView === "NONE" && (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <p className="text-center text-gray-500 mb-4">
              채팅을 시작하거나 이전 메시지를 확인하세요.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button className="w-full" onClick={showCategorySelection}>
                새 문의하기
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={showChatHistory}
              >
                메시지 목록
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export function ChatFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <ApartnerTalkProvider>
      <ChatFloatingButtonWithContext
        isOpen={isOpen}
        onClose={handleClose}
        onToggle={handleToggle}
      />
    </ApartnerTalkProvider>
  );
}

// Context를 사용하는 내부 컴포넌트
function ChatFloatingButtonWithContext({
  isOpen,
  onClose,
  onToggle,
}: {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}) {
  const { hasUnreadMessages, markMessagesAsRead } = useApartnerTalkContext();

  // 버튼 클릭 시 알림 상태 초기화
  const handleButtonClick = () => {
    if (hasUnreadMessages) {
      markMessagesAsRead();
    }
    onToggle();
  };

  return (
    <>
      {isOpen && <ChatCardContent onClose={onClose} />}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          className="w-14 h-14 rounded-full shadow-lg bg-pink-500 hover:bg-pink-600"
          onClick={handleButtonClick}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>

        {/* 새 메시지 알림 표시 (빨간 점) */}
        {hasUnreadMessages && (
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full border-2 border-white z-50 animate-pulse"></div>
        )}
      </div>
    </>
  );
}
export default ChatFloatingButton;
