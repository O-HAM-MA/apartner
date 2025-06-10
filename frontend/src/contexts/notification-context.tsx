"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useGlobalLoginMember } from "@/auth/loginMember";
import { useGlobalAdminMember } from "@/auth/adminMember";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/utils/api";

// 알림 타입 정의
export type NotificationType = "info" | "success" | "warning" | "error";

// 알림 인터페이스 정의
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  time: Date;
  read: boolean;
  linkUrl?: string; // 클릭 시 이동할 URL (선택적)
  entityId?: number; // 관련 엔티티 ID (민원, 공지사항 등의 ID)
  extra?: any; // 추가 데이터
}

// 컨텍스트에서 제공할 값 타입 정의
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  removeNotification: (id: number) => void;
  addNotification: (notification: Partial<Notification>) => void;
  refreshNotifications: () => Promise<void>;
}

// 기본값으로 컨텍스트 생성
const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  isLoading: false,
  markAsRead: () => {},
  markAllAsRead: () => {},
  removeNotification: () => {},
  addNotification: () => {},
  refreshNotifications: async () => {},
});

// SSE 연결 URL
const SSE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/sse/connect`;

// 컨텍스트 제공자 컴포넌트
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const { loginMember } = useGlobalLoginMember();
  const { adminMember } = useGlobalAdminMember();

  // 현재 로그인한 사용자 정보
  const currentUser = loginMember.id ? loginMember : adminMember;

  // DB에서 알림 목록 조회
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getUserNotifications();

      if (response && response.success && Array.isArray(response.data)) {
        // API 응답을 알림 형식으로 변환
        const fetchedNotifications: Notification[] = response.data.map(
          (item: any) => {
            // linkUrl 검증 및 정규화
            let normalizedLinkUrl = item.linkUrl;
            if (normalizedLinkUrl) {
              normalizedLinkUrl = normalizedLinkUrl.trim();
            }

            // 변환된 알림 객체 생성
            const notification = {
              id: item.id,
              title: item.title || item.type,
              message: item.message,
              type: (item.type || "info") as NotificationType,
              time: new Date(item.createdAt || Date.now()),
              read: item.isRead || false,
              linkUrl: normalizedLinkUrl,
              entityId: item.entityId,
              extra: item.extra,
            };

            return notification;
          }
        );

        // 변환된 알림을 상태로 저장
        setNotifications(fetchedNotifications);

        // 읽지 않은 알림 수 계산
        const unreadNotifications = fetchedNotifications.filter((n) => !n.read);
        setUnreadCount(unreadNotifications.length);
      } else {
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 알림 읽음 처리
  const markAsRead = useCallback(
    async (id: number) => {
      try {
        // 현재 알림 객체 로깅
        const targetNotification = notifications.find((n) => n.id === id);

        // API 직접 호출 (await 제거)
        const apiPromise = markNotificationAsRead(id);

        // 즉시 UI 상태 업데이트 (사용자 경험 향상)
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // API 응답 기다림
        const result = await apiPromise;

        return true;
      } catch (error) {
        return false;
      }
    },
    [notifications]
  );

  // 모든 알림 읽음 처리
  const markAllAsRead = useCallback(async () => {
    try {
      // API 직접 호출 (await 제거)
      const apiPromise = markAllNotificationsAsRead();

      // 즉시 UI 상태 업데이트 (사용자 경험 향상)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);

      // API 응답 기다림
      const result = await apiPromise;

      return true;
    } catch (error) {
      return false;
    }
  }, []);

  // 알림 삭제 - 서버와 동기화 추가
  const removeNotification = useCallback(
    async (id: number) => {
      // 먼저 UI에서 삭제 처리
      setNotifications((prev) => {
        const notification = prev.find((n) => n.id === id);
        if (notification && !notification.read) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return prev.filter((n) => n.id !== id);
      });

      try {
        // 아직 읽지 않은 알림이면 먼저 읽음 처리
        const notification = notifications.find((n) => n.id === id);
        if (notification && !notification.read) {
          await markNotificationAsRead(id);
        }

        // 여기에 실제 API 호출 추가 (백엔드에 해당 기능이 있다면)
        // await deleteNotification(id);

        return true;
      } catch (error) {
        // 에러가 발생해도 UI에서는 이미 삭제됨
        return false;
      }
    },
    [notifications]
  );

  // 알림 추가 (실시간 SSE에서 수신)
  const addNotification = useCallback((notification: Partial<Notification>) => {
    const newNotification: Notification = {
      id: notification.id || Date.now(), // 임시 ID
      title: notification.title || "알림",
      message: notification.message || "",
      type: notification.type || "info",
      time: new Date(),
      read: false,
      linkUrl: notification.linkUrl,
      entityId: notification.entityId,
      extra: notification.extra,
    };

    setNotifications((prev) => [newNotification, ...prev]);
    setUnreadCount((prev) => prev + 1);

    // 브라우저 알림 표시 (권한 있는 경우)
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      const browserNotification = new Notification(newNotification.title, {
        body: newNotification.message,
        icon: "/logo.png", // 로고 경로 설정
      });

      // 알림 클릭시 linkUrl이 있으면 해당 페이지로 이동
      if (newNotification.linkUrl) {
        browserNotification.onclick = () => {
          window.focus();
          window.location.href = newNotification.linkUrl || "";
        };
      }
    }
  }, []);

  // 알림 목록 새로고침
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // SSE 연결 설정
  useEffect(() => {
    if (!currentUser) {
      setIsConnected(false);
      return;
    }

    // userId가 0이거나 undefined면 SSE 연결 시도하지 않음
    if (!currentUser.id || currentUser.id === 0) {
      setIsConnected(false);
      return;
    }

    // SSE 연결 전에 알림 목록 로드 (1회만 호출)
    fetchNotifications();

    // 브라우저 알림 권한 요청
    if (
      typeof Notification !== "undefined" &&
      Notification.permission !== "granted" &&
      Notification.permission !== "denied"
    ) {
      Notification.requestPermission();
    }

    // 기존 연결 정리
    if (eventSource) {
      eventSource.close();
    }

    try {
      // 캐시 방지를 위한 타임스탬프 추가
      const url = new URL(`${SSE_URL}?userId=${currentUser.id}`);
      url.searchParams.append("_", Date.now().toString());

      // EventSource 객체 생성 (withCredentials 옵션 추가)
      // const eventSourceInit = { withCredentials: true };
      // const newEventSource = new EventSource(url.toString(), eventSourceInit);

      const newEventSource = new EventSource(url.toString());
      setEventSource(newEventSource);

      // 연결 성공 이벤트
      newEventSource.addEventListener("connect", (event) => {
        setIsConnected(true);
        console.log("SSE 연결 성공:", event);
      });

      // 알림 이벤트
      newEventSource.addEventListener("alarm", (event) => {
        try {
          const data = JSON.parse(event.data);

          // 알림이 내 아파트 관련인지 확인
          const isRelevant =
            !data.apartmentName ||
            data.apartmentName === currentUser.apartmentName ||
            data.userId === currentUser.id;

          if (isRelevant) {
            addNotification({
              title: data.title || data.type,
              message: data.message,
              type: data.type || "info",
              linkUrl: data.linkUrl,
              entityId: data.entityId,
              extra: data.extra,
            });
          }
        } catch (error) {
          console.error("SSE 이벤트 처리 오류:", error);
        }
      });

      // 에러 처리
      newEventSource.onerror = (error) => {
        console.error("SSE 연결 오류:", error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error("SSE 설정 오류:", error);
      setIsConnected(false);
    }

    // 컴포넌트 언마운트 시 연결 정리
    return () => {
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
        setIsConnected(false);
      }
    };
  }, [
    addNotification,
    fetchNotifications,
    currentUser?.id,
    currentUser?.apartmentName,
  ]);

  // 온라인 상태 모니터링 (window 이벤트)
  useEffect(() => {
    const handleOnline = () => {
      // 연결이 끊어진 상태라면 재연결 시도
      if (eventSource && eventSource.readyState === EventSource.CLOSED) {
        setEventSource(null); // 재연결을 위해 null 설정
      }
    };

    const handleOffline = () => {
      setIsConnected(false);
    };

    // 윈도우 이벤트 리스너 등록
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [eventSource]);

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    addNotification,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// 사용 Hook
export const useNotifications = () => useContext(NotificationContext);
