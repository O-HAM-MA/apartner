"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { ChatroomType, ChatMessageType } from "../types/chat";
import {
  get,
  del,
  post,
  checkAdminAuth,
  getAdminChatMessages,
  getAdminChatroom,
  createAdminChatroom,
  joinAdminChatroom,
  leaveAdminChatroom,
  getAdminChatrooms,
} from "@/utils/api";
import { useGlobalAdminMember } from "@/auth/adminMember";
import { format, parseISO, isToday } from "date-fns";
import { ko } from "date-fns/locale";

// API 응답 타입 정의
interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

// 타입 정의
interface ChatContextType {
  chatrooms: ChatroomType[];
  selectedChatroom: ChatroomType | null;
  messages: ChatMessageType[];
  connecting: boolean;
  connected: boolean;
  createChatroom: (title: string) => Promise<ChatroomType | void>;
  joinChatroom: (chatroomId: number) => Promise<void>;
  leaveChatroom: (chatroomId: number) => Promise<void>;
  sendMessage: (message: string) => void;
  selectChatroom: (chatroom: ChatroomType) => void;
  disconnect: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [chatrooms, setChatrooms] = useState<ChatroomType[]>([]);
  const [selectedChatroom, setSelectedChatroom] = useState<ChatroomType | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [initialized, setInitialized] = useState(false);
  // 인증 상태 확인용 상태 추가
  const [authChecked, setAuthChecked] = useState(false);

  // 관리자 사용자 정보 사용 - 직접 참조만 하고 상태로 저장하지 않음
  const { adminMember, isAdminLogin } = useGlobalAdminMember();

  // 초기화 상태를 관리하는 ref
  const initRef = useRef(false);
  // API 호출 중인지 추적하는 ref
  const isLoadingRef = useRef(false);
  // 초기화 시도 횟수 추적
  const initAttemptRef = useRef(0);
  // 최대 초기화 시도 횟수
  const MAX_INIT_ATTEMPTS = 3;

  // ChatProvider 함수 내부에 구독 관리를 위한 상태 추가
  const [subscriptions, setSubscriptions] = useState<{
    [key: string]: { id: string };
  }>({});

  // 관리자 인증 상태 확인하는 함수 추가
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        await checkAdminAuth();
        setAuthChecked(true);
        console.log("[ChatContext] 관리자 인증 확인 완료");
      } catch (error) {
        console.warn("[ChatContext] 관리자 인증 확인 실패:", error);
        setAuthChecked(false);
      }
    };

    if (isAdminLogin && adminMember?.id) {
      checkAdminStatus();
    }
  }, [isAdminLogin, adminMember?.id]);

  // 초기 데이터 로드
  useEffect(() => {
    // 이미 초기화되었거나 로딩 중이면 무시
    if (initRef.current || isLoadingRef.current) {
      return;
    }

    // 인증 확인이 완료되었고, 관리자 로그인 상태이며, 관리자 ID가 있는 경우에만 초기화 진행
    if (!authChecked || !isAdminLogin || !adminMember?.id) {
      console.log(
        "[ChatContext] 초기화 조건 미충족: authChecked=",
        authChecked,
        "isAdminLogin=",
        isAdminLogin,
        "adminMember?.id=",
        adminMember?.id
      );
      return;
    }

    // 초기화 시도 횟수 증가
    initAttemptRef.current += 1;
    if (initAttemptRef.current > MAX_INIT_ATTEMPTS) {
      console.warn(
        `[ChatContext] 최대 초기화 시도 횟수(${MAX_INIT_ATTEMPTS})를 초과했습니다. 초기화를 중단합니다.`
      );
      return;
    }

    async function initData() {
      // 로딩 상태 설정
      isLoadingRef.current = true;

      try {
        console.log(
          `[ChatContext] initData 호출 (시도 ${initAttemptRef.current}/${MAX_INIT_ATTEMPTS}):`,
          new Date().toISOString()
        );
        // 채팅방 목록만 가져오기
        await fetchChatrooms();
        // 성공적으로 초기화되었음을 표시
        initRef.current = true;
        setInitialized(true);
        console.log("[ChatContext] 초기화 완료");
      } catch (error) {
        console.error(
          `[ChatContext] 초기 데이터 로드 실패 (시도 ${initAttemptRef.current}/${MAX_INIT_ATTEMPTS}):`,
          error
        );

        // 초기화 실패 시 3초 후 다시 시도
        if (initAttemptRef.current < MAX_INIT_ATTEMPTS) {
          console.log(`[ChatContext] ${3000}ms 후 다시 시도합니다...`);
          setTimeout(() => {
            isLoadingRef.current = false; // 로딩 상태 해제하여 다시 시도 가능하게 함
          }, 3000);
        }
      } finally {
        isLoadingRef.current = false;
      }
    }

    initData();
  }, [isAdminLogin, adminMember?.id, authChecked]); // authChecked 의존성 추가

  // 채팅방 목록 가져오기
  const fetchChatrooms = async () => {
    console.log(
      "[ChatContext] 채팅방 목록 가져오기 시작:",
      new Date().toISOString()
    );

    // 인증 상태 다시 확인
    if (!isAdminLogin || !adminMember?.id) {
      console.warn(
        "[ChatContext] 관리자 인증 상태가 아닙니다. 채팅방 목록을 가져올 수 없습니다."
      );
      throw new Error("관리자 인증이 필요합니다.");
    }

    try {
      // 관리자용 API 호출
      console.log("[ChatContext] getAdminChatrooms API 호출 시도");
      const response = await getAdminChatrooms();
      console.log(
        "[ChatContext] 채팅방 목록 가져오기 성공:",
        new Date().toISOString(),
        "응답 데이터:",
        response
      );

      // 응답 구조 확인 및 데이터 추출
      let apiChatrooms = response;

      // API 응답이 객체이고 data 속성이 있는 경우 (ApiResponse 형식)
      if (response && typeof response === "object" && "data" in response) {
        apiChatrooms = response.data;
      }

      // 배열인지 확인
      if (!Array.isArray(apiChatrooms)) {
        console.error(
          "[ChatContext] 채팅방 목록 응답이 배열이 아닙니다:",
          apiChatrooms
        );
        setChatrooms([]);
        return [];
      }

      // 타입 변환
      const formattedChatrooms: ChatroomType[] = apiChatrooms.map(
        (room: any) => ({
          id: room.id,
          title: room.title || (room.id ? `채팅방 #${room.id}` : "채팅방"),
          hasNewMessage: room.hasNewMessage || false,
          userCount: room.userCount || 0,
          createdAt: room.createdAt || "",
        })
      );

      setChatrooms(formattedChatrooms);
      return formattedChatrooms;
    } catch (error) {
      console.error("[ChatContext] 채팅방 목록 불러오기 실패:", error);

      // 직접 API 호출 시도는 제거 (관리자 API만 사용)
      setChatrooms([]);
      throw error; // 오류 전파
    }
  };

  // 메시지 목록 가져오기
  const fetchMessages = async (chatroomId: number) => {
    try {
      // 관리자용 API 사용
      const response = await getAdminChatMessages(chatroomId);
      console.log("[ChatContext] 메시지 목록 가져오기 응답:", response);

      // 응답 구조 확인 및 데이터 추출
      let apiMessages = response;

      // API 응답이 객체이고 data 속성이 있는 경우 (ApiResponse 형식)
      if (response && typeof response === "object" && "data" in response) {
        apiMessages = response.data;
      }

      // 배열인지 확인
      if (!Array.isArray(apiMessages)) {
        console.error(
          "[ChatContext] 메시지 목록 응답이 배열이 아닙니다:",
          apiMessages
        );
        setMessages([]);
        return [];
      }

      // 원본 메시지 데이터 로그 출력 (디버깅용)
      console.log(
        "[ChatContext] 백엔드에서 받은 원본 메시지 데이터:",
        apiMessages
      );

      if (apiMessages) {
        // 타임스탬프가 없는 메시지에 타임스탬프 추가
        const messagesWithUserInfo = await Promise.all(
          apiMessages.map(async (message: any) => {
            // 로그 추가: 각 메시지 정보 (디버깅용)
            console.log("[ChatContext] 메시지 변환 정보:", {
              id: message.id,
              userId: message.userId,
              userName: message.userName || "사용자", // userName이 없을 때 기본값 출력
            });

            // 기본 필드 설정
            // 타입 변환
            const messageWithInfo: ChatMessageType = {
              id:
                typeof message.id === "string"
                  ? parseInt(message.id)
                  : message.id,
              userId: message.userId,
              message: message.message,
              // 타임스탬프 포맷 처리 강화
              timestamp: formatMessageTimestamp(message.timestamp),
              isSystem: message.isSystem,
              isNew: message.isNew,
              isMyMessage: message.isMyMessage,
              userName: message.userName || "사용자", // userName이 없을 때 기본값 사용
              profileImageUrl: message.profileImageUrl || undefined,
              apartmentName: message.apartmentName || undefined,
              buildingName: message.buildingName || undefined,
              unitNumber: message.unitNumber || undefined,
            };

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
      console.error("[ChatContext] 메시지 불러오기 실패:", error);
      return [];
    }
  };

  // 메시지 타임스탬프 포맷팅 유틸리티 함수
  const formatMessageTimestamp = (timestamp: any): string => {
    if (!timestamp) {
      return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

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
      console.error(
        "[ChatContext] 타임스탬프 변환 중 오류 발생:",
        error,
        "원본 값:",
        timestamp
      );
      // 변환 실패 시 원본 문자열 사용 (있는 경우)
      return typeof timestamp === "string"
        ? timestamp
        : new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
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
      console.error("[ChatContext] 채팅방 생성 실패:", error);
      throw error;
    }
  };

  // 채팅방 참여
  const joinChatroom = async (chatroomId: number) => {
    const currentChatroomId = selectedChatroom?.id;

    try {
      // 관리자용 API 사용
      await joinAdminChatroom(chatroomId, currentChatroomId);

      // 스톰프 연결 설정
      connectStomp(chatroomId);

      // 채팅방 정보 가져오기
      const apiChatroom = await getAdminChatroom(chatroomId);
      if (apiChatroom) {
        // 타입 변환
        const formattedChatroom: ChatroomType = {
          id: apiChatroom.id,
          title: apiChatroom.title || "",
          hasNewMessage: apiChatroom.hasNewMessage || false,
          userCount: apiChatroom.userCount || 0,
          createdAt: apiChatroom.createdAt || "",
        };

        setSelectedChatroom(formattedChatroom);
      }

      // 메시지 목록 가져오기
      await fetchMessages(chatroomId);

      // 채팅방 목록 갱신
      await fetchChatrooms();
    } catch (error) {
      console.error("[ChatContext] 채팅방 참여 실패:", error);

      // 직접 API 호출 시도 (관리자용 API만 사용하도록 수정)
      try {
        console.log("[ChatContext] 대체 방법으로 채팅방 참여 API 호출 시도...");
        const queryParam = currentChatroomId
          ? `?currentChatroomId=${currentChatroomId}`
          : "";
        await get(
          `/api/v1/chats/${chatroomId}/users${queryParam}`,
          undefined,
          true
        );

        // 스톰프 연결 설정
        connectStomp(chatroomId);

        // 채팅방 정보 직접 가져오기
        const response = await get<ApiResponse<ChatroomType>>(
          `/api/v1/chats/${chatroomId}`,
          undefined,
          true
        );

        if (response && response.data) {
          const formattedChatroom: ChatroomType = {
            id: response.data.id,
            title: response.data.title || "",
            hasNewMessage: response.data.hasNewMessage || false,
            userCount: response.data.userCount || 0,
            createdAt: response.data.createdAt || "",
          };

          setSelectedChatroom(formattedChatroom);
        }

        // 메시지 목록 가져오기
        await fetchMessages(chatroomId);

        // 채팅방 목록 갱신
        await fetchChatrooms();

        return;
      } catch (fallbackError) {
        console.error("[ChatContext] 대체 방법도 실패:", fallbackError);
        throw error; // 원래 오류 그대로 던짐
      }
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
      console.error("[ChatContext] 채팅방 나가기 실패:", error);

      // 대체 방법 (관리자용 API만 사용하도록 수정)
      try {
        console.log(
          "[ChatContext] 대체 방법으로 채팅방 나가기 API 호출 시도..."
        );
        await del(`/api/v1/chats/${chatroomId}/users`, undefined, true);

        setSelectedChatroom(null);
        setMessages([]);
        if (stompClient) {
          stompClient.deactivate();
          setStompClient(null);
          setConnected(false);
        }

        await fetchChatrooms();
        return;
      } catch (fallbackError) {
        console.error("[ChatContext] 대체 방법도 실패:", fallbackError);
        throw error; // 원래 오류 그대로 던짐
      }
    }
  };

  // STOMP 클라이언트 연결
  const connectStomp = (chatroomId: number) => {
    // 이전 연결 해제
    if (stompClient) {
      // 모든 구독 취소
      Object.values(subscriptions).forEach((sub) => {
        try {
          stompClient.unsubscribe(sub.id);
        } catch (e) {
          console.log("구독 해제 중 오류:", e);
        }
      });

      stompClient.deactivate();
      setSubscriptions({});
    }

    setConnecting(true);

    console.log(`[ChatContext] 채팅방 ${chatroomId}에 WebSocket 연결 시작...`);

    // 백엔드 서버 URL 추출
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8090";

    const client = new Client({
      webSocketFactory: () => new SockJS(`${apiBaseUrl}/stomp/chats`),
      debug: function (str) {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      setConnected(true);
      setConnecting(false);

      console.log(`[ChatContext] 채팅방 ${chatroomId}에 WebSocket 연결 완료`);

      // 신규 구독 저장용 객체
      const newSubscriptions: { [key: string]: { id: string } } = {};

      // 채팅방 메시지 구독 - 관리자 경로 사용
      const chatRoomSubscription = client.subscribe(
        `/sub/chats/${chatroomId}`,
        (message) => {
          const receivedMessage = JSON.parse(message.body);

          console.log(`채팅방 ${chatroomId} 메시지 수신:`, receivedMessage);

          // requestAnimationFrame을 사용해 다음 프레임에 상태 업데이트 예약
          requestAnimationFrame(() => {
            // 보낸 사람 정보 설정
            let senderInfo: Partial<ChatMessageType> = {};

            // 현재 사용자 메시지인지 확인
            if (receivedMessage.userId === adminMember?.id) {
              senderInfo = {
                userName: adminMember.userName,
                profileImageUrl: adminMember.profileImageUrl || undefined,
                apartmentName: adminMember.apartmentName || undefined,
                buildingName: adminMember.buildingName || undefined,
                unitNumber: adminMember.unitNumber || undefined,
              };
            } else {
              // 다른 사용자의 메시지인 경우 수신된 메시지의 userName을 사용
              senderInfo = {
                userName: getValidUserName(receivedMessage),
                profileImageUrl: receivedMessage.profileImageUrl || undefined,
                apartmentName: receivedMessage.apartmentName || undefined,
                buildingName: receivedMessage.buildingName || undefined,
                unitNumber: receivedMessage.unitNumber || undefined,
              };
            }

            setMessages((prev) => [
              ...prev,
              {
                userId: receivedMessage.userId,
                message: receivedMessage.message,
                timestamp: receivedMessage.timestamp
                  ? typeof receivedMessage.timestamp === "string" &&
                    (receivedMessage.timestamp.includes("오전") ||
                      receivedMessage.timestamp.includes("오후"))
                    ? receivedMessage.timestamp
                    : format(new Date(receivedMessage.timestamp), "a h:mm", {
                        locale: ko,
                      })
                  : new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                isNew: true,
                ...senderInfo,
              } as ChatMessageType,
            ]);

            // 애니메이션 처리
            requestAnimationFrame(() => {
              setTimeout(() => {
                setMessages((prev) =>
                  prev.map((msg, idx) =>
                    idx === prev.length - 1 ? { ...msg, isNew: false } : msg
                  )
                );
              }, 400);
            });
          });
        }
      );

      // 구독 ID 저장
      newSubscriptions[`chatroom-${chatroomId}`] = {
        id: chatRoomSubscription.id,
      };

      // 채팅방 업데이트 구독
      const updateSubscription = client.subscribe(
        "/sub/chats/updates",
        (update) => {
          const chatroomUpdate = JSON.parse(update.body);
          setChatrooms((prev) =>
            prev.map((room) =>
              room.id === chatroomUpdate.id ? chatroomUpdate : room
            )
          );
        }
      );

      // 업데이트 구독 ID 저장
      newSubscriptions["updates"] = { id: updateSubscription.id };

      // 모든 구독 상태 업데이트
      setSubscriptions(newSubscriptions);

      // 입장 메시지를 로컬에서 추가 (시스템 메시지)
      if (adminMember) {
        setMessages((prev) => [
          ...prev,
          {
            userId: 0,
            message: `${adminMember.userName}님이 입장하셨습니다.`,
            isSystem: true,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          } as ChatMessageType,
        ]);
      }
    };

    client.onDisconnect = () => {
      setConnected(false);
      setConnecting(false);
      setSubscriptions({});
    };

    client.activate();
    setStompClient(client);
  };

  // 메시지 전송
  const sendMessage = (message: string) => {
    if (!stompClient || !connected) {
      console.error(
        "[ChatContext] 연결이 활성화되지 않아 메시지를 보낼 수 없습니다."
      );
      return;
    }

    if (!selectedChatroom || !selectedChatroom.id) {
      console.error(
        "[ChatContext] 선택된 채팅방이 없거나 ID가 없어 메시지를 보낼 수 없습니다."
      );
      return;
    }

    const chatroomId = selectedChatroom.id;
    console.log(`[ChatContext] 메시지 전송 대상 채팅방 ID: ${chatroomId}`);

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      console.log("[ChatContext] 빈 메시지는 전송하지 않습니다.");
      return;
    }

    if (!adminMember) {
      console.error(
        "[ChatContext] 관리자 정보가 없어 메시지를 보낼 수 없습니다."
      );
      return;
    }

    const messageData = {
      message: trimmedMessage,
      userId: adminMember.id,
    };

    console.log(`[ChatContext] 채팅방 ${chatroomId}로 메시지 전송:`, {
      message:
        trimmedMessage.substring(0, 20) +
        (trimmedMessage.length > 20 ? "..." : ""),
      userId: adminMember.id,
      destination: `/pub/chats/${chatroomId}`,
    });

    try {
      // 명시적으로 선택된 채팅방 ID 로깅 및 사용
      const destination = `/pub/chats/${chatroomId}`;

      stompClient.publish({
        destination: destination,
        body: JSON.stringify(messageData),
      });

      console.log(`[ChatContext] 메시지가 ${destination}로 성공적으로 전송됨`);
    } catch (error) {
      console.error(
        `[ChatContext] 채팅방 ${chatroomId}로 메시지 전송 중 오류 발생:`,
        error
      );
    }
  };

  // 채팅방 선택
  const selectChatroom = async (chatroom: ChatroomType) => {
    // 이미 선택된 채팅방인 경우 무시
    if (selectedChatroom?.id === chatroom.id) {
      console.log(`[ChatContext] 이미 선택된 채팅방 ${chatroom.id} 입니다.`);
      return;
    }

    console.log(
      `[ChatContext] 채팅방 선택: 이전=${selectedChatroom?.id}, 새로운=${chatroom.id}`
    );

    // 기존 연결 정리
    if (stompClient) {
      Object.values(subscriptions).forEach((sub) => {
        try {
          stompClient.unsubscribe(sub.id);
        } catch (e) {
          console.log("구독 해제 중 오류:", e);
        }
      });
    }

    // 메시지 목록 초기화 및 새 채팅방 설정
    setMessages([]);

    // 채팅방에 title이 없는 경우 기본값 설정
    const chatroomWithTitle = {
      ...chatroom,
      title:
        chatroom.title || (chatroom.id ? `채팅방 #${chatroom.id}` : "채팅방"),
    };

    setSelectedChatroom(chatroomWithTitle);

    try {
      // 이미 참여 중인지 확인
      const isAlreadyJoined = chatrooms.some(
        (room) => room.id === chatroom.id && room.userCount > 0
      );

      if (!isAlreadyJoined) {
        // 아직 참여하지 않은 경우에만 조인 요청
        await joinChatroom(chatroom.id);
      } else {
        // 이미 참여 중인 경우에는 메시지만 가져옴
        try {
          const data = await get<ApiResponse<ChatroomType>>(
            `/api/v1/chats/${chatroom.id}`,
            undefined,
            true
          );
          if (data && data.data) {
            setSelectedChatroom(data.data);
          }
        } catch (error) {
          console.error("[ChatContext] 채팅방 정보 가져오기 실패:", error);
        }

        // 메시지 목록 가져오기
        await fetchMessages(chatroom.id);

        // 웹소켓 연결 설정
        connectStomp(chatroom.id);
      }
    } catch (error) {
      // 이미 참여한 채팅방 오류인 경우 무시하고 메시지만 가져옴
      if (
        error instanceof Error &&
        error.message.includes("이미 참여한 채팅방입니다")
      ) {
        console.log(
          "[ChatContext] 이미 참여 중인 채팅방입니다. 메시지만 가져옵니다."
        );

        try {
          const data = await get<ApiResponse<ChatroomType>>(
            `/api/v1/chats/${chatroom.id}`,
            undefined,
            true
          );
          if (data && data.data) {
            setSelectedChatroom(data.data);
          }
        } catch (error) {
          console.error("[ChatContext] 채팅방 정보 가져오기 실패:", error);
        }

        // 메시지 목록 가져오기
        await fetchMessages(chatroom.id);

        // 웹소켓 연결 설정
        connectStomp(chatroom.id);
      } else {
        console.error("[ChatContext] 채팅방 선택 중 오류 발생:", error);
        throw error;
      }
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

  const value = {
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
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// 유효한 사용자 이름 가져오기
const getValidUserName = (message: any) => {
  // 지정된 필드 순서대로 확인하여 사용 가능한 첫 번째 이름 반환
  const possibleNameFields = [
    "userName",
    "username",
    "name",
    "nick",
    "nickname",
  ];

  // 단계적 확인 및 로깅
  console.log("[ChatContext] 사용자 이름 찾기 시도:", {
    availableFields: Object.keys(message).filter(
      (key) => possibleNameFields.includes(key) && message[key]
    ),
  });

  // 먼저 직접 userName 확인
  if (message.userName && message.userName.trim() !== "") {
    console.log("[ChatContext] userName 필드 사용:", message.userName);
    return message.userName;
  }

  // 다른 가능한 필드들 확인
  for (const field of possibleNameFields) {
    if (message[field] && message[field].trim() !== "") {
      console.log(`[ChatContext] 대체 필드 사용 (${field}):`, message[field]);
      return message[field];
    }
  }

  // 기본값 반환
  console.log("[ChatContext] 사용자 이름 필드를 찾을 수 없어 기본값 사용");
  return "사용자";
};
