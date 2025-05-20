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
import { Search, Plus, Send, MoreVertical } from "lucide-react";
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
import { useChatContext, ChatProvider } from "@/contexts/ChatContext";
import { format, parseISO, isToday } from "date-fns";
import { ko } from "date-fns/locale"; // 한국어 locale 추가
import { Spinner } from "@/components/ui/spinner";
import type { ChatroomType, ChatMessageType } from "@/types/chat";
import * as api from "@/utils/api";
import { useGlobalAdminMember } from "@/auth/adminMember";

// 메인 컴포넌트를 ChatProvider로 감싸는 래퍼
export default function ChatManagementPage() {
  return (
    <ChatProvider>
      <ChatManagement />
    </ChatProvider>
  );
}

// 실제 채팅 관리 컴포넌트
function ChatManagement() {
  const {
    chatrooms,
    selectedChatroom,
    messages,
    connecting,
    connected,
    createChatroom,
    joinChatroom,
    leaveChatroom,
    sendMessage,
    selectChatroom,
    disconnect,
  } = useChatContext();

  const [searchTerm, setSearchTerm] = useState("");
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const { adminMember } = useGlobalAdminMember();

  const filteredChatrooms = chatrooms.filter((chatroom) =>
    chatroom.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        "관리자 채팅방 목록 정보:",
        chatrooms.map((room) => ({
          id: room.id,
          title: room.title,
          hasNewMessage: room.hasNewMessage,
        }))
      );
    }
  }, [chatrooms]);

  // 채팅방 생성 처리

  // 메시지 전송 처리
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

  const handleCreateChatroom = async () => {
    if (!newRoomTitle.trim()) return;
    try {
      const createdChatroom = await createChatroom(newRoomTitle);
      setNewRoomTitle("");
      setCreateDialogOpen(false);
      if (createdChatroom) {
        selectChatroom(createdChatroom);
      }
    } catch (error) {
      console.error("채팅방 생성 중 오류 발생:", error);
    }
  };

  // 채팅방 선택 로직 개선
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
    // 가능한 이름 필드들을 확인합니다
    const possibleNameFields = [
      "userName",
      "username",
      "name",
      "nick",
      "nickname",
    ];

    // 디버깅 용도로 원본 데이터 확인
    console.log("formatUserInfo - 원본 메시지 객체:", message);
    console.log("formatUserInfo - 메시지 객체 키:", Object.keys(message));

    // 사용자 이름이 없거나 빈 문자열인 경우를 명시적으로 처리
    let displayName = "사용자";

    // userName 필드가 있는지 확인합니다
    if (message.userName && message.userName.trim() !== "") {
      displayName = message.userName;
      console.log("formatUserInfo - userName 필드 사용:", displayName);
    } else {
      // 다른 가능한 이름 필드들을 확인합니다
      for (const field of possibleNameFields) {
        if ((message as any)[field] && (message as any)[field].trim() !== "") {
          displayName = (message as any)[field];
          console.log(
            `formatUserInfo - 대체 이름 필드 사용: ${field} = ${displayName}`
          );
          break;
        }
      }
    }

    // 추가 정보와 함께 사용자 이름 형식 지정
    if (message.apartmentName && message.buildingName && message.unitNumber) {
      return `${displayName} (${message.apartmentName} ${message.buildingName}동 ${message.unitNumber}호)`;
    }

    if (message.apartmentName && !message.buildingName) {
      return `${displayName} (${message.apartmentName})`;
    }

    if (message.apartmentName && message.buildingName && !message.unitNumber) {
      return `${displayName} (${message.apartmentName} ${message.buildingName}동)`;
    }

    // userName만 있는 경우
    return displayName;
  };

  // 타임스탬프 포맷팅 함수 추가
  const formatTimestamp = (timestamp: string | undefined) => {
    if (!timestamp) return "";

    // 이미 "오전" 또는 "오후"가 포함된 포맷팅된 문자열인 경우 그대로 반환
    if (
      typeof timestamp === "string" &&
      (timestamp.includes("오전") || timestamp.includes("오후"))
    ) {
      return timestamp;
    }

    try {
      // ISO 문자열인 경우 parseISO 사용
      const date =
        typeof timestamp === "string"
          ? parseISO(timestamp)
          : new Date(timestamp);

      // 오늘 날짜인 경우 시간만 표시
      if (isToday(date)) {
        return format(date, "a h:mm", { locale: ko });
      } else {
        return format(date, "yyyy-MM-dd a h:mm", { locale: ko });
      }
    } catch (error) {
      console.error("타임스탬프 형식 변환 오류:", error, "원본 값:", timestamp);
      // 유효하지 않은 날짜 형식이면 원본 그대로 반환
      return typeof timestamp === "string" ? timestamp : "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">채팅 관리</h1>
        <p className="text-muted-foreground">
          실시간 채팅방을 관리하고 입주민과 소통하세요.
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
              <Dialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm" className="ml-2">
                    <Plus className="h-4 w-4 mr-1" />새 채팅
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>새 채팅방 만들기</DialogTitle>
                    <DialogDescription>
                      새로운 채팅방을 생성합니다. 제목을 입력하세요.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="chatroom-title">채팅방 제목</Label>
                    <Input
                      id="chatroom-title"
                      value={newRoomTitle}
                      onChange={(e) => setNewRoomTitle(e.target.value)}
                      placeholder="채팅방 제목을 입력하세요"
                      className="mt-2"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                    >
                      취소
                    </Button>
                    <Button onClick={handleCreateChatroom}>생성</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-auto flex-grow">
            {filteredChatrooms.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                채팅방이 없습니다. 새 채팅방을 만들어보세요.
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
                          <span className="text-xs text-muted-foreground">
                            참여자 {chatroom.userCount || 0}명
                          </span>
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
                    <CardDescription>
                      참여자 {selectedChatroom.userCount || 0}명
                      <span className="hidden">
                        {JSON.stringify({
                          id: selectedChatroom.id,
                          title: selectedChatroom.title,
                          hasTitle: selectedChatroom.title ? true : false,
                        })}
                      </span>
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        if (selectedChatroom) {
                          const confirm =
                            window.confirm("정말 채팅방을 나가시겠습니까?");
                          if (confirm) {
                            leaveChatroom(selectedChatroom.id);
                          }
                        }
                      }}
                    >
                      채팅방 나가기
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                    <span className="text-black dark:text-black">
                      ↓ 새 메시지로 이동
                    </span>
                  </Button>
                )}

                {!connecting &&
                  messages.map((message, index) => {
                    // 관리자인지 확인
                    const isAdminMessage =
                      adminMember && message.userId === adminMember.id;

                    // 고유한 키 생성
                    const uniqueKey = `${message.id || "msg"}-${index}-${
                      message.userId
                    }-${Date.now()}`;

                    return (
                      <div
                        key={uniqueKey}
                        className={`flex ${
                          message.isNew ? "ultra-smooth-animation" : ""
                        } ${
                          message.isSystem
                            ? "justify-center"
                            : isAdminMessage
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
                              isAdminMessage ? "flex-row-reverse" : "flex-row"
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
                                isAdminMessage ? "items-end" : "items-start"
                              }`}
                            >
                              {/* User Info (only for other's messages, above bubble) */}
                              {!isAdminMessage && (
                                <p className="text-xs mb-1 font-medium dark:text-white text-black">
                                  {formatUserInfo(message)}
                                </p>
                              )}

                              {/* Bubble and Timestamp are siblings, arranged horizontally */}
                              <div
                                className={`flex items-end gap-1 ${
                                  isAdminMessage
                                    ? "flex-row-reverse"
                                    : "flex-row"
                                }`}
                              >
                                {/* Message Bubble */}
                                <div
                                  className={`max-w-xs rounded-lg p-3 ultra-smooth-transition ${
                                    // Constrained max-width for bubble
                                    isAdminMessage
                                      ? "bg-[#f795a7] dark:bg-pink-800 text-black dark:text-white" // Pink for my messages
                                      : "bg-[#f0f0f0] dark:bg-gray-700 text-black dark:text-white" // Gray for other's messages
                                  }`}
                                >
                                  <p className="text-sm font-medium break-words">
                                    {message.message}
                                  </p>
                                </div>
                                {/* Timestamp */}
                                <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
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
