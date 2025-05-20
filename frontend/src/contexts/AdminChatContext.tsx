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
import type { ChatroomType, ChatMessageType } from "@/types/chat";
import {
  checkAdminAuth,
  getAdminChatrooms,
  getAdminChatMessages,
  getAdminChatroom,
  createAdminChatroom,
  joinAdminChatroom,
  leaveAdminChatroom,
  get,
} from "@/utils/api";
import { useGlobalAdminMember } from "@/auth/adminMember";

// API 응답 타입 정의
interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

// 타입 정의
interface AdminChatContextType {
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
  const [chatrooms, setChatrooms] = useState<ChatroomType[]>([]);
  const [selectedChatroom, setSelectedChatroom] = useState<ChatroomType | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // 관리자 사용자 정보 사용 - 직접 참조만 하고 상태로 저장하지 않음
  const { adminMember, isAdminLogin } = useGlobalAdminMember();

  // 초기화 상태를 관리하는 ref
  const initRef = useRef(false);
  // API 호출 중인지 추적하는 ref
  const isLoadingRef = useRef(false);

  // 초기 데이터 로드
  useEffect(() => {
    // 이미 초기화되었거나 로딩 중이거나 관리자 로그인이 안되어 있거나 adminMember가 유효하지 않으면 무시
    if (
      initRef.current ||
      isLoadingRef.current ||
      !isAdminLogin ||
      !adminMember?.id
    ) {
      return;
    }

    async function initData() {
      // 로딩 상태 설정
      isLoadingRef.current = true;

      try {
        console.log(
          "AdminChatContext initData 호출:",
          new Date().toISOString()
        );
        // 채팅방 목록만 가져오기
        await fetchChatrooms();
        // 성공적으로 초기화되었음을 표시
        initRef.current = true;
        setInitialized(true);
      } catch (error) {
        console.error("초기 데이터 로드 실패:", error);
      } finally {
        isLoadingRef.current = false;
      }
    }

    initData();
  }, [isAdminLogin, adminMember?.id]); // 관리자 로그인 상태와 ID가 변경될 때만 실행

  // 채팅방 목록 가져오기
  const fetchChatrooms = async () => {
    console.log(
      "관리자용 채팅방 목록 가져오기 시작:",
      new Date().toISOString()
    );
    try {
      // 관리자용 API 호출
      const apiChatrooms = await getAdminChatrooms();
      console.log(
        "관리자용 채팅방 목록 가져오기 성공:",
        new Date().toISOString()
      );

      // 타입 변환
      const formattedChatrooms: ChatroomType[] = apiChatrooms.map(
        (room: any) => ({
          id: room.id,
          title: room.title || "",
          hasNewMessage: room.hasNewMessage || false,
          userCount: room.userCount || 0,
          createdAt: room.createdAt || "",
        })
      );

      setChatrooms(formattedChatrooms);
      return formattedChatrooms;
    } catch (error) {
      console.error("관리자용 채팅방 목록 불러오기 실패:", error);
      setChatrooms([]);
      return [];
    }
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

  // 채팅방 참여
  const joinChatroom = async (chatroomId: number) => {
    try {
      const currentChatroomId = selectedChatroom?.id;
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
      console.error("관리자용 채팅방 참여 실패:", error);
      throw error;
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

  // STOMP 클라이언트 연결
  const connectStomp = (chatroomId: number) => {
    if (stompClient) {
      stompClient.deactivate();
    }

    setConnecting(true);

    // 현재 사용자 확인
    // 로그를 한 번만 출력하도록 수정
    console.log("관리자용 WebSocket 연결 시 사용자 정보:", {
      id: adminMember?.id,
      userName: adminMember?.userName,
    });

    // 백엔드 서버 URL 추출 (http://localhost:8090 형식)
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8090";

    const client = new Client({
      // WebSocket 직접 연결 대신 SockJS 사용 - 관리자용 경로로 변경
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

      console.log("관리자용 WebSocket 연결 완료");

      // 채팅방 메시지 구독 - 공용 경로 사용
      client.subscribe(`/sub/chats/${chatroomId}`, (message) => {
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
          }

          setMessages((prev) => [
            ...prev,
            {
              userId: receivedMessage.userId,
              message: receivedMessage.message,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              isNew: true, // 새 메시지 표시
              ...senderInfo,
            } as ChatMessageType,
          ]);

          // 자연스러운 애니메이션을 위해 requestAnimationFrame 중첩
          requestAnimationFrame(() => {
            // 애니메이션 최적화를 위해 약간 지연 후 isNew 제거
            setTimeout(() => {
              setMessages((prev) =>
                prev.map((msg, idx) =>
                  idx === prev.length - 1 ? { ...msg, isNew: false } : msg
                )
              );
            }, 400); // 애니메이션 지속 시간보다 조금 더 긴 시간
          });
        });
      });

      // 채팅방 업데이트 구독 - 공용 경로 사용
      client.subscribe("/sub/chats/updates", (update) => {
        const chatroomUpdate = JSON.parse(update.body);
        setChatrooms((prev) =>
          prev.map((room) =>
            room.id === chatroomUpdate.id ? chatroomUpdate : room
          )
        );
      });

      // 입장 메시지를 로컬에서 추가 (시스템 메시지)
      if (adminMember) {
        // 클라이언트 측에서만 표시될 시스템 메시지
        setMessages((prev) => [
          ...prev,
          {
            userId: 0, // 시스템 메시지는 userId를 0으로 설정
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
    };

    client.activate();
    setStompClient(client);
  };

  // 메시지 전송
  const sendMessage = (message: string) => {
    if (!stompClient || !connected || !selectedChatroom) return;

    // 메시지가 없거나 공백만 있는 경우 무시
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    // userId가 없으면 메시지를 보낼 수 없음
    if (!adminMember?.id) {
      console.error("사용자 ID가 없어 메시지를 보낼 수 없습니다.");
      return;
    }

    const messageData = {
      message: trimmedMessage,
      userId: adminMember.id,
    };

    try {
      // 관리자용 경로로 변경
      stompClient.publish({
        destination: `/pub/chats/${selectedChatroom.id}`,
        body: JSON.stringify(messageData),
      });
    } catch (error) {
      console.error("메시지 전송 중 오류 발생:", error);
    }
  };

  // 채팅방 선택
  const selectChatroom = async (chatroom: ChatroomType) => {
    // 이미 선택된 채팅방인 경우 무시
    if (selectedChatroom?.id === chatroom.id) {
      return;
    }

    setSelectedChatroom(chatroom);

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
        // 채팅방 정보 가져오기 - 관리자용 API로 변경
        const data = await get<ApiResponse<ChatroomType>>(
          `/api/v1/admin/chats/${chatroom.id}`,
          undefined,
          true
        );
        if (data && data.data) {
          setSelectedChatroom(data.data);
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
        console.log("이미 참여 중인 채팅방입니다. 메시지만 가져옵니다.");
        // 채팅방 정보 가져오기 - 관리자용 API로 변경
        const data = await get<ApiResponse<ChatroomType>>(
          `/api/v1/admin/chats/${chatroom.id}`,
          undefined,
          true
        );
        if (data && data.data) {
          setSelectedChatroom(data.data);
        }

        // 메시지 목록 가져오기
        await fetchMessages(chatroom.id);

        // 웹소켓 연결 설정
        connectStomp(chatroom.id);
      } else {
        // 다른 오류는 그대로 전파
        console.error("관리자용 채팅방 선택 중 오류 발생:", error);
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

  return (
    <AdminChatContext.Provider value={value}>
      {children}
    </AdminChatContext.Provider>
  );
}
