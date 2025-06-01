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
  const [authChecked, setAuthChecked] = useState(false);
  // 비동기 작업 상태 추가
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  // 관리자 사용자 정보 사용 - 직접 참조만 하고 상태로 저장하지 않음
  const { adminMember, isAdminLogin } = useGlobalAdminMember();

  // 초기화 중인지 추적하는 ref
  const isLoadingRef = useRef(false);
  // 초기화 여부 ref로 변경
  const initializedRef = useRef(false);
  // 초기화 시도 횟수 추적
  const initAttemptRef = useRef(0);
  // 최대 초기화 시도 횟수
  const MAX_INIT_ATTEMPTS = 3;
  // 진행 중인 작업 추적 ref (race condition 방지)
  const pendingActionRef = useRef<string | null>(null);

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
    if (isLoadingRef.current || initializedRef.current) {
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
        initializedRef.current = true;
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
    if (isLoadingRef.current || initializedRef.current) return;
    isLoadingRef.current = true;
    try {
      const response = await getAdminChatrooms();
      console.log("[ChatContext][fetchChatrooms] API 응답:", response);
      console.log(
        "[ChatContext][fetchChatrooms] setChatrooms 호출, 기존 상태:",
        chatrooms
      );
      setChatrooms(response);
      console.log(
        "[ChatContext][fetchChatrooms] setChatrooms 후 상태:",
        response
      );
      initializedRef.current = true;
    } finally {
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    if (
      !initializedRef.current &&
      isAdminLogin &&
      adminMember?.id &&
      authChecked
    ) {
      fetchChatrooms();
    }
  }, [isAdminLogin, adminMember?.id, authChecked]);

  // 메시지 목록 가져오기
  const fetchMessages = async (chatroomId: number) => {
    try {
      // 관리자용 API 사용
      const response = await getAdminChatMessages(chatroomId);
      console.log("[ChatContext][fetchMessages] API 응답:", response);

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

        console.log(
          "[ChatContext][fetchMessages] setMessages 호출, 기존 상태:",
          messages
        );
        setMessages(messagesWithUserInfo);
        console.log(
          "[ChatContext][fetchMessages] setMessages 후 상태:",
          messagesWithUserInfo
        );
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
    // 이미 join 진행 중이면 중복 호출 방지
    if (isJoining) {
      console.log(
        `[ChatContext] 이미 채팅방 참여 진행 중입니다. chatroomId: ${chatroomId}`
      );
      return;
    }

    // 이미 leave 진행 중이면 충돌 방지
    if (isLeaving) {
      console.log(
        `[ChatContext] 채팅방 나가기 진행 중입니다. 완료 후 다시 시도하세요.`
      );
      return;
    }

    // 이미 같은 채팅방을 선택한 경우 중복 방지
    if (selectedChatroom?.id === chatroomId) {
      console.log(
        `[ChatContext] 이미 선택된 채팅방입니다. chatroomId: ${chatroomId}`
      );
      return;
    }

    // 참여 중인 채팅방인지 확인
    const isAlreadyJoined = chatrooms.some((room) => room.id === chatroomId);
    if (isAlreadyJoined) {
      console.log(
        `[ChatContext] 이미 참여 중인 채팅방입니다. chatroomId: ${chatroomId}`
      );
      // 이미 참여 중이면 메시지만 가져오고 웹소켓 연결
      try {
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

        // 스톰프 연결 설정
        connectStomp(chatroomId);
        return;
      } catch (error) {
        console.error("[ChatContext] 채팅방 정보 가져오기 실패:", error);
        return;
      }
    }

    const currentChatroomId = selectedChatroom?.id;
    setIsJoining(true);
    pendingActionRef.current = `join-${chatroomId}`;

    try {
      console.log(
        "[ChatContext][joinChatroom] 참여 요청 chatroomId:",
        chatroomId
      );
      console.log(
        "[ChatContext][joinChatroom] setSelectedChatroom 호출, 기존 상태:",
        selectedChatroom
      );
      setSelectedChatroom(formattedChatroom);
      console.log(
        "[ChatContext][joinChatroom] setSelectedChatroom 후 상태:",
        formattedChatroom
      );

      // 관리자용 API 사용
      await joinAdminChatroom(chatroomId, currentChatroomId);

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

      // 스톰프 연결 설정 (join 성공 후에만)
      connectStomp(chatroomId);

      // 채팅방 목록 갱신
      await fetchChatrooms();
      console.log(`[ChatContext] 채팅방 ${chatroomId} 참여 완료`);

      // status 불일치 감지
      if (apiChatroom && chatrooms) {
        const listRoom = chatrooms.find((r) => r.id === chatroomId);
        if (listRoom && listRoom.status !== apiChatroom.status) {
          console.warn(
            "[ChatContext][joinChatroom] 상태 불일치 감지! 목록 status:",
            listRoom.status,
            "상세 status:",
            apiChatroom.status,
            "roomId:",
            chatroomId
          );
        }
      }
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

        // 스톰프 연결 설정
        connectStomp(chatroomId);

        // 채팅방 목록 갱신
        await fetchChatrooms();
      } catch (fallbackError) {
        console.error("[ChatContext] 대체 방법도 실패:", fallbackError);
        throw error; // 원래 오류 그대로 던짐
      }
    } finally {
      setIsJoining(false);
      if (pendingActionRef.current === `join-${chatroomId}`) {
        pendingActionRef.current = null;
      }
    }
  };

  // 채팅방 나가기
  const leaveChatroom = async (chatroomId: number) => {
    // 이미 leave 진행 중이면 중복 호출 방지
    if (isLeaving) {
      console.log(
        `[ChatContext] 이미 채팅방 나가기 진행 중입니다. chatroomId: ${chatroomId}`
      );
      return;
    }

    // 이미 join 진행 중이면 충돌 방지
    if (isJoining) {
      console.log(
        `[ChatContext] 채팅방 참여 진행 중입니다. 완료 후 다시 시도하세요.`
      );
      return;
    }

    // 참여 중인 채팅방인지 확인
    const isJoined = chatrooms.some((room) => room.id === chatroomId);
    if (!isJoined) {
      console.log(
        `[ChatContext] 참여하지 않은 채팅방은 나갈 수 없습니다. chatroomId: ${chatroomId}`
      );
      return;
    }

    setIsLeaving(true);
    pendingActionRef.current = `leave-${chatroomId}`;

    try {
      console.log(`[ChatContext] 채팅방 ${chatroomId} 나가기 시작`);
      // 관리자용 API 사용
      await leaveAdminChatroom(chatroomId);

      // 연결 해제 및 상태 초기화
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
        setStompClient(null);
        setConnected(false);
        setSubscriptions({});
      }

      setSelectedChatroom(null);
      setMessages([]);

      // 채팅방 목록 갱신
      await fetchChatrooms();
      console.log(`[ChatContext] 채팅방 ${chatroomId} 나가기 완료`);
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
          setSubscriptions({});
        }

        await fetchChatrooms();
      } catch (fallbackError) {
        console.error("[ChatContext] 대체 방법도 실패:", fallbackError);
        throw error; // 원래 오류 그대로 던짐
      }
    } finally {
      setIsLeaving(false);
      if (pendingActionRef.current === `leave-${chatroomId}`) {
        pendingActionRef.current = null;
      }
    }
  };

  // STOMP 클라이언트 연결
  const connectStomp = (chatroomId: number) => {
    // 이미 같은 채팅방에 연결되어 있는 경우
    if (connected && stompClient && subscriptions[`chatroom-${chatroomId}`]) {
      return;
    }

    // 이전 연결 해제
    if (stompClient) {
      // 모든 구독 취소
      Object.values(subscriptions).forEach((sub) => {
        try {
          stompClient.unsubscribe(sub.id);
        } catch (e) {}
      });

      stompClient.deactivate();
      setSubscriptions({});
    }

    setConnecting(true);

    // 백엔드 서버 URL 추출
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8090";

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
      setConnected(true);
      setConnecting(false);

      // 신규 구독 저장용 객체
      const newSubscriptions: { [key: string]: { id: string } } = {};

      // 채팅방 메시지 구독 - 관리자 경로 사용
      const chatRoomSubscription = client.subscribe(
        `/sub/chats/${chatroomId}`,
        (message) => {
          const receivedMessage = JSON.parse(message.body);

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
      return;
    }

    if (!selectedChatroom || !selectedChatroom.id) {
      return;
    }

    const chatroomId = selectedChatroom.id;

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return;
    }

    if (!adminMember) {
      return;
    }

    const messageData = {
      message: trimmedMessage,
      userId: adminMember.id,
    };

    try {
      // 명시적으로 선택된 채팅방 ID 로깅 및 사용
      const destination = `/pub/chats/${chatroomId}`;

      stompClient.publish({
        destination: destination,
        body: JSON.stringify(messageData),
      });
    } catch (error) {}
  };

  // 채팅방 선택
  const selectChatroom = async (chatroom: ChatroomType) => {
    // 이미 선택된 채팅방인 경우 무시
    if (selectedChatroom?.id === chatroom.id) {
      return;
    }

    // 다른 비동기 작업이 진행 중이면 충돌 방지
    if (isJoining || isLeaving || isSelecting) {
      return;
    }

    setSelectedChatroom(chatroom);

    setIsSelecting(true);
    pendingActionRef.current = `select-${chatroom.id}`;

    try {
      // 메시지 목록 초기화 및 새 채팅방 설정
      setMessages([]);

      // 채팅방에 title이 없는 경우 기본값 설정
      const chatroomWithTitle = {
        ...chatroom,
        title:
          chatroom.title || (chatroom.id ? `채팅방 #${chatroom.id}` : "채팅방"),
      };

      setSelectedChatroom(chatroomWithTitle);

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
        } catch (error) {}

        // 메시지 목록 가져오기
        await fetchMessages(chatroom.id);

        // 웹소켓 연결 설정 (항상 마지막에 수행)
        connectStomp(chatroom.id);
      }
    } catch (error) {
      // 이미 참여한 채팅방 오류인 경우 무시하고 메시지만 가져옴
      if (
        error instanceof Error &&
        error.message.includes("이미 참여한 채팅방입니다")
      ) {
        try {
          const data = await get<ApiResponse<ChatroomType>>(
            `/api/v1/chats/${chatroom.id}`,
            undefined,
            true
          );
          if (data && data.data) {
            setSelectedChatroom(data.data);
          }
        } catch (error) {}

        // 메시지 목록 가져오기
        await fetchMessages(chatroom.id);

        // 웹소켓 연결 설정
        connectStomp(chatroom.id);
      } else {
        // 오류가 발생하면 상태 초기화
        setSelectedChatroom(null);
        setMessages([]);
      }
    } finally {
      setIsSelecting(false);
      if (pendingActionRef.current === `select-${chatroom.id}`) {
        pendingActionRef.current = null;
      }
    }
  };

  // 연결 해제
  const disconnect = () => {
    if (stompClient) {
      // 모든 구독 취소
      Object.values(subscriptions).forEach((sub) => {
        try {
          stompClient.unsubscribe(sub.id);
        } catch (e) {}
      });

      stompClient.deactivate();
      setStompClient(null);
      setConnected(false);
      setSelectedChatroom(null);
      setMessages([]);
      setSubscriptions({});
    }
  };

  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 연결 해제
      if (stompClient) {
        // 모든 구독 취소
        Object.values(subscriptions).forEach((sub) => {
          try {
            stompClient.unsubscribe(sub.id);
          } catch (e) {}
        });

        stompClient.deactivate();
      }
    };
  }, [stompClient, subscriptions]);

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

  // 먼저 직접 userName 확인
  if (message.userName && message.userName.trim() !== "") {
    return message.userName;
  }

  // 다른 가능한 필드들 확인
  for (const field of possibleNameFields) {
    if (message[field] && message[field].trim() !== "") {
      return message[field];
    }
  }

  // 기본값 반환
  return "사용자";
};
