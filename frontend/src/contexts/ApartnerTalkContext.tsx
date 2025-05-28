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
} from "@/utils/api";
import { useGlobalLoginMember } from "@/auth/loginMember";

// 카테고리 타입 정의
export type CategoryType =
  | "민원"
  | "건의사항"
  | "수리/정비"
  | "보안/안전"
  | null;

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
  category: CategoryType;
  setCategory: (category: CategoryType) => void;
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
  category: null,
  setCategory: () => {},
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
  const [category, setCategory] = useState<CategoryType>(null);
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
  // API 호출 제어를 위한 상태 추가
  const [lastApiCallTime, setLastApiCallTime] = useState<number>(0);
  const API_CALL_DEBOUNCE_TIME = 10000; // 최소 10초 간격으로 API 호출

  // 메시지 로딩 상태 관리 (채팅방 진입 시 메시지 로딩 완료 이벤트)
  const [messagesLoaded, setMessagesLoaded] = useState<boolean>(false);

  useEffect(() => {
    console.log("[ApartnerTalk] loginMember", loginMember, "isLogin", isLogin);
    if (!isLogin || !userInfo) {
      console.warn("[ApartnerTalk] 로그인 정보 없음, 채팅 불가");
    } else {
      // 로그인 상태일 때 활성화된 채팅방 확인 (한 번만 실행)
      checkActiveChats();
    }
  }, [loginMember, isLogin]);

  // 활성화된 채팅방 확인
  const checkActiveChats = useCallback(async () => {
    if (!isLogin || !userId) {
      return false;
    }

    // API 호출 디바운싱 - 마지막 호출 후 일정 시간이 지나지 않았으면 스킵
    const now = Date.now();
    if (now - lastApiCallTime < API_CALL_DEBOUNCE_TIME) {
      console.log(
        `[ApartnerTalk] API 호출 디바운싱: 마지막 호출로부터 ${
          (now - lastApiCallTime) / 1000
        }초 경과, 최소 ${API_CALL_DEBOUNCE_TIME / 1000}초 필요`
      );
      return hasActiveChat; // 기존 상태 유지
    }

    try {
      console.log("[ApartnerTalk] 활성화된 채팅방 API 호출 실행");
      setLastApiCallTime(now); // API 호출 시간 기록

      const activeRooms = await getActiveUserChatrooms();

      if (activeRooms.length > 0) {
        setHasActiveChat(true);
        setActiveChat(activeRooms[0]); // 가장 첫 번째 활성화된 채팅방 사용

        // 채팅방의 hasNewMessage 속성을 통해 새 메시지 여부 확인
        // 백엔드에서 이미 lastCheckAt 기준으로 hasNewMessage를 계산하여 제공함
        const hasNewMessages = activeRooms.some(
          (room) => room.hasNewMessage === true
        );
        setHasUnreadMessages(hasNewMessages);

        // 새 메시지가 있는 채팅방 수 계산
        const newMessagesCount = activeRooms.filter(
          (room) => room.hasNewMessage === true
        ).length;
        setUnreadCount(newMessagesCount);

        console.log(
          "[ApartnerTalk] 활성화된 채팅방 존재:",
          activeRooms[0],
          "새 메시지 여부:",
          hasNewMessages,
          "새 메시지 있는 채팅방 수:",
          newMessagesCount
        );
        return true;
      } else {
        setHasActiveChat(false);
        setActiveChat(null);
        setHasUnreadMessages(false);
        setUnreadCount(0);
        console.log("[ApartnerTalk] 활성화된 채팅방 없음");
        return false;
      }
    } catch (error) {
      console.error("[ApartnerTalk] 활성화된 채팅방 확인 중 오류:", error);
      setHasActiveChat(false);
      setActiveChat(null);
      return false;
    }
  }, [isLogin, userId, hasActiveChat, lastApiCallTime]);

  // 메시지 읽음 처리 함수 - 백엔드의 updateUserCheckedAt과 동일한 역할
  const markMessagesAsRead = useCallback(() => {
    if (!chatroomId) return;

    const now = new Date();
    setHasUnreadMessages(false);
    setUnreadCount(0);
    setLastCheckAt(now);

    // 사용자가 채팅방에 참여할 때마다 자동으로 lastCheckAt이 갱신됨
    // 백엔드에서 이미 처리하고 있으므로 추가 API 호출 불필요
    console.log(
      `[ApartnerTalk] 채팅방 ${chatroomId} 메시지 읽음 처리 완료:`,
      now
    );
  }, [chatroomId]);

  // 로그인 상태 변경 시 최초 1회만 채팅방 확인
  useEffect(() => {
    if (isLogin) {
      checkActiveChats();
    }
  }, [isLogin]); // checkActiveChats 의존성 제거

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
      // 메시지 객체에 chatroomId가 없으면 현재 채팅방 ID 사용
      if (!receivedMsg.chatroomId && chatroomId) {
        receivedMsg.chatroomId = chatroomId;
      }

      // 현재 보고 있는 채팅방인지 확인
      const msgChatroomId = receivedMsg.chatroomId || 0;
      const currentChatroomId = chatroomId || 0;
      const isCurrentChatroom = msgChatroomId === currentChatroomId;
      const isFromMe = Number(receivedMsg.userId) === Number(userId);

      console.log("[ApartnerTalk] 메시지 수신", {
        message: receivedMsg,
        isCurrentChatroom,
        isFromMe,
        msgChatroomId,
        currentChatroomId,
      });

      // 현재 보고 있는 채팅방이 아니고, 내가 보낸 메시지가 아닐 때만 알림 표시
      if (!isCurrentChatroom && !isFromMe) {
        setHasUnreadMessages(true);
        setUnreadCount((prev) => prev + 1);
      }

      // 메시지에 추가 정보 넣기
      receivedMsg.isMyMessage = isFromMe;
      receivedMsg.isNew = true;

      // 현재 채팅방의 메시지인 경우 화면에 추가
      if (isCurrentChatroom) {
        setMessages((prevMessages) => {
          // 메시지가 이미 존재하는지 확인 (중복 방지)
          const messageExists = prevMessages.some((msg) => {
            // 1. 서버에서 온 메시지 ID로 확인
            if (
              receivedMsg.messageId &&
              msg.messageId === receivedMsg.messageId
            ) {
              return true;
            }

            // 2. 로컬에서 생성한 메시지와 서버 메시지 매칭 (낙관적 업데이트 중복 방지)
            if (
              isFromMe &&
              msg.message === receivedMsg.message &&
              msg.userId === Number(receivedMsg.userId) &&
              // 시간 범위 내에 있는지 확인 (10초 이내)
              msg.timestamp &&
              receivedMsg.timestamp &&
              Math.abs(
                new Date(msg.timestamp).getTime() -
                  new Date(receivedMsg.timestamp).getTime()
              ) < 10000
            ) {
              console.log(
                "[ApartnerTalk] 낙관적 업데이트된 메시지와 서버 메시지 매칭됨"
              );
              return true;
            }

            return false;
          });

          if (messageExists) {
            console.log(
              "[ApartnerTalk] 중복 메시지 감지됨, 추가하지 않음:",
              receivedMsg
            );
            return prevMessages;
          }

          console.log("[ApartnerTalk] 새 메시지 추가:", receivedMsg);
          return [...prevMessages, receivedMsg];
        });
      }
    },
    [userId, chatroomId]
  );

  // WebSocket을 통한 새 메시지 알림 처리 - 주기적인 폴링 대신 실시간 알림 활용
  const handleChatroomUpdate = useCallback(
    (updatedChatroom: any) => {
      // WebSocket으로부터 채팅방 업데이트 알림을 받았을 때 처리
      console.log("[ApartnerTalk] 채팅방 업데이트 알림 수신:", updatedChatroom);

      // 현재 보고 있는 채팅방이 아닌 경우에만 알림 표시
      if (updatedChatroom && updatedChatroom.id !== chatroomId) {
        if (updatedChatroom.hasNewMessage) {
          setHasUnreadMessages(true);
          setUnreadCount((prev) => prev + 1);
          console.log(
            `[ApartnerTalk] 채팅방 ${updatedChatroom.id}에 새 메시지가 있습니다.`
          );
        }
      }

      // 채팅방 목록 갱신이 필요한 경우에만 API 호출 (최소 10초 간격)
      const now = Date.now();
      if (now - lastApiCallTime >= API_CALL_DEBOUNCE_TIME) {
        checkActiveChats();
      }
    },
    [chatroomId, lastApiCallTime, checkActiveChats]
  );

  // 현재 채팅방 종료
  const closeCurrentChat = useCallback(async () => {
    const chatId = chatroomId || (activeChat?.id ?? null);

    if (!chatId) {
      console.warn("[ApartnerTalk] 종료할 채팅방이 없습니다.");
      return false;
    }

    try {
      console.log(`[ApartnerTalk] 채팅방 ${chatId} 종료 시도`);

      // 먼저 채팅방에 참여 상태인지 확인하고, 참여하지 않았다면 먼저 참여
      try {
        // 채팅방 참여 API 호출 (이미 참여 중이어도 오류가 발생하지 않음)
        await joinChatroom(chatId);
        console.log(
          `[ApartnerTalk] 채팅방 ${chatId} 참여 완료 (종료 전 참여 확인)`
        );
      } catch (joinError) {
        // 이미 참여 중인 경우 등 무시 가능한 오류는 로그만 남기고 계속 진행
        console.log(
          `[ApartnerTalk] 채팅방 ${chatId} 참여 오류 (무시하고 계속 진행): `,
          joinError
        );
      }

      // 채팅방 종료 처리
      await closeChatroom(chatId);

      // 채팅방 종료 후 상태 업데이트
      if (chatId === chatroomId) {
        // 현재 접속 중인 채팅방인 경우
        setRoomStatus("INACTIVE");

        // 종료 메시지 추가
        const systemMessage: ApartnerTalkMessageType = {
          userId: 0,
          message:
            "이 대화는 종료되었습니다. 새 문의는 카테고리를 선택해 시작해주세요.",
          timestamp: new Date().toISOString(),
          isSystem: true,
        };
        setMessages((prev) => [...prev, systemMessage]);
      }

      // 활성화된 채팅방 상태 갱신 - 방금 종료한 채팅방이 activeChat인 경우 초기화
      if (activeChat?.id === chatId) {
        setActiveChat(null);
        setHasActiveChat(false);
      } else {
        // 다른 활성화된 채팅방이 있는지 확인
        await checkActiveChats();
      }

      console.log(`[ApartnerTalk] 채팅방 ${chatId} 종료 완료`);
      return true;
    } catch (error) {
      console.error(`[ApartnerTalk] 채팅방 ${chatId} 종료 중 오류:`, error);

      // 오류 메시지 추가
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
      console.warn("[ApartnerTalk] 입장할 활성화된 채팅방이 없습니다.");
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
      console.log("[ApartnerTalk] WebSocket 연결 시도", roomId);

      // 기존 연결 정리
      if (stompClient && stompClient.connected) {
        console.log("[ApartnerTalk] 기존 WebSocket 연결 정리");
        stompClient.deactivate();
      }

      const socket = new SockJS(`/stomp/chats`);
      const client = new Client({
        webSocketFactory: () => socket,
        debug: (str) => {
          console.log("[ApartnerTalk] STOMP debug:", str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });
      client.onConnect = () => {
        console.log("[ApartnerTalk] WebSocket 연결 성공");

        // 구독 설정
        client.subscribe(`/sub/chats/${roomId}`, (message) => {
          try {
            const receivedMsg = JSON.parse(message.body);
            handleNewMessage(receivedMsg);
          } catch (error) {
            console.error("[ApartnerTalk] 메시지 파싱 오류:", error);
          }
        });

        // 전체 채팅 업데이트 구독 (모든 채팅방의 새 메시지 알림)
        // 백엔드에서 notifyChatroomUpdate를 통해 보내는 알림 수신
        client.subscribe(`/sub/chats/updates`, (message) => {
          try {
            const chatroomUpdate = JSON.parse(message.body);
            handleChatroomUpdate(chatroomUpdate);
          } catch (error) {
            console.error(
              "[ApartnerTalk] 채팅방 업데이트 알림 파싱 오류:",
              error
            );
          }
        });

        setConnecting(false);
        setConnected(true);

        // 채팅방에 접속하면 메시지를 읽은 것으로 처리
        // 백엔드의 joinChatroom에서 이미 lastCheckAt을 업데이트함
        markMessagesAsRead();
      };
      client.onDisconnect = () => {
        console.log("[ApartnerTalk] WebSocket 연결 해제");
        setConnected(false);
      };
      client.onStompError = (frame) => {
        console.error("[ApartnerTalk] Stomp 오류:", frame);
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
    ]
  );

  // 채팅 인터페이스 표시 시 메시지 읽음 처리
  useEffect(() => {
    if (currentView === "CHAT" && chatroomId) {
      markMessagesAsRead();
    }
  }, [currentView, chatroomId, markMessagesAsRead]);

  // 새 메시지 확인을 위한 함수 - WebSocket 구독으로 대체되어 직접 호출하지 않음
  const checkForNewMessages = useCallback(async () => {
    // 활성화된 채팅방 확인으로 대체, WebSocket 알림 기반 방식 사용
    return await checkActiveChats();
  }, [checkActiveChats]);

  // 채팅 시작
  const startChat = async () => {
    console.log("[ApartnerTalk] startChat 진입", {
      category,
      apartmentId,
      userId,
      userInfo,
    });

    // 이미 활성화된 채팅방이 있는 경우 처리
    if (hasActiveChat && activeChat) {
      console.log(
        "[ApartnerTalk] 이미 활성화된 채팅방이 있습니다:",
        activeChat
      );
      // 기존 활성화 채팅방으로 이동
      return await enterActiveChat();
    }

    if (!category || !apartmentId || !userId) {
      console.log("[ApartnerTalk] 필수값 없음, 실행 중단", {
        category,
        apartmentId,
        userId,
      });
      return false;
    }

    try {
      setConnecting(true);
      console.log("[ApartnerTalk] 채팅방 생성 요청", {
        title: `${category} 문의`,
        category,
        apartmentId,
      });
      const title = `${category} 문의`;
      const response = await post<any>(
        `/api/v1/chats?title=${encodeURIComponent(
          title
        )}&category=${encodeURIComponent(category)}&apartmentId=${apartmentId}`,
        {}
      );
      console.log("[ApartnerTalk] 채팅방 생성 응답", response);
      const chatroom = response.data;
      setChatroomId(chatroom.id);
      setRoomStatus(chatroom.status); // 채팅방 상태 설정

      // 활성화된 채팅방 상태 갱신
      setHasActiveChat(true);
      setActiveChat(chatroom);

      console.log("[ApartnerTalk] 메시지 목록 요청", chatroom.id);
      const messagesResponse = await get<any>(
        `/api/v1/chats/${chatroom.id}/messages`
      );
      console.log("[ApartnerTalk] 메시지 목록 응답", messagesResponse);
      const existingMessages = messagesResponse.data;
      const formattedMessages = existingMessages.map((msg: any) => ({
        ...msg,
        isMyMessage: msg.userId === userId,
      }));
      setMessages(formattedMessages);
      connectWebSocket(chatroom.id);
      // 채팅 인터페이스로 화면 전환
      showChatInterface();
      return true;
    } catch (error) {
      console.error("[ApartnerTalk] 채팅 시작 오류:", error);
      setConnecting(false);
      return false;
    }
  };

  // 메시지 전송
  const sendMessage = (message: string) => {
    console.log("[ApartnerTalk] sendMessage 호출", {
      message,
      userId,
      connected,
      chatroomId,
    });
    if (!stompClient || !connected || !chatroomId || !isActiveChat()) {
      console.log("[ApartnerTalk] sendMessage 조건 미충족", {
        stompClient,
        connected,
        chatroomId,
        isActiveChat: isActiveChat(),
      });
      return;
    }

    // 현재 시간을 ISO 형식으로 생성
    const timestamp = new Date().toISOString();

    const messageObj = {
      userId: userId?.toString(),
      message,
      chatroomId: chatroomId,
      timestamp: timestamp,
    };

    console.log("[ApartnerTalk] 메시지 publish", messageObj);
    stompClient.publish({
      destination: `/pub/chats/${chatroomId}`,
      body: JSON.stringify(messageObj),
    });

    // 낙관적 UI 업데이트 - 클라이언트 ID 생성
    const clientId = `local-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    const optimisticMessage: ApartnerTalkMessageType = {
      id: clientId, // 임시 ID 부여
      userId: Number(userId),
      message,
      chatroomId: chatroomId,
      timestamp: timestamp,
      isMyMessage: true,
      isNew: true,
      // 현재 로그인한 사용자 정보 추가
      userName: userInfo?.userName,
      profileImageUrl: userInfo?.profileImageUrl,
      apartmentName: userInfo?.apartmentName,
    };

    // 화면에 메시지 추가
    setMessages((prev) => [...prev, optimisticMessage]);
  };

  // 채팅 초기화
  const resetChat = useCallback(() => {
    console.log("[ApartnerTalk] resetChat 호출");
    if (stompClient && stompClient.connected) {
      stompClient.deactivate();
    }
    setCategory(null);
    setMessages([]);
    setConnecting(false);
    setConnected(false);
    setStompClient(null);
    setChatroomId(null);
    setRoomStatus(null);
    // 카테고리 선택 화면으로 돌아가기
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
      const response = await get<any>("/api/v1/chats");
      // status가 ACTIVE인 채팅방만 반환
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
        setMessagesLoaded(false); // 메시지 로딩 시작
        console.log(`[ApartnerTalk] 채팅방 ${roomId} 정보 로드 중...`);

        // 1. 채팅방 정보 가져오기
        const chatroomResponse = await get<any>(`/api/v1/chats/${roomId}`);
        const chatroom = chatroomResponse.data;
        console.log(`[ApartnerTalk] 채팅방 정보 로드 완료:`, chatroom);

        // 2. 채팅방 기본 정보 설정 (ACTIVE/INACTIVE 상태 관계없이 설정)
        setChatroomId(roomId);
        setRoomStatus(chatroom.status as ChatroomStatusType);
        if (chatroom.category) {
          setCategory(chatroom.category as CategoryType);
        }

        // 3. 채팅 메시지 불러오기 (ACTIVE/INACTIVE 상태 관계없이 항상 수행)
        console.log(`[ApartnerTalk] 채팅방 ${roomId} 메시지 로드 중...`);
        const messagesResponse = await get<any>(
          `/api/v1/chats/${roomId}/messages`
        );
        const existingMessages = messagesResponse.data;
        const formattedMessages = existingMessages.map((msg: any) => ({
          ...msg,
          isMyMessage: msg.userId === userId,
        }));
        setMessages(formattedMessages);
        console.log(
          `[ApartnerTalk] 채팅방 ${roomId} 메시지 ${formattedMessages.length}개 로드 완료`
        );

        // 메시지 로딩 완료 이벤트 발생
        setMessagesLoaded(true);

        // 4. 채팅방 상태에 따른 WebSocket 연결 처리
        if (chatroom.status === "ACTIVE") {
          // 활성화된 채팅방만 소켓 연결
          console.log(
            `[ApartnerTalk] 활성화된 채팅방 ${roomId}에 WebSocket 연결 시도`
          );
          connectWebSocket(roomId);

          // 활성화된 채팅방 상태 갱신
          setHasActiveChat(true);
          setActiveChat(chatroom);
        } else {
          // 비활성화된 채팅방은 소켓 연결하지 않음
          console.log(
            `[ApartnerTalk] 비활성화된 채팅방 ${roomId}는 WebSocket 연결 없이 메시지만 표시`
          );
          setConnecting(false);
          setConnected(false);
        }

        // 채팅 인터페이스로 화면 전환
        showChatInterface();

        return true; // 채팅방 진입 성공 (ACTIVE/INACTIVE 상관없이)
      } catch (e) {
        console.error(`[ApartnerTalk] 채팅방 ${roomId} 진입 중 오류:`, e);
        setConnecting(false);
        setMessagesLoaded(false);
        return false; // 오류 발생
      }
    },
    [userId, connectWebSocket, showChatInterface]
  );

  return (
    <ApartnerTalkContext.Provider
      value={{
        category,
        setCategory,
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
