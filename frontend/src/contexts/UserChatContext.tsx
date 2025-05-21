"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { ChatroomType, ChatMessageType } from "../types/chat";
import {
  checkUserAuth,
  getUserChatrooms,
  getUserChatMessages,
  getUserChatroom,
  startChatWithAdmin,
  joinUserChatroom,
  leaveUserChatroom,
} from "@/utils/api";
// import { useGlobalAdminMember } from "@/auth/adminMember"; // 변경: 관리자 멤버 대신 일반 사용자 멤버 사용
import { useGlobalLoginMember } from "@/auth/loginMember"; // useLoginMember 대신 useGlobalLoginMember 사용
import { format, parseISO, isToday } from "date-fns";
import { ko } from "date-fns/locale"; // 한국어 locale 추가

// API 응답 타입 정의
interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

// 타입 정의
interface UserChatContextType {
  // 변경: ChatContextType -> UserChatContextType
  chatrooms: ChatroomType[];
  selectedChatroom: ChatroomType | null;
  messages: ChatMessageType[];
  connecting: boolean;
  connected: boolean;
  createChatroom: (title: string) => Promise<ChatroomType | void>; // 사용자용 채팅방 생성은 보통 관리자가 하므로, 이 기능은 제거하거나 주석 처리 고려
  joinChatroom: (chatroomId: number) => Promise<void>;
  leaveChatroom: (chatroomId: number) => Promise<void>; // 사용자용 채팅방 나가기도 상황에 따라 제거 고려
  sendMessage: (message: string) => void;
  selectChatroom: (chatroom: ChatroomType) => void;
  disconnect: () => void;
}

const UserChatContext = createContext<UserChatContextType | undefined>(
  undefined
); // 변경: ChatContext -> UserChatContext

export function useUserChatContext() {
  // 변경: useChatContext -> useUserChatContext
  const context = useContext(UserChatContext); // 변경: ChatContext -> UserChatContext
  if (!context) {
    throw new Error(
      "useUserChatContext must be used within a UserChatProvider"
    ); // 변경: useChatContext... -> useUserChatContext...
  }
  return context;
}

interface UserChatProviderProps {
  // 변경: ChatProviderProps -> UserChatProviderProps
  children: ReactNode;
}

export function UserChatProvider({ children }: UserChatProviderProps) {
  // 변경: ChatProvider -> UserChatProvider
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [chatrooms, setChatrooms] = useState<ChatroomType[]>([]);
  const [selectedChatroom, setSelectedChatroom] = useState<ChatroomType | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null); // 이 부분은 loginMember에서 가져온 정보로 채워질 예정
  const [initialized, setInitialized] = useState(false);

  // 사용자 정보 사용
  // const { adminMember, isAdminLogin } = useGlobalAdminMember(); // 삭제
  const { loginMember, isLogin } = useGlobalLoginMember(); // useLoginMember 대신 useGlobalLoginMember 사용

  // 사용자 정보가 변경될 때 currentUser 업데이트
  useEffect(() => {
    if (isLogin && loginMember.id > 0) {
      console.log(
        "[UserChatContext] loginMember 유효, currentUser 설정 시도:",
        loginMember
      );
      const newUser = {
        id: Number(loginMember.id), // 명시적으로 숫자로 변환
        userName: loginMember.userName,
        email: loginMember.email,
        profileImageUrl: loginMember.profileImageUrl,
        apartmentName: loginMember.apartmentName,
        buildingName: loginMember.buildingName,
        unitNumber: loginMember.unitNumber,
      };
      setCurrentUser(newUser);
      console.log("[UserChatContext] currentUser 설정 완료:", newUser);
    } else {
      console.log(
        "[UserChatContext] loginMember 없거나 유효하지 않음, currentUser null로 설정"
      );
      setCurrentUser(null);
    }
  }, [loginMember, isLogin]);

  // 채팅방 목록 가져오기 (사용자용 API 엔드포인트 사용)
  const fetchChatrooms = useCallback(async () => {
    console.log("사용자 채팅방 목록 가져오기 시작:", new Date().toISOString());
    try {
      // 새로운 authApi 함수 사용
      const apiResponse = await getUserChatrooms<any>();
      console.log("사용자 채팅방 API 응답:", apiResponse);

      let apiChatrooms: any = apiResponse;

      // apiResponse가 ApiResponse<T> 형식인지 확인 (data 필드 포함)
      if (
        apiResponse &&
        typeof apiResponse === "object" &&
        "data" in apiResponse
      ) {
        apiChatrooms = apiResponse.data;
        console.log("ApiResponse 형식 감지, data 필드 추출:", apiChatrooms);
      }

      // apiChatrooms가 배열인지 확인
      if (!Array.isArray(apiChatrooms)) {
        console.warn("채팅방 목록이 배열이 아닙니다:", apiChatrooms);
        apiChatrooms = [];
      }

      console.log(
        "사용자 채팅방 목록 가져오기 성공:",
        new Date().toISOString(),
        "채팅방 수:",
        apiChatrooms.length
      );

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

      console.log("변환된 채팅방 목록:", formattedChatrooms);
      setChatrooms(formattedChatrooms);
      return formattedChatrooms;
    } catch (error) {
      console.error("사용자 채팅방 목록 불러오기 실패:", error);
      setChatrooms([]);
      return [];
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    async function initData() {
      console.log(
        "[UserChatContext] initData 호출됨. isLogin:",
        isLogin,
        "loginMember.id:",
        loginMember.id
      );
      try {
        // isLogin && loginMember.id > 0 조건은 이미 외부 useEffect에서 확인 후 initData를 호출하므로, 여기서는 바로 실행
        console.log("[UserChatContext] fetchChatrooms 호출 시도...");
        await fetchChatrooms();
        console.log("[UserChatContext] fetchChatrooms 호출 완료.");
      } finally {
        setInitialized(true);
        console.log("[UserChatContext] initialized_set_to_true");
      }
    }

    console.log(
      "[UserChatContext] 초기 데이터 로드 useEffect 실행. initialized:",
      initialized,
      "isLogin:",
      isLogin,
      "loginMember.id:",
      loginMember.id
    );
    if (!initialized && isLogin && loginMember.id > 0) {
      console.log(
        "[UserChatContext] initData 실행 조건 충족 ( !initialized && isLogin && loginMember.id > 0 )"
      );
      initData();
    } else {
      console.log(
        "[UserChatContext] initData 실행 조건 미충족. initialized:",
        initialized,
        "isLogin:",
        isLogin,
        "loginMember.id:",
        loginMember.id
      );
      if (!initialized && !(isLogin && loginMember.id > 0)) {
        console.log(
          "[UserChatContext] 아직 로그인 정보가 준비되지 않았거나, 이미 초기화가 진행된 상태일 수 있습니다."
        );
      }
    }
  }, [initialized, isLogin, loginMember.id, fetchChatrooms]);

  // 현재 사용자 정보 가져오기 (loginMember를 사용하므로 이 함수는 제거하거나 수정)
  // const fetchCurrentUser = async () => { ... }; // 이 함수는 loginMember로 대체되므로 주석 처리 또는 삭제

  // 메시지 목록 가져오기
  const fetchMessages = async (chatroomId: number) => {
    try {
      // 새로운 authApi 함수 사용
      const apiMessages = await getUserChatMessages(chatroomId);
      if (apiMessages) {
        // 로그 추가: 백엔드에서 받은 원본 메시지 데이터 확인
        console.log("백엔드에서 받은 원본 메시지 데이터:", apiMessages);

        // 타입 변환
        const formattedMessages: ChatMessageType[] = apiMessages.map(
          (message: any) => {
            // userId 문자열 변환 및 비교를 통해 isMyMessage 계산
            const isMyMessage =
              String(message.userId) === String(currentUser?.id);

            // DB에서 가져온 메시지의 timestamp 포맷팅
            const originalTimestamp = message.timestamp;
            let formattedTimestamp = "";

            // 이미 포맷팅된 타임스탬프인지 확인
            if (
              typeof originalTimestamp === "string" &&
              (originalTimestamp.includes("오전") ||
                originalTimestamp.includes("오후"))
            ) {
              formattedTimestamp = originalTimestamp;
            } else if (originalTimestamp) {
              try {
                formattedTimestamp = format(
                  new Date(originalTimestamp),
                  "yyyy-MM-dd HH:mm"
                );
              } catch (error) {
                console.error(
                  "타임스탬프 형식 변환 오류:",
                  error,
                  "원본 값:",
                  originalTimestamp
                );
                formattedTimestamp = String(originalTimestamp);
              }
            }

            // 로그 추가: 각 메시지 정보 확인
            console.log("메시지 변환 정보:", {
              id: message.id,
              userId: message.userId,
              userName: message.userName || "사용자", // userName이 없을 때 기본값 출력
              isMyMessage: isMyMessage,
              timestamp: originalTimestamp,
              formattedTimestamp: formattedTimestamp,
            });

            return {
              id:
                typeof message.id === "string"
                  ? parseInt(message.id)
                  : message.id,
              messageId: message.messageId,
              userId: message.userId,
              message: message.message,
              timestamp: formattedTimestamp, // 포맷된 타임스탬프 사용
              isSystem: message.isSystem,
              isNew: false, // 기본값
              isMyMessage: isMyMessage, // 계산된 값 사용
              userName: message.userName || "사용자", // userName이 없을 때 기본값 사용
              profileImageUrl: message.profileImageUrl || undefined,
              apartmentName: message.apartmentName || undefined,
              buildingName: message.buildingName || undefined,
              unitNumber: message.unitNumber || undefined,
            };
          }
        );

        // 변환 결과 로그 출력
        console.log(
          "[fetchMessages] 메시지 목록 변환 완료. 첫 번째 메시지 isMyMessage 여부:",
          formattedMessages.length > 0
            ? `userId:${formattedMessages[0].userId}, currentUser.id:${currentUser?.id}, isMyMessage:${formattedMessages[0].isMyMessage}`
            : "메시지 없음"
        );

        setMessages(formattedMessages);
        return formattedMessages;
      }
      return [];
    } catch (error) {
      console.error("메시지 불러오기 실패:", error);
      return [];
    }
  };

  // 채팅방 생성 (사용자용 - 관리자와의 1:1 채팅 시작)
  const createChatroom = async (title: string) => {
    try {
      console.log("[UserChatContext] 채팅방 생성 시작:", {
        requestedTitle: title,
      });

      // 새로운 authApi 함수 사용
      const apiResponse = await startChatWithAdmin(title);

      console.log("[UserChatContext] 채팅방 생성 응답:", apiResponse);

      // API 응답이 data 필드를 포함한 객체인지 확인
      let apiChatroom: any = apiResponse;
      if (
        apiResponse &&
        typeof apiResponse === "object" &&
        "data" in apiResponse
      ) {
        apiChatroom = apiResponse.data;
      }

      // 타입 변환
      const formattedChatroom: ChatroomType = {
        id: apiChatroom.id,
        title:
          apiChatroom.title ||
          title ||
          (apiChatroom.id ? `채팅방 #${apiChatroom.id}` : "채팅방"),
        hasNewMessage: apiChatroom.hasNewMessage || false,
        userCount: apiChatroom.userCount || 0,
        createdAt: apiChatroom.createdAt || "",
      };

      console.log("[UserChatContext] 채팅방 생성 완료:", {
        requestedTitle: title,
        apiTitle: apiChatroom.title,
        finalTitle: formattedChatroom.title,
      });

      await fetchChatrooms(); // 채팅방 목록 새로고침

      // 새로 생성된 채팅방을 바로 선택하고 연결
      selectChatroom(formattedChatroom);
      return formattedChatroom;
    } catch (error) {
      console.error("채팅방 생성 실패:", error);
      throw error;
    }
  };

  // 채팅방 참여
  const joinChatroom = async (chatroomId: number) => {
    try {
      const currentChatroomId = selectedChatroom?.id;

      // 현재 선택된 채팅방의 제목 저장 (작업 전에 보존)
      const originalChatroomTitle = selectedChatroom?.title;
      console.log("[UserChatContext] 채팅방 참여 시작:", {
        chatroomId,
        originalTitle: originalChatroomTitle,
      });

      // 새로운 authApi 함수 사용
      await joinUserChatroom(chatroomId, currentChatroomId);

      connectStomp(chatroomId);

      // 채팅방 정보 가져오기
      const apiResponse = await getUserChatroom(chatroomId);

      // API 응답 로깅
      console.log("[UserChatContext] getUserChatroom 응답:", apiResponse);

      // API 응답이 data 필드를 포함한 객체인지 확인
      let apiChatroom: any = apiResponse;
      if (
        apiResponse &&
        typeof apiResponse === "object" &&
        "data" in apiResponse
      ) {
        apiChatroom = apiResponse.data;
      }

      if (apiChatroom && apiChatroom.id) {
        // 타입 변환 - 기존 제목 우선 사용
        const formattedChatroom: ChatroomType = {
          id: apiChatroom.id,
          title:
            apiChatroom.title ||
            originalChatroomTitle ||
            (apiChatroom.id ? `채팅방 #${apiChatroom.id}` : "채팅방"),
          hasNewMessage: apiChatroom.hasNewMessage || false,
          userCount: apiChatroom.userCount || 0,
          createdAt: apiChatroom.createdAt || "",
        };

        // 채팅방 정보 업데이트 전 로깅 (디버깅용)
        console.log("[UserChatContext] 채팅방 정보 업데이트:", {
          id: apiChatroom.id,
          originalTitle: originalChatroomTitle,
          apiTitle: apiChatroom.title,
          finalTitle: formattedChatroom.title,
        });

        setSelectedChatroom(formattedChatroom);
      }

      await fetchMessages(chatroomId);
      await fetchChatrooms();
    } catch (error) {
      console.error("채팅방 참여 실패:", error);
      throw error;
    }
  };

  // 채팅방 나가기
  const leaveChatroom = async (chatroomId: number) => {
    try {
      // 새로운 authApi 함수 사용
      await leaveUserChatroom(chatroomId);

      setSelectedChatroom(null);
      setMessages([]);
      if (stompClient) {
        stompClient.deactivate();
        setStompClient(null);
        setConnected(false);
      }
      await fetchChatrooms();
    } catch (error) {
      console.error("채팅방 나가기 실패:", error);
      throw error;
    }
  };

  // 구독 관리를 위한 상태 추가
  const [subscriptions, setSubscriptions] = useState<{
    [key: string]: { id: string };
  }>({});

  // STOMP 클라이언트 연결 함수 수정
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

    console.log(
      `[UserChatContext] 채팅방 ${chatroomId}에 WebSocket 연결 시작...`
    );

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

      console.log(
        `[UserChatContext] 채팅방 ${chatroomId}에 WebSocket 연결 완료`
      );

      // 신규 구독 저장용 객체
      const newSubscriptions: { [key: string]: { id: string } } = {};

      // 채팅방 메시지 구독
      const chatRoomSubscription = client.subscribe(
        `/sub/chats/${chatroomId}`,
        (message) => {
          const receivedMessage = JSON.parse(message.body);

          console.log(`채팅방 ${chatroomId} 메시지 수신:`, receivedMessage);

          // 보낸 사람 정보 설정
          let senderInfo: Partial<ChatMessageType> = {};
          let isMyMessage = false;

          // 현재 사용자 메시지인지 확인
          if (receivedMessage.userId === currentUser?.id) {
            isMyMessage = true;
            senderInfo = {
              userName: currentUser.userName,
              profileImageUrl: currentUser.profileImageUrl || undefined,
              apartmentName: currentUser.apartmentName || undefined,
              buildingName: currentUser.buildingName || undefined,
              unitNumber: currentUser.unitNumber || undefined,
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
              isMyMessage: isMyMessage,
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
      if (currentUser) {
        setMessages((prev) => [
          ...prev,
          {
            userId: 0,
            message: `${currentUser.userName}님이 입장하셨습니다.`,
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

  // 메시지 전송 함수 개선
  const sendMessage = (message: string) => {
    if (!stompClient || !connected) {
      console.error(
        "[UserChatContext] 연결이 활성화되지 않아 메시지를 보낼 수 없습니다."
      );
      return;
    }

    if (!selectedChatroom || !selectedChatroom.id) {
      console.error(
        "[UserChatContext] 선택된 채팅방이 없거나 ID가 없어 메시지를 보낼 수 없습니다."
      );
      return;
    }

    const chatroomId = selectedChatroom.id;
    console.log(`[UserChatContext] 메시지 전송 대상 채팅방 ID: ${chatroomId}`);

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      console.log("[UserChatContext] 빈 메시지는 전송하지 않습니다.");
      return;
    }

    if (!currentUser) {
      console.error(
        "[UserChatContext] 사용자 정보가 없어 메시지를 보낼 수 없습니다."
      );
      return;
    }

    const messageData = {
      message: trimmedMessage,
      userId: currentUser.id,
    };

    console.log(`[UserChatContext] 채팅방 ${chatroomId}로 메시지 전송:`, {
      message:
        trimmedMessage.substring(0, 20) +
        (trimmedMessage.length > 20 ? "..." : ""),
      userId: currentUser.id,
      destination: `/pub/chats/${chatroomId}`,
    });

    try {
      // 명시적으로 선택된 채팅방 ID 로깅 및 사용
      const destination = `/pub/chats/${chatroomId}`;

      stompClient.publish({
        destination: destination,
        body: JSON.stringify(messageData),
      });

      console.log(
        `[UserChatContext] 메시지가 ${destination}로 성공적으로 전송됨`
      );
    } catch (error) {
      console.error(
        `[UserChatContext] 채팅방 ${chatroomId}로 메시지 전송 중 오류 발생:`,
        error
      );
    }
  };

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
    console.log("사용자 이름 찾기 시도:", {
      availableFields: Object.keys(message).filter(
        (key) => possibleNameFields.includes(key) && message[key]
      ),
    });

    // 먼저 직접 userName 확인
    if (message.userName && message.userName.trim() !== "") {
      console.log("userName 필드 사용:", message.userName);
      return message.userName;
    }

    // 다른 가능한 필드들 확인
    for (const field of possibleNameFields) {
      if (message[field] && message[field].trim() !== "") {
        console.log(`대체 필드 사용 (${field}):`, message[field]);
        return message[field];
      }
    }

    // 기본값 반환
    console.log("사용자 이름 필드를 찾을 수 없어 기본값 사용");
    return "사용자";
  };

  // 채팅방 선택 함수 수정
  const selectChatroom = async (chatroom: ChatroomType) => {
    // 이미 선택된 채팅방인 경우 무시
    if (selectedChatroom?.id === chatroom.id) {
      console.log(
        `[UserChatContext] 이미 선택된 채팅방 ${chatroom.id} 입니다.`
      );
      return;
    }

    console.log(
      `[UserChatContext] 채팅방 선택: 이전=${selectedChatroom?.id}, 새로운=${chatroom.id}`
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
      const isAlreadyJoined = chatrooms.some((room) => room.id === chatroom.id);

      if (!isAlreadyJoined) {
        // 아직 참여하지 않은 경우에만 조인 요청
        await joinChatroom(chatroom.id);
      } else {
        // 이미 참여 중인 경우에는 메시지만 가져옴
        try {
          const apiResponse = await getUserChatroom(chatroom.id);

          // API 응답 로깅
          console.log("[UserChatContext] getUserChatroom 응답:", apiResponse);

          // API 응답이 data 필드를 포함한 객체인지 확인
          let apiChatroom: any = apiResponse;
          if (
            apiResponse &&
            typeof apiResponse === "object" &&
            "data" in apiResponse
          ) {
            apiChatroom = apiResponse.data;
          }

          if (apiChatroom && apiChatroom.id) {
            // 기존 채팅방 제목 우선 유지 (API에서 제목이 누락된 경우)
            const existingTitle = chatroom.title;

            // API에서 받은 채팅방 정보에도 title이 없으면 기본값 설정
            const updatedChatroom = {
              ...apiChatroom,
              title:
                apiChatroom.title ||
                existingTitle ||
                (apiChatroom.id ? `채팅방 #${apiChatroom.id}` : "채팅방"),
            };

            console.log("[UserChatContext] 채팅방 정보 업데이트:", {
              id: apiChatroom.id,
              originalTitle: existingTitle,
              apiTitle: apiChatroom.title,
              finalTitle: updatedChatroom.title,
            });

            setSelectedChatroom(updatedChatroom);
          }
        } catch (error) {
          console.error("[UserChatContext] 채팅방 정보 가져오기 실패:", error);
        }

        // 메시지 목록 가져오기
        try {
          const messages = await getUserChatMessages(chatroom.id);
          const formattedMessages = messages.map((msg: any) => ({
            ...msg,
            isMyMessage: msg.userId === currentUser?.id,
          }));
          setMessages(formattedMessages);
        } catch (error) {
          console.error("[UserChatContext] 메시지 목록 가져오기 실패:", error);
        }

        // 웹소켓 연결 설정
        connectStomp(chatroom.id);
      }
    } catch (error) {
      console.error("[UserChatContext] 채팅방 선택 중 오류 발생:", error);
    }
  };

  // 연결 해제
  const disconnect = () => {
    if (stompClient) {
      stompClient.deactivate();
      setStompClient(null); // stompClient 상태 초기화
      setConnected(false);
      // setSelectedChatroom(null); // 선택된 채팅방은 유지할 수도 있음 (다시 돌아올 경우 대비)
      // setMessages([]); // 메시지도 유지할 수 있음
      console.log("사용자에 의한 WebSocket 연결 해제 실행");
    }
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (stompClient) {
        console.log("UserChatContext 언마운트, STOMP 연결 해제");
        stompClient.deactivate();
        setStompClient(null);
        setConnected(false);
      }
    };
  }, [stompClient]);

  const value = {
    chatrooms,
    selectedChatroom,
    messages,
    connecting,
    connected,
    createChatroom, // 사용자에게 이 기능이 필요한지 검토
    joinChatroom, // 사용자에게 이 기능이 필요한지 검토
    leaveChatroom, // 사용자에게 이 기능이 필요한지 검토
    sendMessage,
    selectChatroom,
    disconnect,
  };

  // 변경: ChatContext.Provider -> UserChatContext.Provider
  return (
    <UserChatContext.Provider value={value}>
      {children}
    </UserChatContext.Provider>
  );
}
