"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { Client, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { ChatroomType, ChatMessageType, ChatFilter } from "@/types/chat";
import {
  checkAdminAuth,
  getAdminChatrooms,
  getAdminChatMessages,
  getAdminChatroom,
  createAdminChatroom,
  joinAdminChatroom,
  leaveAdminChatroom,
  get,
  post,
  del,
  closeChatroom as apiCloseChatroom,
} from "@/utils/api";
import { useGlobalAdminMember } from "@/auth/adminMember";

// API 응답 타입 정의
interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

// 확장된 타입 정의
interface AdminChatContextType {
  chatrooms: ChatroomType[];
  filteredChatrooms: ChatroomType[];
  selectedChatroom: ChatroomType | null;
  messages: ChatMessageType[];
  connecting: boolean;
  connected: boolean;
  filter: ChatFilter;
  apartments: { id: number; name: string }[];
  categories: { code: string; name: string }[];

  // 기존 함수들
  createChatroom: (title: string) => Promise<ChatroomType | void>;
  joinChatroom: (chatroomId: number) => Promise<void>;
  leaveChatroom: (chatroomId: number) => Promise<void>;
  sendMessage: (message: string) => void;
  selectChatroom: (chatroom: ChatroomType) => void;
  disconnect: () => void;

  // 새로운 함수들
  setFilter: (filter: Partial<ChatFilter>) => void;
  closeChatroom: (chatroomId: number, closeMessage?: string) => Promise<void>;
  fetchApartments: () => Promise<any[]>;
  fetchCategories: () => Promise<any[]>;
  canAccessChatroom: (chatroom: ChatroomType) => boolean;
  markMessagesAsRead: (chatroomId: number) => Promise<boolean>;
  assignAdmin: (chatroomId: number, adminId: number) => Promise<boolean>;

  // 메시지 상태 설정 함수
  setMessages: React.Dispatch<React.SetStateAction<ChatMessageType[]>>;
}

const AdminChatContext = createContext<AdminChatContextType | undefined>(
  undefined
);

export function useAdminChatContext() {
  const context = useContext(AdminChatContext);
  if (!context) {
    throw new Error(
      "useAdminChatContext must be used within a AdminChatProvider"
    );
  }
  return context;
}

interface AdminChatProviderProps {
  children: ReactNode;
}

export function AdminChatProvider({ children }: AdminChatProviderProps) {
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [subscription, setSubscription] = useState<StompSubscription | null>(
    null
  );
  const [updateSubscription, setUpdateSubscription] =
    useState<StompSubscription | null>(null);
  const [chatrooms, setChatrooms] = useState<ChatroomType[]>([]);
  const [filteredChatrooms, setFilteredChatrooms] = useState<ChatroomType[]>(
    []
  );
  const [selectedChatroom, setSelectedChatroom] = useState<ChatroomType | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [filter, setFilterState] = useState<ChatFilter>({
    status: "ACTIVE",
    sortBy: "lastMessageTime",
    sortOrder: "desc",
  });
  const [apartments, setApartments] = useState<{ id: number; name: string }[]>(
    []
  );
  const [categories, setCategories] = useState<
    { code: string; name: string }[]
  >([]);

  // 채팅방 목록 갱신 디바운싱을 위한 타이머 ref
  const updateChatroomListTimeout = useRef<NodeJS.Timeout | null>(null);

  // 관리자 사용자 정보 사용 - 직접 참조만 하고 상태로 저장하지 않음
  const { adminMember, isAdminLogin } = useGlobalAdminMember();

  // 초기화 상태를 관리하는 ref
  const initRef = useRef(false);
  // API 호출 중인지 추적하는 ref
  const isLoadingRef = useRef(false);

  // 필터 변경 함수
  const setFilter = useCallback((newFilter: Partial<ChatFilter>) => {
    if (
      newFilter.apartmentId !== undefined &&
      typeof newFilter.apartmentId === "string"
    ) {
      newFilter.apartmentId = parseInt(newFilter.apartmentId);
    }

    setFilterState((prev) => ({ ...prev, ...newFilter }));
  }, []);

  // 관리자 권한에 따른 채팅방 접근 제어
  const canAccessChatroom = useCallback(
    (chatroom: ChatroomType) => {
      if (!adminMember) return false;
      if (adminMember.roles.includes("ADMIN")) return true;
      if (adminMember.roles.includes("MANAGER")) {
        return true;
      }
      return false;
    },
    [adminMember]
  );

  // 필터링된 채팅방 계산
  useEffect(() => {
    if (!chatrooms.length) {
      setFilteredChatrooms([]);
      return;
    }

    let filtered = [...chatrooms];

    // 권한 및 아파트 필터링은 API에서 처리됨
    // 관리자 역할과 상관없이 동일한 필터링 로직 적용

    // 상태 필터링
    if (filter.status && filter.status !== "ALL") {
      filtered = filtered.filter((room) => room.status === filter.status);
    }

    // 아파트 필터링
    if (filter.apartmentId) {
      filtered = filtered.filter(
        (room) => room.apartmentId === filter.apartmentId
      );
    }

    // 카테고리 필터링
    if (filter.categoryCode) {
      filtered = filtered.filter(
        (room) => room.categoryCode === filter.categoryCode
      );
    }

    // 검색어 필터링
    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (room) =>
          room.title?.toLowerCase().includes(term) ||
          room.apartmentName?.toLowerCase().includes(term) ||
          room.categoryName?.toLowerCase().includes(term)
      );
    }

    // 정렬
    if (filter.sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[filter.sortBy!] || "";
        const bValue = b[filter.sortBy!] || "";

        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return filter.sortOrder === "asc" ? comparison : -comparison;
      });
    }

    setFilteredChatrooms(filtered);
  }, [chatrooms, filter]);

  // 아파트 목록 가져오기
  const fetchApartments = useCallback(async () => {
    try {
      // 백엔드 API가 없는 경우 임시 데이터 사용
      const mockApartments = [
        { id: 1, name: "한빛 1차 아파트" },
        { id: 2, name: "한빛 2차 아파트" },
        { id: 3, name: "푸른 마을 아파트" },
      ];

      try {
        // 실제 API 호출 시도
        const response = await get<{ data: any[] }>(
          "/api/v1/admin/chat/apartments"
        );
        if (response && response.data) {
          setApartments(response.data);
          return response.data;
        }
      } catch (error) {
        console.log("아파트 목록 API 없음, 임시 데이터 사용:", error);
      }

      // API 실패 시 임시 데이터 사용
      setApartments(mockApartments);
      return mockApartments;
    } catch (error) {
      console.error("아파트 목록 가져오기 실패:", error);
      return [];
    }
  }, []);

  // 카테고리 목록 가져오기
  const fetchCategories = useCallback(async () => {
    try {
      // 백업 카테고리 (API가 없는 경우)
      const backupCategories = [
        { code: "A01", name: "민원" },
        { code: "A02", name: "건의사항" },
        { code: "A03", name: "수리/정비" },
        { code: "A04", name: "보안/안전" },
      ];

      try {
        // ChatCategory enum의 값들을 가져오기
        const response = await get<{ data: any[] }>(
          "/api/v1/admin/chat-categories"
        );
        if (response && response.data) {
          setCategories(response.data);
          return response.data;
        }
      } catch (error) {
        console.log("카테고리 목록 API 없음, 백업 데이터 사용:", error);
      }

      // API 실패 시 백업 데이터 사용
      setCategories(backupCategories);
      return backupCategories;
    } catch (error) {
      console.error("카테고리 목록 가져오기 실패:", error);
      return [];
    }
  }, []);

  // 초기화 시 아파트와 카테고리 정보도 가져오기
  useEffect(() => {
    if (
      initRef.current ||
      isLoadingRef.current ||
      !isAdminLogin ||
      !adminMember?.id
    ) {
      return;
    }

    async function initData() {
      isLoadingRef.current = true;
      try {
        console.log(
          "AdminChatContext initData 호출:",
          new Date().toISOString()
        );
        await Promise.all([
          fetchChatrooms(),
          fetchApartments(),
          fetchCategories(),
        ]);
        initRef.current = true;
      } catch (error) {
        console.error("초기 데이터 로드 실패:", error);
      } finally {
        isLoadingRef.current = false;
      }
    }

    initData();
  }, [isAdminLogin, adminMember?.id]);

  // 채팅방 목록 가져오기
  const fetchChatrooms = async () => {
    console.log("fetchChatrooms called");
    try {
      const response = await getAdminChatrooms();
      let apiChatrooms = response;

      if (response && typeof response === "object" && "data" in response) {
        apiChatrooms = response.data;
      }

      if (!Array.isArray(apiChatrooms)) {
        setChatrooms([]);
        return [];
      }

      const formattedChatrooms: ChatroomType[] = apiChatrooms.map(
        (room: any) => ({
          id: room.id,
          title: room.title || "",
          hasNewMessage: room.hasNewMessage || false,
          userCount: room.userCount || 0,
          createdAt: room.createdAt || "",
          status: room.status || "ACTIVE",
          categoryCode: room.categoryCode,
          apartmentId: room.apartmentId,
          apartmentName: room.apartmentName,
          categoryName: getCategoryNameByCode(room.categoryCode),
          lastMessageTime: room.lastMessageTime || room.createdAt,
        })
      );

      console.log("[AdminChatContext][fetchChatrooms] API 응답:", response);
      console.log(
        "[AdminChatContext][fetchChatrooms] setChatrooms 호출, 기존 상태:",
        chatrooms
      );
      setChatrooms(formattedChatrooms);
      console.log(
        "[AdminChatContext][fetchChatrooms] setChatrooms 후 상태:",
        formattedChatrooms
      );

      if (
        adminMember &&
        Array.isArray(adminMember.roles) &&
        adminMember.roles.includes("MANAGER")
      ) {
        console.log("[AdminChatContext][MANAGER] 로그인 사용자:", {
          id: adminMember.id,
          roles: adminMember.roles,
          apartmentId: adminMember.apartmentId,
          userName: adminMember.userName,
        });
        if (Array.isArray(response)) {
          console.log(
            "[AdminChatContext][MANAGER] 불러온 채팅방 목록:",
            response.map((room) => ({
              id: room.id,
              apartmentId: room.apartmentId,
              title: room.title,
              status: room.status,
            }))
          );
        }
      }

      return formattedChatrooms;
    } catch (error) {
      setChatrooms([]);
      return [];
    }
  };

  // 카테고리 코드로 이름 찾기
  const getCategoryNameByCode = (code?: string): string => {
    if (!code) return "";
    const category = categories.find((cat) => cat.code === code);
    return category ? category.name : code;
  };

  // 메시지 목록 가져오기
  const fetchMessages = async (chatroomId: number) => {
    try {
      // 관리자용 API 사용
      const apiMessages = await getAdminChatMessages(chatroomId);
      if (apiMessages) {
        // 타임스탬프가 없는 메시지에 타임스탬프 추가
        const messagesWithUserInfo = await Promise.all(
          apiMessages.map(async (message: any) => {
            // 기본 필드 설정
            // 타입 변환
            const messageWithInfo: ChatMessageType = {
              id:
                typeof message.id === "string"
                  ? parseInt(message.id)
                  : message.id,
              userId: message.userId,
              message: message.message,
              timestamp:
                message.timestamp ||
                new Date(
                  message.id
                    ? typeof message.id === "string"
                      ? parseInt(message.id)
                      : message.id
                    : Date.now()
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              isSystem: message.isSystem,
              isNew: message.isNew,
              isMyMessage: message.isMyMessage,
              userName: message.userName,
              profileImageUrl: message.profileImageUrl || undefined,
              apartmentName: message.apartmentName || undefined,
              buildingName: message.buildingName || undefined,
              unitNumber: message.unitNumber || undefined,
            };

            // 사용자 정보가 이미 포함되어 있으면 그대로 사용
            if (message.userName) {
              return messageWithInfo;
            }

            // 현재 사용자(관리자)의 메시지인지 확인
            if (message.userId === adminMember?.id) {
              return {
                ...messageWithInfo,
                userName: adminMember.userName,
                profileImageUrl: adminMember.profileImageUrl || undefined,
                apartmentName: adminMember.apartmentName || undefined,
                buildingName: adminMember.buildingName || undefined,
                unitNumber: adminMember.unitNumber || undefined,
              };
            }

            // 다른 사용자 메시지는 그대로 반환
            return messageWithInfo;
          })
        );

        setMessages(messagesWithUserInfo);
        return messagesWithUserInfo;
      }
      return [];
    } catch (error) {
      console.error("관리자용 메시지 불러오기 실패:", error);
      return [];
    }
  };

  // 채팅방 생성
  const createChatroom = async (title: string) => {
    try {
      // 관리자용 API 사용
      const apiChatroom = await createAdminChatroom(title);

      // 타입 변환
      const formattedChatroom: ChatroomType = {
        id: apiChatroom.id,
        title: apiChatroom.title || "",
        hasNewMessage: apiChatroom.hasNewMessage || false,
        userCount: apiChatroom.userCount || 0,
        createdAt: apiChatroom.createdAt || "",
      };

      // 채팅방 목록 새로고침
      await fetchChatrooms();
      return formattedChatroom;
    } catch (error) {
      console.error("관리자용 채팅방 생성 실패:", error);
      throw error;
    }
  };

  // 채팅방 선택
  const selectChatroom = async (chatroom: ChatroomType) => {
    console.log("[AdminChatContext][selectChatroom] 선택 요청:", chatroom);

    // 이미 선택된 채팅방인 경우 무시
    if (selectedChatroom?.id === chatroom.id) {
      console.log("📌 이미 선택된 채팅방입니다:", chatroom.id);
      return;
    }

    try {
      // 기존 연결이 있으면 해제
      if (stompClient) {
        stompClient.deactivate();

        if (subscription) {
          try {
            subscription.unsubscribe();
          } catch (e) {
            console.warn("구독 해제 중 오류:", e);
          }
        }

        if (updateSubscription) {
          try {
            updateSubscription.unsubscribe();
          } catch (e) {
            console.warn("업데이트 구독 해제 중 오류:", e);
          }
        }

        setStompClient(null);
        setSubscription(null);
        setUpdateSubscription(null);
      }

      // 연결 상태 초기화
      setConnected(false);
      setConnecting(false);

      // 중요: 먼저 기본 정보로 채팅방 선택 상태 설정
      // 이렇게 하면 서버 오류가 발생해도 UI가 업데이트됨
      console.log(
        "[AdminChatContext][selectChatroom] setSelectedChatroom 호출, 기존 상태:",
        selectedChatroom
      );
      setSelectedChatroom({ ...chatroom, status: chatroom.status || "ACTIVE" });
      console.log(
        "[AdminChatContext][selectChatroom] setSelectedChatroom 후 상태:",
        { ...chatroom, status: chatroom.status || "ACTIVE" }
      );

      // 채팅방 정보를 먼저 조회하여 상태 확인
      try {
        const apiChatroom = await getAdminChatroom(chatroom.id);
        console.log("채팅방 정보 조회 결과:", apiChatroom);

        // 채팅방 정보 객체 생성 - 모든 필드 포함
        const formattedChatroom: ChatroomType = {
          id: apiChatroom.id,
          title: apiChatroom.title || chatroom.title || "", // 기존 제목 유지
          hasNewMessage: apiChatroom.hasNewMessage || false,
          userCount: apiChatroom.userCount || 0,
          createdAt: apiChatroom.createdAt || "",
          status: apiChatroom.status || "ACTIVE",
          categoryCode: apiChatroom.categoryCode,
          apartmentId: apiChatroom.apartmentId,
        };

        // 채팅방 상태 설정 - API에서 받은 최신 정보로 업데이트
        setSelectedChatroom(formattedChatroom);

        // 채팅방이 비활성화 상태인지 확인
        const isInactive = apiChatroom.status === "INACTIVE";

        // 메시지 목록 가져오기
        await fetchMessages(chatroom.id);

        // 비활성화된 채팅방인 경우 WebSocket 연결하지 않음
        if (isInactive) {
          console.log(
            `채팅방 ${chatroom.id}는 비활성화 상태입니다. WebSocket 연결을 하지 않습니다.`
          );
          setConnecting(false);
          setConnected(false);
          return;
        }

        // 활성화된 채팅방이면 참여 처리 및 WebSocket 연결
        // 중요: 선택된 채팅방 ID가 아닌 직접 chatroom.id를 전달
        await joinChatroom(chatroom.id);
      } catch (error) {
        console.error("채팅방 정보 조회 중 오류:", error);

        // 오류가 발생해도 메시지는 가져오기 시도
        try {
          await fetchMessages(chatroom.id);
        } catch (msgError) {
          console.warn("메시지 목록 가져오기 실패:", msgError);
          setMessages([]);
        }

        // 오류가 발생해도 채팅방 참여 시도
        try {
          // 중요: 선택된 채팅방 ID가 아닌 직접 chatroom.id를 전달
          await joinChatroom(chatroom.id);
        } catch (joinError) {
          console.error("채팅방 참여 중 오류:", joinError);
          // 연결 실패 시 상태 업데이트
          setConnecting(false);
          setConnected(false);
        }
      }
    } catch (error) {
      console.error("채팅방 선택 중 오류:", error);
      setConnecting(false);
      setConnected(false);
    }
  };

  // 채팅방 참여
  const joinChatroom = async (chatroomId: number) => {
    console.log(
      "[AdminChatContext][joinChatroom] 참여 요청 chatroomId:",
      chatroomId
    );

    try {
      const currentChatroomId = selectedChatroom?.id;

      // 채팅방 상태 확인을 위한 정보 조회
      try {
        const apiChatroom = await getAdminChatroom(chatroomId);
        console.log("채팅방 정보 조회 결과:", apiChatroom);

        // 채팅방 정보 객체 생성 - 모든 필드 포함
        const formattedChatroom: ChatroomType = {
          id: apiChatroom.id,
          title: apiChatroom.title || "",
          hasNewMessage: apiChatroom.hasNewMessage || false,
          userCount: apiChatroom.userCount || 0,
          createdAt: apiChatroom.createdAt || "",
          status: apiChatroom.status || "ACTIVE",
          categoryCode: apiChatroom.categoryCode,
          apartmentId: apiChatroom.apartmentId,
        };

        // 중요: 먼저 선택된 채팅방을 설정하여 연결이 끊기는 문제 방지
        console.log(
          "[AdminChatContext][joinChatroom] setSelectedChatroom 호출, 기존 상태:",
          selectedChatroom
        );
        setSelectedChatroom(formattedChatroom);
        console.log(
          "[AdminChatContext][joinChatroom] setSelectedChatroom 후 상태:",
          formattedChatroom
        );

        // 비활성화된 채팅방인 경우 참여 시도하지 않음
        if (apiChatroom && apiChatroom.status === "INACTIVE") {
          console.log(
            `채팅방 ${chatroomId}는 비활성화 상태입니다. 참여하지 않고 메시지만 표시합니다.`
          );

          // 메시지 목록 가져오기
          try {
            await fetchMessages(chatroomId);
          } catch (error) {
            console.warn("메시지 목록 가져오기 실패:", error);
            setMessages([]);
          }

          // 연결 상태 설정 (비활성화)
          setConnecting(false);
          setConnected(false);
          return;
        }

        // 활성화된 채팅방인 경우 이미 참여했는지 확인
        const isAlreadyJoined = chatrooms.some(
          (room) => room.id === chatroomId && room.userCount > 0
        );

        console.log(`채팅방 ${chatroomId} 이미 참여 여부:`, isAlreadyJoined);

        // 이미 참여한 경우 API 호출 건너뜀
        if (isAlreadyJoined) {
          console.log("이미 참여 중인 채팅방입니다. API 호출을 건너뜁니다.");

          // 메시지 목록 가져오기
          await fetchMessages(chatroomId);

          // 스톰프 연결 설정 - 활성화된 채팅방
          // 중요: 명시적으로 chatroomId 전달
          setConnecting(true);
          connectStomp(chatroomId, formattedChatroom);
          return;
        }

        // 아직 참여하지 않은 활성화된 채팅방인 경우 참여 API 호출
        try {
          await joinAdminChatroom(chatroomId, currentChatroomId);
          console.log(`채팅방 ${chatroomId}에 성공적으로 참여했습니다.`);
        } catch (error) {
          // 이미 참여한 채팅방 에러는 무시하고 계속 진행
          if (
            error instanceof Error &&
            error.message.includes("이미 참여한 채팅방입니다")
          ) {
            console.log("이미 참여한 채팅방입니다. 계속 진행합니다.");
          } else if (
            error instanceof Error &&
            error.message.includes("비활성화된 채팅방")
          ) {
            console.log("비활성화된 채팅방입니다. 메시지만 표시합니다.");

            // 채팅방 상태 업데이트
            setSelectedChatroom((prev) =>
              prev ? { ...prev, status: "INACTIVE" } : null
            );

            // 메시지 목록 가져오기
            await fetchMessages(chatroomId);

            // 연결 상태 설정
            setConnecting(false);
            setConnected(false);
            return;
          } else {
            // 다른 오류는 로그만 남기고 진행 시도
            console.error("채팅방 참여 중 오류 발생:", error);
          }
        }

        // 메시지 목록 가져오기
        await fetchMessages(chatroomId);

        // 연결 시도
        setConnecting(true);
        // 중요: 채팅방 객체 전체를 전달하여 일관성 보장
        connectStomp(chatroomId, formattedChatroom);
      } catch (error) {
        console.error("채팅방 정보 조회 중 오류 발생:", error);

        // 오류 발생해도 채팅방은 선택되어야 함
        const fallbackChatroom: ChatroomType = {
          id: chatroomId,
          title: `채팅방 #${chatroomId}`,
          status: "ACTIVE",
          hasNewMessage: false,
          userCount: 0,
          createdAt: new Date().toISOString(),
        };

        setSelectedChatroom(fallbackChatroom);

        // 메시지 가져오기 시도
        try {
          await fetchMessages(chatroomId);
        } catch (msgError) {
          console.warn("메시지 목록 가져오기 실패:", msgError);
          setMessages([]);
        }

        // 연결 시도
        setConnecting(true);
        // 중요: 명시적으로 fallbackChatroom 전달
        connectStomp(chatroomId, fallbackChatroom);
      }
    } catch (error) {
      console.error("채팅방 참여 처리 중 오류 발생:", error);
      setConnecting(false);
    }
  };

  // STOMP 클라이언트 연결
  const connectStomp = (chatroomId: number, chatroom: ChatroomType) => {
    if (!chatroom) {
      setConnecting(false);
      setConnected(false);
      return;
    }

    if (chatroom.status === "INACTIVE") {
      setConnecting(false);
      setConnected(false);

      const inactiveSystemMessage: ChatMessageType = {
        userId: 0,
        message: "이 채팅방은 종료되었습니다. 메시지를 보낼 수 없습니다.",
        isSystem: true,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prevMessages) => {
        const hasSystemMessage = prevMessages.some(
          (msg) => msg.isSystem && msg.message.includes("종료")
        );

        if (hasSystemMessage) return prevMessages;

        return [...prevMessages, inactiveSystemMessage];
      });

      return;
    }

    if (chatroom.id !== chatroomId) {
      chatroomId = chatroom.id;
    }

    if (stompClient) {
      stompClient.deactivate();
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (e) {}
      }

      if (updateSubscription) {
        try {
          updateSubscription.unsubscribe();
        } catch (e) {}
      }

      setStompClient(null);
      setSubscription(null);
      setUpdateSubscription(null);
    }

    setConnecting(true);

    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8090";

    try {
      const client = new Client({
        webSocketFactory: () => {
          const socket = new SockJS(`${apiBaseUrl}/stomp/chats`);
          // @ts-ignore - SockJS 타입 정의에는 없지만 실제로는 존재하는 속성
          socket.withCredentials = true; // 인증 쿠키 전송을 위한 설정 추가
          return socket;
        },
        debug: function (str) {
          console.log(str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      client.onConnect = () => {
        setConnecting(false);
        setConnected(true);

        try {
          const chatSubscription = client.subscribe(
            `/sub/chats/${chatroomId}`,
            (message) => {
              try {
                const receivedMessage = JSON.parse(message.body);

                setMessages((prevMessages) => {
                  const isDuplicate = prevMessages.some((msg) => {
                    if (
                      receivedMessage.messageId &&
                      msg.messageId === receivedMessage.messageId
                    ) {
                      return true;
                    }

                    if (
                      receivedMessage.clientId &&
                      msg.clientId === receivedMessage.clientId
                    ) {
                      return true;
                    }

                    const isRecentDuplicateContent =
                      msg.message === receivedMessage.message &&
                      msg.userId === receivedMessage.userId &&
                      msg.isPreview === true &&
                      Date.now() - (msg.clientTimestamp || 0) < 3000;

                    if (isRecentDuplicateContent) {
                      return true;
                    }

                    return false;
                  });

                  if (isDuplicate) {
                    return prevMessages.map((msg) => {
                      const isMatch =
                        (receivedMessage.clientId &&
                          msg.clientId === receivedMessage.clientId) ||
                        (msg.message === receivedMessage.message &&
                          msg.userId === receivedMessage.userId &&
                          msg.isPreview === true &&
                          Date.now() - (msg.clientTimestamp || 0) < 3000);

                      if (isMatch) {
                        return {
                          ...msg,
                          ...receivedMessage,
                          messageId: receivedMessage.messageId || msg.messageId,
                          isPreview: false,
                          isNew: msg.isNew,
                        };
                      }
                      return msg;
                    });
                  }

                  return [
                    ...prevMessages,
                    {
                      ...receivedMessage,
                      isNew: true,
                      isPreview: false,
                    },
                  ];
                });

                if (updateChatroomListTimeout.current) {
                  clearTimeout(updateChatroomListTimeout.current);
                }

                updateChatroomListTimeout.current = setTimeout(() => {
                  fetchChatrooms().catch(() => {});
                  updateChatroomListTimeout.current = null;
                }, 500);
              } catch (error) {}
            }
          );

          const updateSub = client.subscribe(
            "/sub/chats/updates",
            (message) => {
              try {
                const update = JSON.parse(message.body);

                if (updateChatroomListTimeout.current) {
                  clearTimeout(updateChatroomListTimeout.current);
                }

                updateChatroomListTimeout.current = setTimeout(() => {
                  fetchChatrooms().catch(() => {});
                  updateChatroomListTimeout.current = null;
                }, 500);
              } catch (error) {}
            }
          );

          setSubscription(chatSubscription);
          setUpdateSubscription(updateSub);

          if (adminMember) {
            setMessages((prev) => {
              const hasEnterMessage = prev.some(
                (msg) =>
                  msg.isSystem &&
                  msg.message.includes("입장") &&
                  msg.message.includes(adminMember.userName || "")
              );

              if (hasEnterMessage) return prev;

              return [
                ...prev,
                {
                  userId: 0,
                  message: `${
                    adminMember.userName || "관리자"
                  }님이 입장하셨습니다.`,
                  isSystem: true,
                  timestamp: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                } as ChatMessageType,
              ];
            });
          }
        } catch (error) {
          setConnected(false);
        }
      };

      client.onStompError = (frame) => {
        setConnecting(false);
        setConnected(false);

        const errorMessage: ChatMessageType = {
          userId: 0,
          message:
            "서버 연결 중 오류가 발생했습니다. 페이지를 새로고침해 주세요.",
          isSystem: true,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      };

      client.onWebSocketClose = () => {
        setConnected(false);
      };

      client.onWebSocketError = (event) => {
        setConnecting(false);
        setConnected(false);

        const errorMessage: ChatMessageType = {
          userId: 0,
          message:
            "서버 연결 중 오류가 발생했습니다. 페이지를 새로고침해 주세요.",
          isSystem: true,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      };

      client.activate();
      setStompClient(client);
    } catch (error) {
      setConnecting(false);
      setConnected(false);
    }
  };

  // 채팅방 나가기
  const leaveChatroom = async (chatroomId: number) => {
    try {
      // 관리자용 API 사용
      await leaveAdminChatroom(chatroomId);
      setSelectedChatroom(null);
      setMessages([]);
      if (stompClient) {
        stompClient.deactivate();
        setStompClient(null);
        setConnected(false);
      }
      await fetchChatrooms();
    } catch (error) {
      console.error("관리자용 채팅방 나가기 실패:", error);
      throw error;
    }
  };

  // 연결 해제
  const disconnect = () => {
    if (stompClient) {
      stompClient.deactivate();
      setStompClient(null);
      setConnected(false);
      setSelectedChatroom(null);
      setMessages([]);
    }
  };

  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 연결 해제
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, [stompClient]);

  // 채팅방 종료 기능
  const closeChatroom = async (chatroomId: number, closeMessage?: string) => {
    try {
      // 채팅방 종료 API 호출 (백엔드에 구현되어 있지 않으면 기존 API 활용)
      try {
        // 전용 API가 있는 경우
        await post(`/api/v1/admin/chats/${chatroomId}/close`, {});
      } catch (error) {
        // 전용 API가 없는 경우 기존 API 활용
        console.log("채팅방 종료 전용 API 없음, 기존 API 활용:", error);
        await apiCloseChatroom(chatroomId);
      }

      // 종료 메시지 전송 (옵션)
      if (closeMessage && stompClient && connected) {
        const systemMessage = {
          message: closeMessage || "관리자에 의해 대화가 종료되었습니다.",
          userId: 0, // 시스템 메시지
          isSystem: true,
        };

        stompClient.publish({
          destination: `/pub/chats/${chatroomId}`,
          body: JSON.stringify(systemMessage),
        });
      }

      // 채팅방 목록 갱신
      await fetchChatrooms();

      // 현재 선택된 채팅방이 종료된 채팅방인 경우, 상태 업데이트
      if (selectedChatroom?.id === chatroomId) {
        setSelectedChatroom((prev) =>
          prev ? { ...prev, status: "INACTIVE" } : null
        );
      }
    } catch (error) {
      console.error("채팅방 종료 실패:", error);
      throw error;
    }
  };

  // 메시지 읽음 표시
  const markMessagesAsRead = async (chatroomId: number): Promise<boolean> => {
    try {
      try {
        // 전용 API가 있는 경우
        await post(`/api/v1/admin/chats/${chatroomId}/read`, {});
      } catch (error) {
        // 전용 API가 없는 경우 임시 처리
        console.log(
          "메시지 읽음 표시 API 없음, 클라이언트 측에서만 처리:",
          error
        );
      }

      // 채팅방 목록에서 새 메시지 표시 제거 (클라이언트 측 처리)
      setChatrooms((prev) =>
        prev.map((room) =>
          room.id === chatroomId ? { ...room, hasNewMessage: false } : room
        )
      );
      return true;
    } catch (error) {
      console.error("메시지 읽음 표시 실패:", error);
      return false;
    }
  };

  // 답변 담당자 지정
  const assignAdmin = async (
    chatroomId: number,
    adminId: number
  ): Promise<boolean> => {
    try {
      try {
        // 전용 API가 있는 경우
        await post(`/api/v1/admin/chats/${chatroomId}/assign`, { adminId });
      } catch (error) {
        // 전용 API가 없는 경우 임시 처리
        console.log(
          "답변 담당자 지정 API 없음, 클라이언트 측에서만 처리:",
          error
        );

        // 클라이언트 측에서만 처리 (백엔드 없는 경우)
        if (adminMember) {
          setChatrooms((prev) =>
            prev.map((room) =>
              room.id === chatroomId
                ? {
                    ...room,
                    assignedAdmin: {
                      id: adminMember.id,
                      userName: adminMember.userName,
                      profileImageUrl: adminMember.profileImageUrl || undefined,
                    },
                  }
                : room
            )
          );
        }
      }

      // 채팅방 목록 갱신
      await fetchChatrooms();
      return true;
    } catch (error) {
      console.error("답변 담당자 지정 실패:", error);
      return false;
    }
  };

  // 메시지 전송
  const sendMessage = (message: string) => {
    // 메시지가 비어있거나 선택된 채팅방이 없는 경우 처리
    if (!message.trim() || !selectedChatroom || !stompClient) {
      console.warn(
        "메시지를 보낼 수 없습니다: 메시지 비어있음 또는 채팅방/연결 없음"
      );
      return;
    }

    // 비활성화된 채팅방인 경우 메시지 전송 금지
    if (selectedChatroom.status === "INACTIVE") {
      console.warn("비활성화된 채팅방에는 메시지를 보낼 수 없습니다.");

      // 오류 메시지 표시
      const errorMessage: ChatMessageType = {
        userId: 0,
        message: "이 채팅방은 종료되었습니다. 메시지를 보낼 수 없습니다.",
        isSystem: true,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prevMessages) => {
        // 이미 종료 메시지가 있는지 확인
        const hasSystemMessage = prevMessages.some(
          (msg) => msg.isSystem && msg.message.includes("종료")
        );

        // 메시지가 이미 있으면 추가하지 않음
        if (hasSystemMessage) return prevMessages;

        return [...prevMessages, errorMessage];
      });

      return;
    }

    // 연결 상태 확인
    if (!connected) {
      console.warn("서버에 연결되어 있지 않습니다. 메시지를 보낼 수 없습니다.");

      // 재연결 시도
      setConnecting(true);
      try {
        // 중요: 채팅방 객체 전체를 전달
        connectStomp(selectedChatroom.id, selectedChatroom);

        // 재연결 후 1초 대기 후 메시지 전송 재시도
        setTimeout(() => {
          if (connected && stompClient) {
            sendMessageToServer(message);
          } else {
            // 연결 실패 메시지
            const errorMessage: ChatMessageType = {
              userId: 0,
              message: "서버 연결에 실패했습니다. 페이지를 새로고침해 주세요.",
              isSystem: true,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            };

            setMessages((prevMessages) => [...prevMessages, errorMessage]);
          }
        }, 1000);
      } catch (error) {
        console.error("재연결 시도 중 오류:", error);

        // 연결 실패 메시지
        const errorMessage: ChatMessageType = {
          userId: 0,
          message: "서버 연결에 실패했습니다. 페이지를 새로고침해 주세요.",
          isSystem: true,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      }

      return;
    }

    // 서버로 메시지 전송
    sendMessageToServer(message);
  };

  // 서버로 메시지 전송하는 내부 함수
  const sendMessageToServer = (message: string) => {
    if (!stompClient || !selectedChatroom || !adminMember) {
      console.warn("메시지를 보낼 수 없습니다: 필수 정보 누락");
      return;
    }

    try {
      // 고유 ID 생성 (현재 시간 + 난수)
      const clientId = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;

      // 메시지 객체 생성
      const chatMessage = {
        userId: adminMember.id,
        message: message,
        timestamp: new Date().toISOString(),
        clientId: clientId, // 서버로 전송하는 고유 ID
      };

      // 연속 중복 클릭 방지
      const isDuplicate = messages.some(
        (msg) =>
          msg.message === message &&
          msg.userId === adminMember.id &&
          Date.now() - (msg.clientTimestamp || 0) < 1000
      );

      if (isDuplicate) {
        console.log("중복된 메시지 전송 시도를 방지했습니다:", message);
        return;
      }

      // 낙관적 UI 업데이트를 위한 메시지 객체 생성
      const optimisticMessage: ChatMessageType = {
        userId: adminMember.id,
        message: message,
        userName: adminMember.userName || "관리자",
        profileImageUrl: adminMember.profileImageUrl || undefined,
        apartmentName: adminMember.apartmentName || undefined,
        buildingName: adminMember.buildingName || undefined,
        unitNumber: adminMember.unitNumber || undefined,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isNew: true,
        clientId: clientId,
        isPreview: true,
        clientTimestamp: Date.now(),
        isMyMessage: true, // 내가 보낸 메시지 표시
      };

      // 화면에 즉시 메시지 추가 (낙관적 UI 업데이트)
      setMessages((prevMessages) => {
        // 중복 체크
        const exists = prevMessages.some((msg) => msg.clientId === clientId);
        if (exists) {
          return prevMessages;
        }
        return [...prevMessages, optimisticMessage];
      });

      // 서버로 메시지 전송
      stompClient.publish({
        destination: `/pub/chats/${selectedChatroom.id}`,
        body: JSON.stringify(chatMessage),
      });

      console.log("메시지 전송 완료:", message, "clientId:", clientId);
    } catch (error) {
      console.error("메시지 전송 중 오류:", error);

      // 오류 메시지 표시
      const errorMessage: ChatMessageType = {
        userId: 0,
        message: "메시지 전송에 실패했습니다. 다시 시도해 주세요.",
        isSystem: true,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }
  };

  const value = {
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
    assignAdmin,
    setMessages,
  };

  return (
    <AdminChatContext.Provider value={value}>
      {children}
    </AdminChatContext.Provider>
  );
}
