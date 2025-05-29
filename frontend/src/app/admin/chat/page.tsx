"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
import {
  Search,
  Plus,
  Send,
  MoreVertical,
  Filter,
  X,
  Clock,
  CheckCheck,
  AlertCircle,
  Info,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  useAdminChatContext,
  AdminChatProvider,
} from "@/contexts/AdminChatContext";
import { format, parseISO, isToday } from "date-fns";
import { ko } from "date-fns/locale"; // 한국어 locale 추가
import { Spinner } from "@/components/ui/spinner";
import type { ChatroomType, ChatMessageType, ChatFilter } from "@/types/chat";
import * as api from "@/utils/api";
import { useGlobalAdminMember } from "@/auth/adminMember";

// 메인 컴포넌트를 AdminChatProvider로 감싸는 래퍼
export default function ChatManagementPage() {
  return (
    <AdminChatProvider>
      <ChatManagement />
    </AdminChatProvider>
  );
}

// 실제 채팅 관리 컴포넌트
function ChatManagement() {
  const {
    chatrooms,
    filteredChatrooms,
    selectedChatroom,
    messages,
    connecting,
    connected,
    filter,
    apartments,
    categories,
    createChatroom,
    joinChatroom,
    leaveChatroom,
    sendMessage,
    selectChatroom,
    disconnect,
    setFilter,
    closeChatroom,
    fetchApartments,
    fetchCategories,
    canAccessChatroom,
    markMessagesAsRead,
    setMessages,
  } = useAdminChatContext();

  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closeMessage, setCloseMessage] = useState(
    "관리자에 의해 대화가 종료되었습니다."
  );
  const [isClosing, setIsClosing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const { adminMember } = useGlobalAdminMember();
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "INACTIVE" | "ALL">(
    "ACTIVE"
  );
  const [initialized, setInitialized] = useState(false);

  // 페이징 처리를 위한 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 알림 토스트 상태 추가
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "info"
  );

  // 페이징된 채팅방 목록 계산
  const paginatedChatrooms = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredChatrooms.slice(startIndex, endIndex);
  }, [filteredChatrooms, currentPage, itemsPerPage]);

  // 총 페이지 수 계산
  const totalPages = useMemo(() => {
    return Math.ceil(filteredChatrooms.length / itemsPerPage);
  }, [filteredChatrooms, itemsPerPage]);

  // 채팅방 필터링
  useEffect(() => {
    setFilter({ status: activeTab });
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  }, [activeTab, setFilter]);

  // 관리자 역할에 따른 초기 필터 설정
  useEffect(() => {
    if (adminMember && !initialized) {
      // 매니저이고 소속 아파트가 있는 경우
      if (
        adminMember.roles.includes("MANAGER") &&
        !adminMember.roles.includes("ADMIN")
      ) {
        // apartmentId가 존재하는지 확인 (숫자 또는 문자열 형태일 수 있음)
        const apartmentId = adminMember.apartmentId;

        if (apartmentId !== null && apartmentId !== undefined) {
          // 숫자 타입으로 통일
          const numericApartmentId =
            typeof apartmentId === "string"
              ? parseInt(apartmentId)
              : apartmentId;

          // 필터 설정
          setFilter({ apartmentId: numericApartmentId });
        } else if (adminMember.apartmentName) {
          // 예비로직: ID가 없고 이름만 있는 경우 이름으로 아파트 찾기
          // 아파트 데이터 로드 후 실행
          fetchApartments().then((loadedApartments) => {
            const apartment = loadedApartments.find(
              (apt) => apt.name === adminMember.apartmentName
            );

            if (apartment) {
              setFilter({ apartmentId: apartment.id });
            }
          });
        }
      }

      setInitialized(true);
    }
  }, [adminMember, initialized, setFilter]);

  // 관리자의 소속 아파트 ID (숫자로 정규화)
  const managerApartmentId = useMemo(() => {
    // 매니저이고 apartmentId가 있는 경우
    if (
      adminMember?.roles.includes("MANAGER") &&
      !adminMember?.roles.includes("ADMIN") &&
      adminMember?.apartmentId !== null &&
      adminMember?.apartmentId !== undefined
    ) {
      // 문자열인 경우 숫자로 변환
      return typeof adminMember.apartmentId === "string"
        ? parseInt(adminMember.apartmentId)
        : adminMember.apartmentId;
    }

    // apartmentId가 없고 apartmentName만 있는 경우 (백업 로직)
    if (
      adminMember?.roles.includes("MANAGER") &&
      !adminMember?.roles.includes("ADMIN") &&
      !adminMember?.apartmentId &&
      adminMember?.apartmentName
    ) {
      const apartment = apartments.find(
        (apt) => apt.name === adminMember.apartmentName
      );
      return apartment?.id;
    }

    return undefined;
  }, [adminMember, apartments]);

  // 매니저이고 소속 아파트가 있는 경우 아파트 선택 비활성화
  const isApartmentSelectDisabled =
    adminMember?.roles.includes("MANAGER") &&
    !adminMember?.roles.includes("ADMIN") &&
    managerApartmentId !== undefined;

  // 초기 데이터 로드
  useEffect(() => {
    fetchApartments();
    fetchCategories();
  }, []);

  // 자동 스크롤 기능
  useEffect(() => {
    if (messagesEndRef.current && autoScroll) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

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

  // 다음 페이지로 이동
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // 이전 페이지로 이동
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // 특정 페이지로 이동
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 메시지 전송 처리
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChatroom) return;

    // 비활성화된 채팅방인 경우 메시지 전송 차단
    if (selectedChatroom.status === "INACTIVE") {
      showNotification("종료된 채팅방에는 메시지를 보낼 수 없습니다.", "error");
      return;
    }

    // 연결 상태가 아닌 경우 메시지 전송 차단
    if (!connected) {
      showNotification(
        "서버와 연결되어 있지 않습니다. 다시 시도해주세요.",
        "error"
      );
      return;
    }

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

  // 채팅방 생성 처리
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

  // 토스트 알림 표시 함수
  const showNotification = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000); // 3초 후 자동으로 닫힘
  };

  // 채팅방 종료 처리
  const handleCloseChatroom = async () => {
    if (!selectedChatroom) return;
    setIsClosing(true);
    try {
      await closeChatroom(selectedChatroom.id, closeMessage);
      setCloseDialogOpen(false);
      showNotification("채팅방이 성공적으로 종료되었습니다.", "success");
    } catch (error) {
      console.error("채팅방 종료 중 오류 발생:", error);
      showNotification("채팅방 종료 중 오류가 발생했습니다.", "error");
    } finally {
      setIsClosing(false);
    }
  };

  // 채팅방 선택 시 읽음 표시
  const handleSelectChatroom = async (chatroom: ChatroomType) => {
    // 이미 선택된 채팅방인 경우 무시
    if (selectedChatroom?.id === chatroom.id) {
      return;
    }

    // 관리자 권한 체크
    if (!canAccessChatroom(chatroom)) {
      alert("접근 권한이 없습니다.");
      return;
    }

    try {
      // 채팅방 선택
      await selectChatroom(chatroom);

      // 새 메시지 읽음 표시
      if (chatroom.hasNewMessage) {
        setTimeout(() => {
          markMessagesAsRead(chatroom.id);
        }, 1000);
      }

      // 비활성화된 채팅방인 경우 안내 메시지 표시
      if (chatroom.status === "INACTIVE") {
        // 비활성화 안내 메시지
        const inactiveNotice: ChatMessageType = {
          userId: 0,
          message: "이 채팅방은 종료되었습니다. 메시지 조회만 가능합니다.",
          isSystem: true,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        // 시스템 메시지로 추가
        setTimeout(() => {
          setMessages((prevMessages: ChatMessageType[]) => {
            // 이미 종료 메시지가 있는지 확인
            const hasNotice = prevMessages.some(
              (msg: ChatMessageType) =>
                msg.isSystem &&
                typeof msg.message === "string" &&
                msg.message.includes("종료되었습니다")
            );

            // 이미 있으면 기존 메시지 유지
            if (hasNotice) return prevMessages;

            // 없으면 메시지 추가
            return [...prevMessages, inactiveNotice];
          });
        }, 500);
      }
    } catch (error) {
      // 선택 실패 시 에러 처리
      console.error("채팅방 선택 중 오류가 발생했습니다:", error);
    }
  };

  // 타임스탬프 포맷팅 함수
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

  // 사용자 정보 포맷팅
  const formatUserInfo = (message: ChatMessageType) => {
    let displayName = message.userName || "시스템";

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

  // 카테고리 이름 가져오기
  const getCategoryName = (code: string | undefined) => {
    if (!code) return "";
    const category = categories.find((c) => c.code === code);
    return category ? category.name : code;
  };

  // 아파트 이름 가져오기
  const getApartmentName = (id: number | undefined) => {
    if (!id) return "";
    const apartment = apartments.find((a) => a.id === id);
    return apartment ? apartment.name : `아파트 #${id}`;
  };

  // 검색어 입력 처리
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter({ searchTerm: e.target.value });
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  };

  // 카테고리별 색상 정의
  const getCategoryColor = (code: string | undefined) => {
    if (!code) return { bg: "bg-gray-100", text: "text-gray-700" };

    switch (code) {
      case "A01": // 민원
        return { bg: "bg-red-100", text: "text-red-700" };
      case "A02": // 건의사항
        return { bg: "bg-purple-100", text: "text-purple-700" };
      case "A03": // 수리/정비
        return { bg: "bg-green-100", text: "text-green-700" };
      case "A04": // 보안/안전
        return { bg: "bg-yellow-100", text: "text-yellow-700" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-700" };
    }
  };

  // 채팅방 목록 아이템 컴포넌트
  const ChatRoomListItem = ({
    chatroom,
    isSelected,
    onSelect,
  }: {
    chatroom: ChatroomType;
    isSelected: boolean;
    onSelect: (chatroom: ChatroomType) => void;
  }) => {
    const categoryColor = getCategoryColor(chatroom.categoryCode);

    return (
      <div
        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
          isSelected ? "bg-muted" : ""
        }`}
        onClick={() => onSelect(chatroom)}
      >
        <div className="flex items-start gap-3">
          <Avatar>
            {chatroom.assignedAdmin?.profileImageUrl ? (
              <AvatarImage
                src={chatroom.assignedAdmin.profileImageUrl}
                alt={chatroom.assignedAdmin.userName}
              />
            ) : (
              <AvatarFallback>
                {chatroom.title?.charAt(0) || "C"}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-medium truncate">
                {chatroom.title ||
                  (chatroom.id ? `채팅방 #${chatroom.id}` : "채팅방")}
              </h4>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {chatroom.createdAt &&
                  format(new Date(chatroom.createdAt), "yyyy.MM.dd")}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              {chatroom.categoryCode && (
                <Badge
                  variant="outline"
                  className={`text-xs font-normal ${categoryColor.bg} ${categoryColor.text} border-0`}
                >
                  {getCategoryName(chatroom.categoryCode)}
                </Badge>
              )}
              {chatroom.apartmentId && (
                <span className="text-xs text-muted-foreground truncate">
                  {getApartmentName(chatroom.apartmentId)}
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              {/* 참여자 0명이 아닐 때만 표시 */}
              {(chatroom.userCount || 0) > 0 && (
                <span className="text-xs text-muted-foreground">
                  참여자 {chatroom.userCount}명
                </span>
              )}
              {chatroom.status === "INACTIVE" && (
                <Badge
                  variant="outline"
                  className="bg-gray-100 text-gray-400 text-xs border-0"
                >
                  종료됨
                </Badge>
              )}
              {chatroom.status === "ACTIVE" && (
                <Badge
                  variant="outline"
                  className="bg-blue-100 text-blue-500 text-xs border-0"
                >
                  진행중
                </Badge>
              )}
              {chatroom.hasNewMessage && (
                <>
                  <Badge className="h-2 w-2 rounded-full p-0 bg-red-500" />
                  <span className="text-xs text-red-500">새 메시지</span>
                </>
              )}
              {chatroom.assignedAdmin && (
                <Badge
                  variant="outline"
                  className="bg-purple-100 text-purple-500 text-xs"
                >
                  담당: {chatroom.assignedAdmin.userName}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 토스트 알림 컴포넌트
  const Toast = ({
    message,
    type,
    show,
    onClose,
  }: {
    message: string;
    type: "success" | "error" | "info";
    show: boolean;
    onClose: () => void;
  }) => {
    if (!show) return null;

    const bgColor = {
      success: "bg-green-100 border-green-400 text-green-700",
      error: "bg-red-100 border-red-400 text-red-700",
      info: "bg-blue-100 border-blue-400 text-blue-700",
    }[type];

    const icon = {
      success: <CheckCheck className="h-5 w-5 mr-2" />,
      error: <AlertCircle className="h-5 w-5 mr-2" />,
      info: <Info className="h-5 w-5 mr-2" />,
    }[type];

    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-5">
        <div
          className={`p-4 rounded-md shadow-lg border ${bgColor} flex items-center max-w-md`}
        >
          {icon}
          <span className="flex-1">{message}</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 h-6 w-6 p-0 rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">문의 관리</h1>
        <p className="text-muted-foreground">
          실시간 문의를 관리하고 입주민과 소통하세요.
        </p>
      </div>

      {/* 필터 영역 */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex-1 min-w-[200px]">
          <Select
            value={filter.apartmentId?.toString() || "all"}
            onValueChange={(value) => {
              setFilter({
                apartmentId: value === "all" ? undefined : parseInt(value),
              });
            }}
            disabled={isApartmentSelectDisabled}
          >
            <SelectTrigger
              className={isApartmentSelectDisabled ? "bg-gray-100" : ""}
            >
              <SelectValue placeholder="아파트 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 아파트</SelectItem>
              {apartments.map((apt) => {
                const isManagerApartment = managerApartmentId === apt.id;
                return (
                  <SelectItem key={apt.id} value={apt.id.toString()}>
                    {apt.name}
                    {isManagerApartment && " (내 소속)"}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Select
            value={filter.categoryCode || "all"}
            onValueChange={(value) =>
              setFilter({ categoryCode: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="카테고리 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 카테고리</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.code} value={cat.code}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Select
            value={
              filter.sortBy
                ? `${filter.sortBy}-${filter.sortOrder}`
                : "lastMessageTime-desc"
            }
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split("-");
              setFilter({
                sortBy: sortBy as "lastMessageTime" | "createdAt",
                sortOrder: sortOrder as "asc" | "desc",
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="정렬 방식" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lastMessageTime-desc">
                최근 메시지 순
              </SelectItem>
              <SelectItem value="lastMessageTime-asc">
                오래된 메시지 순
              </SelectItem>
              <SelectItem value="createdAt-desc">최근 생성 순</SelectItem>
              <SelectItem value="createdAt-asc">오래된 생성 순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-[2] min-w-[250px] relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="제목 검색..."
            className="pl-8"
            value={filter.searchTerm || ""}
            onChange={handleSearchChange}
          />
          {filter.searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7"
              onClick={() => {
                setFilter({ searchTerm: undefined });
                setCurrentPage(1);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
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

      {/* 탭 UI */}
      <Tabs
        defaultValue="ACTIVE"
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "ACTIVE" | "INACTIVE" | "ALL")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ACTIVE" className="relative">
            진행중 채팅
            {chatrooms.filter(
              (room) => room.status === "ACTIVE" && room.hasNewMessage
            ).length > 0 && (
              <Badge className="absolute top-1 right-1 h-2 w-2 p-0 bg-red-500 rounded-full" />
            )}
          </TabsTrigger>
          <TabsTrigger value="INACTIVE">종료된 채팅</TabsTrigger>
          <TabsTrigger value="ALL">전체 채팅</TabsTrigger>
        </TabsList>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
          <Card className="md:col-span-1 flex flex-col h-full">
            <CardHeader className="px-4 py-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">채팅방 목록</CardTitle>
                <Badge variant="outline">{filteredChatrooms.length}개</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-auto flex-grow">
              {filteredChatrooms.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  채팅방이 없습니다.
                </div>
              ) : (
                <div className="divide-y">
                  {paginatedChatrooms.map((chatroom) => (
                    <ChatRoomListItem
                      key={chatroom.id}
                      chatroom={chatroom}
                      isSelected={selectedChatroom?.id === chatroom.id}
                      onSelect={handleSelectChatroom}
                    />
                  ))}
                </div>
              )}

              {/* 페이징 컨트롤 */}
              {filteredChatrooms.length > 0 && (
                <div className="flex items-center justify-center py-4 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                  >
                    이전
                  </Button>
                  <span className="text-sm">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                  >
                    다음
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2 flex flex-col h-full">
            {selectedChatroom && (
              <>
                <CardHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {selectedChatroom.title?.charAt(0) || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {selectedChatroom.title ||
                          (selectedChatroom.id
                            ? `채팅방 #${selectedChatroom.id}`
                            : "채팅방")}
                        {selectedChatroom.status === "INACTIVE" && (
                          <Badge
                            variant="outline"
                            className="bg-gray-100 text-gray-400 ml-2 border-0"
                          >
                            종료됨
                          </Badge>
                        )}
                        {selectedChatroom.status === "ACTIVE" && (
                          <Badge
                            variant="outline"
                            className="bg-blue-100 text-blue-500 ml-2 border-0"
                          >
                            진행중
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        {selectedChatroom.categoryCode && (
                          <Badge
                            variant="outline"
                            className={`${
                              getCategoryColor(selectedChatroom.categoryCode).bg
                            } ${
                              getCategoryColor(selectedChatroom.categoryCode)
                                .text
                            } border-0`}
                          >
                            {getCategoryName(selectedChatroom.categoryCode)}
                          </Badge>
                        )}
                        {selectedChatroom.apartmentId && (
                          <span>
                            {getApartmentName(selectedChatroom.apartmentId)}
                          </span>
                        )}
                        {(selectedChatroom.userCount || 0) > 0 && (
                          <span>참여자 {selectedChatroom.userCount}명</span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  {selectedChatroom.status === "ACTIVE" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setCloseDialogOpen(true)}
                        >
                          채팅방 종료
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
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
                    [
                      ...new Map(
                        messages.map((message) => [
                          // 고유 키로 사용할 값 (우선순위: messageId > clientId > userId+message+timestamp)
                          message.messageId ||
                            message.clientId ||
                            `${message.userId}-${message.message}-${message.timestamp}`,
                          message,
                        ])
                      ).values(),
                    ].map((message, index) => {
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
                                    alt={message.userName || "시스템"}
                                  />
                                ) : (
                                  <AvatarFallback>
                                    {(message.userName || "시스템").charAt(0)}
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
                      placeholder={
                        selectedChatroom.status === "INACTIVE"
                          ? "이 채팅방은 종료되어 메시지를 보낼 수 없습니다"
                          : "메시지 입력..."
                      }
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className={`flex-1 ${
                        selectedChatroom.status === "INACTIVE"
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={
                        !connected || selectedChatroom.status === "INACTIVE"
                      }
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={
                        !connected ||
                        !newMessage.trim() ||
                        selectedChatroom.status === "INACTIVE"
                      }
                      className={
                        selectedChatroom.status === "INACTIVE"
                          ? "bg-gray-300 hover:bg-gray-300 cursor-not-allowed"
                          : ""
                      }
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  {selectedChatroom.status === "INACTIVE" && (
                    <div className="mt-2 text-center text-sm text-red-500 bg-red-50 p-1 rounded">
                      이 채팅방은 종료되어 메시지를 보낼 수 없습니다.
                    </div>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      </Tabs>

      {/* 채팅방 종료 확인 대화상자 */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500">채팅방 종료</DialogTitle>
            <DialogDescription className="pt-2">
              <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mb-3">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                  <p>
                    채팅방을 종료하면 더 이상 메시지를 주고받을 수 없으며,
                    <br />이 작업은 되돌릴 수 없습니다. 정말 종료하시겠습니까?
                  </p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          {/* <div className="py-4">
            <Label htmlFor="close-message" className="font-medium">
              종료 메시지 (선택)
            </Label>
            <Input
              id="close-message"
              value={closeMessage}
              onChange={(e) => setCloseMessage(e.target.value)}
              placeholder="종료 메시지를 입력하세요"
              className="mt-2"
            />
          </div> */}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCloseDialogOpen(false)}
              disabled={isClosing}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleCloseChatroom}
              disabled={isClosing}
            >
              {isClosing ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  종료 중...
                </>
              ) : (
                "채팅방 종료"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 토스트 알림 */}
      <Toast
        message={toastMessage}
        type={toastType}
        show={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
