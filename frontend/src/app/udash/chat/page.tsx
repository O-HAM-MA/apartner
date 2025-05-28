"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  ApartnerTalkProvider,
  useApartnerTalkContext,
} from "@/contexts/ApartnerTalkContext";
import CategorySelection from "./CategorySelection";
import ChatInterface from "./ChatInterface";
import ChatHistory from "./ChatHistory";
import { useSearchParams, useRouter } from "next/navigation";

// 내부 컴포넌트: 컨텍스트를 사용하여 UI를 렌더링
function ApartnerTalkContent() {
  const {
    categoryCode,
    connecting,
    connected,
    enterChatroomById,
    roomStatus,
    isActiveChat,
    isInactiveChat,
    currentView,
    checkActiveChats,
    showCategorySelection,
  } = useApartnerTalkContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [processedRoomId, setProcessedRoomId] = useState<string | null>(null);
  const isProcessingRef = useRef(false);

  // 컴포넌트 마운트 시 최초 1회만 활성화된 채팅방 확인
  // 이후 WebSocket 알림으로 상태 갱신
  useEffect(() => {
    // 최초 1회 활성화된 채팅방 확인
    checkActiveChats();
    // 주기적인 폴링 없이 WebSocket 알림 기반으로 동작
  }, []); // 빈 의존성 배열로 마운트 시 1회만 실행

  // URL 쿼리 파라미터에서 roomId 확인
  useEffect(() => {
    const roomId = searchParams.get("roomId");

    // 이미 처리한 roomId이거나 현재 처리 중인 경우 무시
    if (!roomId || processedRoomId === roomId || isProcessingRef.current) {
      return;
    }

    const handleRoomEntry = async () => {
      // 처리 중임을 표시
      isProcessingRef.current = true;

      try {
        const success = await enterChatroomById(Number(roomId));

        setProcessedRoomId(roomId);

        if (success) {
          if (roomStatus === "INACTIVE") {
          }
        } else {
          alert(
            "접근할 수 없는 채팅방입니다. 본인이 생성한 채팅방만 접근 가능합니다."
          );
          showCategorySelection();
          router.replace("/udash/chat", { scroll: false });
        }
      } catch (error) {
        alert("채팅방 접근 중 오류가 발생했습니다.");
        showCategorySelection();
        router.replace("/udash/chat", { scroll: false });
      } finally {
        isProcessingRef.current = false;
      }
    };

    handleRoomEntry();
  }, [
    searchParams,
    enterChatroomById,
    router,
    processedRoomId,
    roomStatus,
    showCategorySelection,
  ]);

  // 화면 결정 로직
  const renderContent = () => {
    switch (currentView) {
      case "CHAT":
        return <ChatInterface />;
      case "HISTORY":
        return <ChatHistory />;
      case "CATEGORY":
      default:
        return <CategorySelection />;
    }
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl min-h-[500px] rounded-lg overflow-visible">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

// 메인 컴포넌트: ApartnerTalkProvider로 감싸서 컨텍스트 제공
export default function ApartnerTalkPage() {
  return (
    <ApartnerTalkProvider>
      <ApartnerTalkContent />
    </ApartnerTalkProvider>
  );
}
