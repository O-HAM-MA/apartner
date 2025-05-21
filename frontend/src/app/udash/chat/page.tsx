"use client";
import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Send, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  useUserChatContext,
  UserChatProvider,
} from "@/contexts/UserChatContext";
import { format, isToday, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { Spinner } from "@/components/ui/spinner";
import type { ChatroomType, ChatMessageType } from "@/types/chat";
import { getUserChatrooms } from "@/utils/api";

// 메인 컴포넌트를 UserChatProvider로 감싸는 래퍼
export default function UserChatPage() {
  return (
    <UserChatProvider>
      <UserChat />
    </UserChatProvider>
  );
}

// 실제 채팅 관리 컴포넌트
// UserChatContext에서 이미 로그인 상태와 사용자 ID를 관리하므로 별도 로그인 정보를 사용하지 않음
// 메시지의 isMyMessage 속성은 UserChatContext 내부에서 이미 계산되어 있음
function UserChat() {
  // UserChatContext에서 필요한 모든 것을 가져옴
  const {
    chatrooms,
    selectedChatroom,
    messages,
    connecting,
    connected,
    sendMessage,
    selectChatroom,
    disconnect,
  } = useUserChatContext();

  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const filteredChatrooms = chatrooms.filter((chatroom) =>
    chatroom.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 디버깅용 Effect 추가: 직접 API 호출 시도
  useEffect(() => {
    async function fetchChatrooms() {
      try {
        console.log("[UserChat] API 직접 호출로 채팅방 목록 가져오기...");
        const apiResponse: any = await getUserChatrooms();
        console.log("[UserChat] API 직접 호출 결과:", apiResponse);
        console.log(
          "[UserChat] 채팅방 수 (직접 호출):",
          Array.isArray(apiResponse)
            ? apiResponse.length
            : apiResponse?.data
            ? apiResponse.data.length
            : "데이터 없음"
        );
      } catch (error) {
        console.error("[UserChat] API 직접 호출 오류:", error);
      }
    }

    // 컴포넌트 마운트 시 한 번만 실행
    fetchChatrooms();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current && autoScroll) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

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

  useEffect(() => {
    if (chatrooms.length > 0) {
      console.log(
        "채팅방 목록 정보:",
        chatrooms.map((room) => ({
          id: room.id,
          title: room.title,
          hasNewMessage: room.hasNewMessage,
        }))
      );
      console.log("[UserChat] 현재 표시되는 채팅방 수:", chatrooms.length);
    }
  }, [chatrooms]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChatroom) return;
    const messageToSend = newMessage.trim();
    setNewMessage("");
    setTimeout(() => {
      sendMessage(messageToSend);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectChatroom = (chatroom: ChatroomType) => {
    // 이미 선택된 채팅방인 경우 무시
    if (selectedChatroom?.id === chatroom.id) {
      console.log(`이미 선택된 채팅방 ${chatroom.id} 입니다.`);
      return;
    }

    console.log(
      `채팅방 전환: ${selectedChatroom?.id || "없음"} -> ${chatroom.id}`
    );

    // 채팅방 선택 전 커넥션 상태 초기화
    if (connected) {
      console.log("채팅방 변경 전 기존 연결 해제");
      disconnect(); // 기존 연결 즉시 해제
    }

    // 약간의 지연 후 새 채팅방 선택 (연결 해제 완료를 위한 시간)
    setTimeout(() => {
      // 새 채팅방 선택
      selectChatroom(chatroom);

      // 채팅방 선택 시 자동 스크롤 활성화
      setAutoScroll(true);

      // 메시지 로드 후 스크롤 이동
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }, 50);
  };

  const formatUserInfo = (message: ChatMessageType) => {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">실시간 문의하기</h1>
        <p className="text-muted-foreground">
          궁금하거나 불편한 점이 있으시면 언제든지 문의해주세요. 관리자와 1:1
          채팅으로 신속하게 답변드리겠습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        <Card className="md:col-span-1 flex flex-col h-full">
          <CardHeader className="px-4 py-3 border-b">
            <div className="relative flex items-center justify-between w-full">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="대화 검색..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-auto flex-grow">
            {filteredChatrooms.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                참여중인 채팅방이 없습니다.
              </div>
            ) : (
              <div className="divide-y">
                {filteredChatrooms.map((chatroom) => (
                  <div
                    key={chatroom.id}
                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedChatroom?.id === chatroom.id ? "bg-muted" : ""
                    }`}
                    onClick={() => handleSelectChatroom(chatroom)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {chatroom.title?.charAt(0) || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium truncate">
                            {chatroom.title ||
                              (chatroom.id
                                ? `채팅방 #${chatroom.id}`
                                : "채팅방")}
                          </h4>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {chatroom.createdAt &&
                              format(
                                new Date(chatroom.createdAt),
                                "yyyy.MM.dd"
                              )}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          {chatroom.hasNewMessage && (
                            <>
                              <Badge className="h-2 w-2 rounded-full p-0 bg-red-500" />
                              <span className="text-xs text-red-500">
                                새 메시지
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 flex flex-col h-full">
          {selectedChatroom ? (
            <>
              <CardHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {selectedChatroom.title?.charAt(0) || "C"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {selectedChatroom.title ||
                        (selectedChatroom.id
                          ? `채팅방 #${selectedChatroom.id}`
                          : "채팅방")}
                    </CardTitle>
                    <span className="hidden">
                      {JSON.stringify({
                        id: selectedChatroom.id,
                        title: selectedChatroom.title,
                        hasTitle: selectedChatroom.title ? true : false,
                      })}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent
                ref={messageContainerRef}
                className="p-6 overflow-y-auto flex-grow flex flex-col gap-4 hide-scrollbar hover:show-scrollbar active:show-scrollbar smooth-scroll"
                style={{ height: "400px" }}
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
                      메시지가 없습니다.
                    </span>
                  </div>
                )}

                {!autoScroll && messages.length > 10 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="sticky bottom-2 self-center z-10 opacity-100 hover:opacity-100 ultra-smooth-transition bg-white shadow-md border-gray-300"
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
                  messages.map((message, index) => {
                    // message 객체에 이미 포함된 isMyMessage 속성 사용
                    // 컨텍스트에서 이미 계산되어 있음
                    const isMyMessage = message.isMyMessage || false;

                    // 고유한 키 생성
                    const uniqueKey = `${
                      message.messageId || message.id || "msg"
                    }-${index}-${message.userId}-${Date.now()}`;

                    return (
                      <div
                        key={uniqueKey}
                        className={`flex w-full ${
                          message.isNew ? "ultra-smooth-animation" : ""
                        } ${
                          message.isSystem
                            ? "justify-center"
                            : isMyMessage
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        {message.isSystem ? (
                          <div className="bg-gray-300 dark:bg-gray-700 shadow-sm rounded-full px-4 py-1 ultra-smooth-transition">
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
                                  className={`max-w-xs md:max-w-sm rounded-lg p-3 ultra-smooth-transition ${
                                    isMyMessage
                                      ? "bg-[#f795a7] dark:bg-pink-800 text-black dark:text-white font-medium"
                                      : "bg-[#f0f0f0] dark:bg-gray-700 text-black dark:text-white font-medium"
                                  }`}
                                >
                                  <p className="break-words text-sm">
                                    {message.message}
                                  </p>
                                </div>
                                <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap shrink-0">
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
              </CardContent>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="메시지 입력..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onCompositionEnd={(e) => {
                      if (e.data && e.data.endsWith("\n")) {
                        handleSendMessage();
                      }
                    }}
                    className="flex-1"
                    disabled={!connected}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!connected || !newMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">채팅방을 선택해주세요</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
