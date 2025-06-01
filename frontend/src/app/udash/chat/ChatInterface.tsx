"use client";
import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, AlertCircle, X } from "lucide-react";
import { useApartnerTalkContext } from "@/contexts/ApartnerTalkContext";
import { format, isToday, parseISO } from "date-fns";
import { Spinner } from "@/components/ui/spinner";
import { leaveUserChatroom } from "@/utils/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ChatInterface: React.FC = () => {
  const {
    categoryCode,
    getCategoryDisplayName,
    messages,
    connecting,
    connected,
    sendMessage,
    resetChat,
    chatroomId,
    roomStatus,
    isActiveChat,
    isInactiveChat,
    canSendMessages,
    showCategorySelection,
    closeCurrentChat,
    messagesLoaded,
    disconnectWebSocket,
  } = useApartnerTalkContext();

  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // 메시지가 업데이트되면 스크롤
  useEffect(() => {
    if (messagesEndRef.current && autoScroll) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  // 메시지 로딩 완료 시 스크롤 조정
  useEffect(() => {
    if (messagesLoaded && messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        setAutoScroll(true);
      }, 100);
    }
  }, [messagesLoaded]);

  // 스크롤 이벤트 처리
  useEffect(() => {
    const handleScroll = () => {
      if (!messageContainerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } =
        messageContainerRef.current;
      const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 50;
      setAutoScroll(isScrolledToBottom);
    };

    const container = messageContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  // 메시지 전송 핸들러
  const handleSendMessage = () => {
    if (!newMessage.trim() || !canSendMessages()) return;
    const messageToSend = newMessage.trim();
    setNewMessage("");
    sendMessage(messageToSend);
  };

  // 엔터 키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 타임스탬프 포맷팅
  const formatTimestamp = (timestamp: string | undefined) => {
    if (!timestamp) return "";

    try {
      const date = parseISO(timestamp);

      if (isToday(date)) {
        return format(date, "HH:mm");
      } else {
        return format(date, "yyyy-MM-dd HH:mm");
      }
    } catch (error) {
      return timestamp;
    }
  };

  // 사용자 정보 포맷팅
  const formatUserInfo = (message: any) => {
    let displayName = message.userName || "사용자";

    if (message.apartmentName && message.buildingName && message.unitNumber) {
      return `${displayName} (${message.apartmentName} ${message.buildingName}동 ${message.unitNumber}호)`;
    }

    if (message.apartmentName && !message.buildingName) {
      return `${displayName} (${message.apartmentName})`;
    }

    if (message.apartmentName && message.buildingName && !message.unitNumber) {
      return `${displayName} (${message.apartmentName} ${message.buildingName}동)`;
    }

    return displayName;
  };

  // 뒤로가기 (카테고리 선택 화면으로)
  const handleBack = () => {
    // 웹소켓 연결 명시적 해제
    disconnectWebSocket();
    showCategorySelection();
  };

  // 채팅방 종료 요청
  const handleCloseRequest = () => {
    setShowCloseConfirm(true);
  };

  // 채팅방 종료 확인
  const handleCloseChat = async () => {
    setIsClosing(true);
    try {
      await closeCurrentChat();
      setShowCloseConfirm(false);
    } finally {
      setIsClosing(false);
    }
  };

  // leave + reset 공통 함수
  const handleLeaveAndReset = async () => {
    if (chatroomId) {
      try {
        await leaveUserChatroom(chatroomId);
      } catch (e) {
        // 이미 나간 경우 등 무시
      }
    }
    resetChat();
  };

  // 채팅방 상태 메시지
  const getChatStatusMessage = () => {
    if (isInactiveChat()) {
      return "메시지를 보낼 수 없으며 이전 메시지만 확인 가능합니다.";
    }
    if (isActiveChat() && !connected) {
      return "서버에 연결 중입니다...";
    }
    return null;
  };

  // 현재 카테고리 이름 가져오기
  const categoryDisplayName = getCategoryDisplayName();

  return (
    <div className="flex flex-col h-full">
      <div className="border-b flex flex-row items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">
            {categoryDisplayName || categoryCode || ""} 문의
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {isActiveChat() && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={handleCloseRequest}
            >
              <X className="h-4 w-4 mr-1" />
              종료
            </Button>
          )}
          {isInactiveChat() && (
            <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded-full">
              종료된 대화
            </span>
          )}
        </div>
      </div>

      {showCloseConfirm && (
        <Alert className="m-2 bg-red-50 border-red-300">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-700">
            대화를 종료하시겠습니까?
          </AlertTitle>
          <AlertDescription className="text-sm">
            <p>
              대화가 종료되면 더 이상 메시지를 보낼 수 없으며, 새로운 문의를
              시작할 수 있습니다. 종료된 대화는 다시 활성화할 수 없습니다.
            </p>
            <div className="flex gap-2 mt-4">
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600"
                onClick={handleCloseChat}
                disabled={isClosing}
              >
                {isClosing ? (
                  <>
                    <Spinner className="h-4 w-4 mr-2" />
                    종료 중...
                  </>
                ) : (
                  "대화 종료"
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCloseConfirm(false)}
                disabled={isClosing}
              >
                취소
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 채팅방 상태 알림 */}
        {getChatStatusMessage() && (
          <Alert
            className={`m-2 ${
              isInactiveChat() ? "bg-yellow-50 border-yellow-200" : ""
            }`}
          >
            <AlertCircle
              className={`h-4 w-4 ${
                isInactiveChat() ? "text-yellow-600" : "text-blue-600"
              }`}
            />
            <AlertDescription className="text-sm">
              {getChatStatusMessage()}
            </AlertDescription>
          </Alert>
        )}

        <div
          ref={messageContainerRef}
          className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-3"
        >
          {connecting && (
            <div className="flex items-center justify-center h-32">
              <div className="flex flex-col items-center gap-2">
                <Spinner className="h-8 w-8" />
                <span className="text-sm text-muted-foreground">
                  연결 중...
                </span>
              </div>
            </div>
          )}

          {!connecting && messages.length === 0 && (
            <div className="flex items-center justify-center h-32">
              <span className="text-muted-foreground">
                메시지가 없습니다. 문의 내용을 입력해주세요.
              </span>
            </div>
          )}

          {!autoScroll && messages.length > 10 && (
            <Button
              variant="outline"
              size="sm"
              className="sticky bottom-2 self-center z-10 opacity-100 hover:opacity-100 bg-white shadow-md border-gray-300"
              onClick={() => {
                setAutoScroll(true);
                setTimeout(() => {
                  messagesEndRef.current?.scrollIntoView({
                    behavior: "smooth",
                  });
                }, 0);
              }}
            >
              <span className="text-black dark:text-white">
                ↓ 새 메시지로 이동
              </span>
            </Button>
          )}

          {!connecting &&
            [
              ...new Map(
                messages.map((msg) => [
                  msg.messageId ||
                    msg.id ||
                    `${msg.userId}-${msg.message}-${msg.timestamp}`,
                  msg,
                ])
              ).values(),
            ].map((message, index) => {
              const isMyMessage = message.isMyMessage || false;
              const uniqueKey =
                message.messageId ||
                message.id ||
                `msg-${index}-${message.userId}-${
                  message.timestamp || Date.now()
                }`;

              return (
                <div
                  key={uniqueKey}
                  className={`flex w-full ${
                    message.isNew ? "animate-fadeIn" : ""
                  } ${
                    message.isSystem
                      ? "justify-center"
                      : isMyMessage
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  {message.isSystem ? (
                    <div className="bg-gray-300 dark:bg-gray-700 shadow-sm rounded-full px-4 py-1">
                      <p className="text-xs text-black dark:text-white font-medium">
                        {message.message}
                      </p>
                    </div>
                  ) : (
                    <div
                      className={`flex items-end gap-2 ${
                        isMyMessage ? "flex-row-reverse" : "flex-row"
                      } max-w-[90%]`}
                    >
                      <Avatar className="w-8 h-8 self-start shrink-0">
                        {message.profileImageUrl ? (
                          <AvatarImage
                            src={message.profileImageUrl}
                            alt={message.userName || "사용자"}
                          />
                        ) : (
                          <AvatarFallback>
                            {(message.userName || "사용자").charAt(0)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div
                        className={`flex flex-col ${
                          isMyMessage ? "items-end" : "items-start"
                        }`}
                      >
                        {!isMyMessage && (
                          <p className="text-xs mb-1 font-medium dark:text-white text-black">
                            {formatUserInfo(message)}
                          </p>
                        )}
                        <div
                          className={`flex items-end gap-1 ${
                            isMyMessage ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          <div
                            className={`max-w-xs md:max-w-sm rounded-lg p-3 ${
                              isMyMessage
                                ? "bg-pink-500 text-white"
                                : "bg-gray-100 dark:bg-gray-700 text-black dark:text-white"
                            }`}
                          >
                            <p className="break-words text-sm">
                              {message.message}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 whitespace-nowrap shrink-0">
                            {formatTimestamp(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t flex gap-2 bg-white">
        <Button onClick={handleBack} variant="outline">
          뒤로가기
        </Button>
        {isInactiveChat() ? (
          <div className="flex-1 flex items-center justify-center bg-gray-100 rounded h-10 px-3 text-gray-500">
            종료된 대화입니다.
          </div>
        ) : (
          <>
            <Input
              placeholder="메시지 입력..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!canSendMessages()}
              className="flex-1 h-10"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!canSendMessages() || !newMessage.trim()}
              className="bg-pink-500 hover:bg-pink-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
