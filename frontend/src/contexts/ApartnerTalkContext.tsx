"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  post,
  get,
  getActiveUserChatrooms,
  closeChatroom,
  joinChatroom,
  markMessagesAsRead as markMessagesAsReadApi,
} from "@/utils/api";
import { useGlobalLoginMember } from "@/auth/loginMember";
import {
  CategoryCodeType,
  CategoryType,
  getCategoryNameByCode,
  getCategoryCodeByName,
} from "@/constants/categoryCode";

// 채팅방 상태 타입 정의
export type ChatroomStatusType = "ACTIVE" | "INACTIVE" | null;

// 카드 내 화면 타입 정의
export type ChatViewType = "CATEGORY" | "CHAT" | "HISTORY" | "NONE";

// 채팅 메시지 타입 정의
export interface ApartnerTalkMessageType {
  messageId?: number;
  id?: string;
  userId: number;
  message: string;
  userName?: string;
  profileImageUrl?: string;
  apartmentName?: string;
  buildingName?: string;
  unitNumber?: string;
  timestamp?: string;
  isMyMessage?: boolean;
  isNew?: boolean;
  isSystem?: boolean;
  chatroomId?: number;
}

// 사용자 정보 타입 정의
interface UserInfo {
  id: number;
  userName: string;
  apartmentId: number;
  apartmentName?: string;
  profileImageUrl?: string;
}

// 컨텍스트 인터페이스 정의
interface ApartnerTalkContextType {
  categoryCode: CategoryCodeType;
  setCategoryCode: (categoryCode: CategoryCodeType) => void;
  getCategoryDisplayName: () => CategoryType;
  messages: ApartnerTalkMessageType[];
  connecting: boolean;
  connected: boolean;
  sendMessage: (message: string) => void;
  startChat: () => void;
  resetChat: () => void;
  apartmentId: number | null;
  chatroomId: number | null;
  userInfo: UserInfo | null;
  getActiveChatrooms: () => Promise<any[]>;
  enterChatroomById: (roomId: number) => Promise<boolean>;
  roomStatus: ChatroomStatusType;
  isActiveChat: () => boolean;
  isInactiveChat: () => boolean;
  canSendMessages: () => boolean;
  // 카드 화면 관리 상태 및 함수
  currentView: ChatViewType;
  setCurrentView: (view: ChatViewType) => void;
  showCategorySelection: () => void;
  showChatInterface: () => void;
  showChatHistory: () => void;
  hideChatCard: () => void;
  isChatCardVisible: () => boolean;
  // 활성화된 채팅방 관련 기능
  hasActiveChat: boolean;
  activeChat: any | null;
  checkActiveChats: () => Promise<boolean>;
  closeCurrentChat: () => Promise<boolean>;
  enterActiveChat: () => Promise<boolean>;
  // 알림 관련 상태 및 함수
  hasUnreadMessages: boolean;
  unreadCount: number;
  lastCheckAt: Date | null;
  checkForNewMessages: () => Promise<boolean>;
  markMessagesAsRead: () => void;
  // 메시지 로딩 상태
  messagesLoaded: boolean;
}

const ApartnerTalkContext = createContext<ApartnerTalkContextType>({
  categoryCode: null,
  setCategoryCode: () => {},
  getCategoryDisplayName: () => null,
  messages: [],
  connecting: false,
  connected: false,
  sendMessage: () => {},
  startChat: () => {},
  resetChat: () => {},
  apartmentId: null,
  chatroomId: null,
  userInfo: null,
  getActiveChatrooms: async () => [],
  enterChatroomById: async () => false,
  roomStatus: null,
  isActiveChat: () => false,
  isInactiveChat: () => false,
  canSendMessages: () => false,
  // 카드 화면 관리 상태 및 함수 기본값
  currentView: "NONE",
  setCurrentView: () => {},
  showCategorySelection: () => {},
  showChatInterface: () => {},
  showChatHistory: () => {},
  hideChatCard: () => {},
  isChatCardVisible: () => false,
  // 활성화된 채팅방 관련 기능
  hasActiveChat: false,
  activeChat: null,
  checkActiveChats: async () => false,
  closeCurrentChat: async () => false,
  enterActiveChat: async () => false,
  // 알림 관련 상태 및 함수 기본값
  hasUnreadMessages: false,
  unreadCount: 0,
  lastCheckAt: null,
  checkForNewMessages: async () => false,
  markMessagesAsRead: () => {},
  // 메시지 로딩 상태
  messagesLoaded: false,
});

export const useApartnerTalkContext = () => useContext(ApartnerTalkContext);

export const ApartnerTalkProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [categoryCode, setCategoryCode] = useState<CategoryCodeType>(null);
  const [messages, setMessages] = useState<ApartnerTalkMessageType[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [chatroomId, setChatroomId] = useState<number | null>(null);
  const [roomStatus, setRoomStatus] = useState<ChatroomStatusType>(null);
  // 카드 화면 관리 상태
  const [currentView, setCurrentView] = useState<ChatViewType>("NONE");
  // 활성화된 채팅방 관련 상태
  const [hasActiveChat, setHasActiveChat] = useState<boolean>(false);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  // 전역 WebSocket 클라이언트
  const [globalStompClient, setGlobalStompClient] = useState<Client | null>(
    null
  );

  // 로그인 멤버 정보 context에서 바로 사용
  const { loginMember, isLogin } = useGlobalLoginMember();

  // userInfo, userId, apartmentId를 loginMember에서 파생
  const userInfo: UserInfo | null =
    isLogin && loginMember.id > 0
      ? {
          id: loginMember.id,
          userName: loginMember.userName,
          apartmentId: (loginMember as any).apartmentId || 0, // apartmentId가 loginMember에 있으면 사용
          apartmentName: loginMember.apartmentName || undefined,
          profileImageUrl: loginMember.profileImageUrl || undefined,
        }
      : null;
  const userId = userInfo?.id || null;
  const apartmentId = userInfo?.apartmentId || null;

  // 알림 관련 상태
  const [hasUnreadMessages, setHasUnreadMessages] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [lastCheckAt, setLastCheckAt] = useState<Date | null>(null);
  // 메시지 로딩 상태 관리 (채팅방 진입 시 메시지 로딩 완료 이벤트)
  const [messagesLoaded, setMessagesLoaded] = useState<boolean>(false);

  // 현재 선택된 카테고리의 표시 이름 가져오기
  const getCategoryDisplayName = useCallback((): CategoryType => {
    return categoryCode ? getCategoryNameByCode(categoryCode) : null;
  }, [categoryCode]);

  // 로그인 시 최초 1회만 채팅방 확인
  useEffect(() => {
    if (!isLogin || !userInfo) {
      return;
    } else {
      checkActiveChats();
    }
  }, [loginMember, isLogin]);

  // 활성화된 채팅방 확인
  const checkActiveChats = useCallback(async () => {
    if (!isLogin || !userId) {
      return false;
    }

    try {
      const activeRooms = await getActiveUserChatrooms();

      if (activeRooms.length > 0) {
        const enhancedRooms = activeRooms.map((room) => {
          if (room.categoryCode) {
            return {
              ...room,
              categoryDisplayName: getCategoryNameByCode(room.categoryCode),
            };
          }
          return room;
        });

        setHasActiveChat(true);
        setActiveChat(enhancedRooms[0]);

        const hasNewMessages = enhancedRooms.some(
          (room) => room.hasNewMessage === true
        );
        setHasUnreadMessages(hasNewMessages);

        const newMessagesCount = enhancedRooms.filter(
          (room) => room.hasNewMessage === true
        ).length;
        setUnreadCount(newMessagesCount);

        return true;
      } else {
        setHasActiveChat(false);
        setActiveChat(null);
        setHasUnreadMessages(false);
        setUnreadCount(0);
        return false;
      }
    } catch (error) {
      setHasActiveChat(false);
      setActiveChat(null);
      return false;
    }
  }, [isLogin, userId]);

  // 메시지 읽음 처리 함수 - 백엔드의 updateUserCheckedAt과 동일한 역할
  const markMessagesAsRead = useCallback(async () => {
    if (!chatroomId) return;

    try {
      await markMessagesAsReadApi(chatroomId);
      const now = new Date();
      setHasUnreadMessages(false);
      setUnreadCount(0);
      setLastCheckAt(now);
    } catch (error) {
      console.error("[ChatFloatingButton] 메시지 읽음 처리 실패:", error);
    }
  }, [chatroomId]);

  // 카드 화면 관리 유틸리티 함수
  const showCategorySelection = useCallback(() => {
    setCurrentView("CATEGORY");
  }, []);

  const showChatInterface = useCallback(() => {
    setCurrentView("CHAT");
  }, []);

  const showChatHistory = useCallback(() => {
    setCurrentView("HISTORY");
  }, []);

  const hideChatCard = useCallback(() => {
    setCurrentView("NONE");
  }, []);

  const isChatCardVisible = useCallback(() => {
    return currentView !== "NONE";
  }, [currentView]);

  // 메시지 수신 시 호출되는 함수 (WebSocket)
  const handleNewMessage = useCallback(
    (receivedMsg: any) => {
      if (!receivedMsg.chatroomId && chatroomId) {
        receivedMsg.chatroomId = chatroomId;
      }

      const msgChatroomId = receivedMsg.chatroomId || 0;
      const currentChatroomId = chatroomId || 0;
      const isCurrentChatroom = msgChatroomId === currentChatroomId;
      const isFromMe = Number(receivedMsg.userId) === Number(userId);

      if (!isCurrentChatroom && !isFromMe) {
        setHasUnreadMessages(true);
        setUnreadCount((prev) => prev + 1);
        console.log(
          "[알림] 새 메시지 도착! hasUnreadMessages=true, unreadCount 증가"
        );
      }

      receivedMsg.isMyMessage = isFromMe;
      receivedMsg.isNew = true;

      if (isCurrentChatroom) {
        setMessages((prevMessages) => {
          const messageExists = prevMessages.some((msg) => {
            if (
              receivedMsg.messageId &&
              msg.messageId === receivedMsg.messageId
            ) {
              return true;
            }

            if (
              isFromMe &&
              msg.message === receivedMsg.message &&
              msg.userId === Number(receivedMsg.userId) &&
              msg.timestamp &&
              receivedMsg.timestamp &&
              Math.abs(
                new Date(msg.timestamp).getTime() -
                  new Date(receivedMsg.timestamp).getTime()
              ) < 10000
            ) {
              return true;
            }

            return false;
          });

          if (messageExists) {
            return prevMessages;
          }

          return [...prevMessages, receivedMsg];
        });
      }
    },
    [userId, chatroomId]
  );

  // WebSocket을 통한 새 메시지 알림 처리 - 주기적인 폴링 대신 실시간 알림 활용
  const handleChatroomUpdate = useCallback(
    (updatedChatroom: any) => {
      if (updatedChatroom && updatedChatroom.id !== chatroomId) {
        if (updatedChatroom.hasNewMessage) {
          setHasUnreadMessages(true);
          setUnreadCount((prev) => prev + 1);
          console.log(
            "[알림] 채팅방 업데이트로 새 메시지 감지! hasUnreadMessages=true, unreadCount 증가"
          );
        }
      }

      if (
        updatedChatroom.status === "INACTIVE" &&
        activeChat?.id === updatedChatroom.id
      ) {
        setActiveChat(null);
        setHasActiveChat(false);
      } else if (updatedChatroom.status === "ACTIVE") {
        if (!hasActiveChat || activeChat?.id === updatedChatroom.id) {
          setActiveChat(updatedChatroom);
          setHasActiveChat(true);
        }
      }
    },
    [chatroomId, activeChat, hasActiveChat]
  );

  // 현재 채팅방 종료
  const closeCurrentChat = useCallback(async () => {
    const chatId = chatroomId || (activeChat?.id ?? null);

    if (!chatId) {
      return false;
    }

    try {
      try {
        await joinChatroom(chatId);
      } catch (joinError) {}

      await closeChatroom(chatId);

      if (chatId === chatroomId) {
        setRoomStatus("INACTIVE");

        const systemMessage: ApartnerTalkMessageType = {
          userId: 0,
          message:
            "이 대화는 종료되었습니다. 새 문의는 카테고리를 선택해 시작해주세요.",
          timestamp: new Date().toISOString(),
          isSystem: true,
        };
        setMessages((prev) => [...prev, systemMessage]);
      }

      if (activeChat?.id === chatId) {
        setActiveChat(null);
        setHasActiveChat(false);
      } else {
        await checkActiveChats();
      }

      return true;
    } catch (error) {
      const errorMessage: ApartnerTalkMessageType = {
        userId: 0,
        message: "대화 종료 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        timestamp: new Date().toISOString(),
        isSystem: true,
      };
      setMessages((prev) => [...prev, errorMessage]);

      return false;
    }
  }, [chatroomId, activeChat, checkActiveChats]);

  // 활성화된 채팅방으로 입장
  const enterActiveChat = useCallback(async () => {
    if (!activeChat) {
      return false;
    }

    return await enterChatroomById(activeChat.id);
  }, [activeChat]);

  // 채팅방 상태 유틸리티 함수
  const isActiveChat = useCallback(() => roomStatus === "ACTIVE", [roomStatus]);
  const isInactiveChat = useCallback(
    () => roomStatus === "INACTIVE",
    [roomStatus]
  );
  const canSendMessages = useCallback(
    () => connected && isActiveChat(),
    [connected, isActiveChat]
  );

  // 웹소켓 연결
  const connectWebSocket = useCallback(
    (roomId: number) => {
      console.log("[디버그] connectWebSocket 호출", roomId);
      if (roomStatus === "INACTIVE") {
        setConnecting(false);
        setConnected(false);
        return;
      }

      if (stompClient && stompClient.connected) {
        stompClient.deactivate();
      }

      const socket = new SockJS(`/stomp/chats`);
      const client = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });
      client.onConnect = () => {
        console.log("[디버그] WebSocket 연결 성공", roomId);
        client.subscribe(`/sub/chats/${roomId}`, (message) => {
          try {
            const receivedMsg = JSON.parse(message.body);
            handleNewMessage(receivedMsg);
          } catch (error) {}
        });

        client.subscribe(`/sub/chats/updates`, (message) => {
          try {
            const chatroomUpdate = JSON.parse(message.body);
            handleChatroomUpdate(chatroomUpdate);
          } catch (error) {}
        });

        setConnecting(false);
        setConnected(true);
        markMessagesAsRead();
      };
      client.onDisconnect = () => {
        console.log("[디버그] WebSocket 연결 해제", roomId);
        setConnected(false);
      };
      client.onStompError = (frame) => {
        console.error("[디버그] WebSocket STOMP 에러", frame);
        setConnecting(false);
      };
      client.activate();
      setStompClient(client);
    },
    [
      userId,
      handleNewMessage,
      handleChatroomUpdate,
      markMessagesAsRead,
      stompClient,
      roomStatus,
    ]
  );

  // 채팅 인터페이스 표시 시 메시지 읽음 처리
  useEffect(() => {
    if (currentView === "CHAT" && chatroomId) {
      markMessagesAsRead();
    }
  }, [currentView, chatroomId, markMessagesAsRead]);

  // 새 메시지 확인을 위한 함수 - WebSocket 구독만으로 처리
  const checkForNewMessages = useCallback(async () => {
    // WebSocket 구독으로만 처리하고, 최초 로드에만 API 호출
    if (!hasActiveChat || !activeChat) {
      return await checkActiveChats();
    }

    // 이미 WebSocket으로 알림을 받고 있으므로 API 호출 없이 현재 상태 반환
    return hasUnreadMessages;
  }, [hasActiveChat, activeChat, checkActiveChats, hasUnreadMessages]);

  // 채팅 시작
  const startChat = async () => {
    if (hasActiveChat && activeChat) {
      return await enterActiveChat();
    }

    if (!categoryCode || !apartmentId || !userId) {
      return false;
    }

    try {
      setConnecting(true);

      const categoryName = getCategoryDisplayName();

      const title = `${categoryName || categoryCode} 문의`;

      let apiUrl = `/api/v1/chats?title=${encodeURIComponent(title)}`;
      apiUrl += `&categoryCode=${encodeURIComponent(categoryCode)}`;
      apiUrl += `&apartmentId=${apartmentId}`;

      const response = await post<any>(apiUrl, {});
      const chatroom = response.data;

      if (chatroom.status === "INACTIVE") {
        const roomId = chatroom.id;
        let newApiUrl = `/api/v1/chats?title=${encodeURIComponent(title)}`;
        newApiUrl += `&prevRoomId=${roomId}`;
        newApiUrl += `&categoryCode=${encodeURIComponent(categoryCode)}`;
        newApiUrl += `&apartmentId=${apartmentId}`;

        const newResponse = await post<any>(newApiUrl, {});
        const newChatroom = newResponse.data;

        setChatroomId(newChatroom.id);
        setRoomStatus(newChatroom.status);
        setHasActiveChat(true);

        const enhancedChatroom = {
          ...newChatroom,
          categoryDisplayName: getCategoryNameByCode(newChatroom.categoryCode),
        };
        setActiveChat(enhancedChatroom);

        const messagesResponse = await get<any>(
          `/api/v1/chats/${newChatroom.id}/messages`
        );
        const existingMessages = messagesResponse.data;
        const formattedMessages = existingMessages.map((msg: any) => ({
          ...msg,
          isMyMessage: msg.userId === userId,
        }));
        setMessages(formattedMessages);

        connectWebSocket(newChatroom.id);
      } else {
        setChatroomId(chatroom.id);
        setRoomStatus(chatroom.status);

        setHasActiveChat(true);

        const enhancedChatroom = {
          ...chatroom,
          categoryDisplayName: getCategoryNameByCode(chatroom.categoryCode),
        };
        setActiveChat(enhancedChatroom);

        const messagesResponse = await get<any>(
          `/api/v1/chats/${chatroom.id}/messages`
        );
        const existingMessages = messagesResponse.data;
        const formattedMessages = existingMessages.map((msg: any) => ({
          ...msg,
          isMyMessage: msg.userId === userId,
        }));
        setMessages(formattedMessages);
        connectWebSocket(chatroom.id);
      }

      showChatInterface();
      return true;
    } catch (error) {
      setConnecting(false);
      return false;
    }
  };

  // 메시지 전송
  const sendMessage = (message: string) => {
    if (roomStatus === "INACTIVE") {
      const systemMessage: ApartnerTalkMessageType = {
        userId: 0,
        message: "이 채팅방은 종료되었습니다. 메시지를 보낼 수 없습니다.",
        timestamp: new Date().toISOString(),
        isSystem: true,
      };

      setMessages((prev) => {
        const hasErrorMessage = prev
          .slice(-3)
          .some(
            (msg) => msg.isSystem && msg.message.includes("보낼 수 없습니다")
          );

        if (hasErrorMessage) return prev;
        return [...prev, systemMessage];
      });

      return;
    }

    if (!stompClient || !connected || !chatroomId || !isActiveChat()) {
      return;
    }

    const timestamp = new Date().toISOString();

    const messageObj = {
      userId: userId?.toString(),
      message,
      chatroomId: chatroomId,
      timestamp: timestamp,
    };

    stompClient.publish({
      destination: `/pub/chats/${chatroomId}`,
      body: JSON.stringify(messageObj),
    });

    const clientId = `local-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    const optimisticMessage: ApartnerTalkMessageType = {
      id: clientId,
      userId: Number(userId),
      message,
      chatroomId: chatroomId,
      timestamp: timestamp,
      isMyMessage: true,
      isNew: true,
      userName: userInfo?.userName,
      profileImageUrl: userInfo?.profileImageUrl,
      apartmentName: userInfo?.apartmentName,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
  };

  // 채팅 초기화
  const resetChat = useCallback(() => {
    if (stompClient && stompClient.connected) {
      stompClient.deactivate();
    }
    setCategoryCode(null);
    setMessages([]);
    setConnecting(false);
    setConnected(false);
    setStompClient(null);
    setChatroomId(null);
    setRoomStatus(null);
    showCategorySelection();
  }, [stompClient, showCategorySelection]);

  useEffect(() => {
    return () => {
      if (stompClient && stompClient.connected) {
        stompClient.deactivate();
      }
    };
  }, [stompClient]);

  // ACTIVE 상태 채팅방 목록 조회
  const getActiveChatrooms = async () => {
    try {
      const response = await get<any>("/api/v1/chats/my");
      return (response.data || []).filter(
        (room: any) => room.status === "ACTIVE"
      );
    } catch (e) {
      return [];
    }
  };

  // 특정 채팅방으로 진입 (메시지 불러오기 및 상태 세팅)
  const enterChatroomById = useCallback(
    async (roomId: number) => {
      try {
        setConnecting(true);
        setMessagesLoaded(false);

        const chatroomResponse = await get<any>(`/api/v1/chats/${roomId}`);
        const chatroom = chatroomResponse.data;

        if (!chatroom) {
          setConnecting(false);
          setMessagesLoaded(false);
          return false;
        }

        setChatroomId(roomId);
        setRoomStatus(chatroom.status as ChatroomStatusType);

        if (chatroom.categoryCode) {
          setCategoryCode(chatroom.categoryCode as CategoryCodeType);
          chatroom.categoryDisplayName = getCategoryNameByCode(
            chatroom.categoryCode
          );
        }

        const messagesResponse = await get<any>(
          `/api/v1/chats/${roomId}/messages`
        );
        const existingMessages = messagesResponse.data;
        const formattedMessages = existingMessages.map((msg: any) => ({
          ...msg,
          isMyMessage: msg.userId === userId,
        }));
        setMessages(formattedMessages);

        if (chatroom.status === "INACTIVE") {
          const inactiveMessage: ApartnerTalkMessageType = {
            userId: 0,
            message: "이 채팅방은 종료되었습니다. 메시지를 보낼 수 없습니다.",
            timestamp: new Date().toISOString(),
            isSystem: true,
          };

          const hasInactiveMessage = formattedMessages.some(
            (msg: any) =>
              msg.isSystem && msg.message && msg.message.includes("종료")
          );

          if (!hasInactiveMessage) {
            setMessages((prevMessages) => [...prevMessages, inactiveMessage]);
          }
        }

        setMessagesLoaded(true);

        if (chatroom.status === "ACTIVE") {
          connectWebSocket(roomId);
          setHasActiveChat(true);
          setActiveChat(chatroom);
        } else {
          setConnecting(false);
          setConnected(false);
        }

        showChatInterface();

        return true;
      } catch (e) {
        setConnecting(false);
        setMessagesLoaded(false);

        if (e instanceof Error && e.message.includes("403")) {
          const errorMessage: ApartnerTalkMessageType = {
            userId: 0,
            message: "이 채팅방에 접근할 권한이 없습니다.",
            timestamp: new Date().toISOString(),
            isSystem: true,
          };
          setMessages([errorMessage]);
        }

        return false;
      }
    },
    [userId, connectWebSocket, showChatInterface]
  );

  // 채팅방 상태와 무관하게 실시간 메시지 업데이트를 위한 전역 WebSocket 연결
  useEffect(() => {
    if (!isLogin || !userId) {
      return;
    }

    console.log("[ApartnerTalkContext] 전역 WebSocket 연결 시도");

    const socket = new SockJS(`/stomp/chats`);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log("[ApartnerTalkContext] 전역 WebSocket 연결 성공");

      // 채팅방 업데이트만 구독 (모든 채팅방의 업데이트를 받기 위함)
      client.subscribe(`/sub/chats/updates`, (message) => {
        try {
          const chatroomUpdate = JSON.parse(message.body);
          console.log(
            "[ApartnerTalkContext] 전역 구독으로 채팅방 업데이트 수신:",
            chatroomUpdate
          );

          // 새 메시지가 있는 경우 알림 상태 업데이트
          if (chatroomUpdate.hasNewMessage) {
            setHasUnreadMessages(true);
            setUnreadCount((prev) => prev + 1);
            console.log(
              "[ApartnerTalkContext] 전역 구독으로 새 메시지 감지: hasUnreadMessages=true, unreadCount 증가"
            );

            // 활성화된 채팅방 목록 갱신
            checkActiveChats();
          }
        } catch (error) {
          console.error(
            "[ApartnerTalkContext] 전역 WebSocket 메시지 처리 오류:",
            error
          );
        }
      });
    };

    client.onDisconnect = () => {
      console.log("[ApartnerTalkContext] 전역 WebSocket 연결 해제");
    };

    client.onStompError = (frame) => {
      console.error("[ApartnerTalkContext] 전역 WebSocket STOMP 에러:", frame);
    };

    client.activate();
    setGlobalStompClient(client);

    // 컴포넌트 언마운트 시 연결 해제
    return () => {
      if (client.connected) {
        console.log("[ApartnerTalkContext] 전역 WebSocket 연결 정리");
        client.deactivate();
      }
    };
  }, [isLogin, userId]); // 로그인 상태나 사용자 ID가 변경될 때만 재연결

  return (
    <ApartnerTalkContext.Provider
      value={{
        categoryCode,
        setCategoryCode,
        getCategoryDisplayName,
        messages,
        connecting,
        connected,
        sendMessage,
        startChat,
        resetChat,
        apartmentId,
        chatroomId,
        userInfo,
        getActiveChatrooms,
        enterChatroomById,
        roomStatus,
        isActiveChat,
        isInactiveChat,
        canSendMessages,
        // 카드 화면 관리 상태 및 함수
        currentView,
        setCurrentView,
        showCategorySelection,
        showChatInterface,
        showChatHistory,
        hideChatCard,
        isChatCardVisible,
        // 활성화된 채팅방 관련 기능
        hasActiveChat,
        activeChat,
        checkActiveChats,
        closeCurrentChat,
        enterActiveChat,
        // 알림 관련 상태 및 함수
        hasUnreadMessages,
        unreadCount,
        lastCheckAt,
        checkForNewMessages,
        markMessagesAsRead,
        // 메시지 로딩 상태
        messagesLoaded,
      }}
    >
      {children}
    </ApartnerTalkContext.Provider>
  );
};
