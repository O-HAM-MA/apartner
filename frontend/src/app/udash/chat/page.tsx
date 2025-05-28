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
    category,
    connecting,
    connected,
    enterChatroomById,
    roomStatus,
    isActiveChat,
    isInactiveChat,
    currentView,
    checkActiveChats,
  } = useApartnerTalkContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [processedRoomId, setProcessedRoomId] = useState<string | null>(null);
  const isProcessingRef = useRef(false);

  // 컴포넌트 마운트 시 활성화된 채팅방 확인
  useEffect(() => {
    checkActiveChats();
  }, [checkActiveChats]);

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
        console.log(
          `[ApartnerTalkContent] 채팅방 진입 시도 (roomId: ${roomId})`
        );
        const success = await enterChatroomById(Number(roomId));

        // 처리 완료 표시
        setProcessedRoomId(roomId);

        if (success) {
          console.log(
            `[ApartnerTalkContent] 채팅방 진입 성공 (roomId: ${roomId}, status: ${roomStatus})`
          );

          // 비활성화된 채팅방인 경우 추가 메시지 표시 (필요시)
          if (roomStatus === "INACTIVE") {
            console.log(
              `[ApartnerTalkContent] 비활성화된 채팅방입니다. 메시지만 표시됩니다.`
            );
          }
        } else {
          // 채팅방 접근 실패 (예: 존재하지 않는 채팅방, 권한 없음 등)
          console.log(
            `[ApartnerTalkContent] 채팅방 접근 실패 (roomId: ${roomId})`
          );
          router.replace("/udash/chat", { scroll: false });
        }
      } catch (error) {
        console.error(
          `[ApartnerTalkContent] 채팅방 진입 오류 (roomId: ${roomId}):`,
          error
        );
        router.replace("/udash/chat", { scroll: false });
      } finally {
        isProcessingRef.current = false;
      }
    };

    handleRoomEntry();
  }, [searchParams, enterChatroomById, router, processedRoomId, roomStatus]);

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
