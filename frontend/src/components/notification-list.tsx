// src/components/notification-list.tsx
"use client";

import React from "react";
import {
  useNotifications,
  NotificationType,
} from "@/contexts/notification-context";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Bell, Check, Trash2, ExternalLink } from "lucide-react";

// 알림 타입별 스타일
const notificationStyles: Record<
  NotificationType,
  { bg: string; icon: string }
> = {
  info: { bg: "bg-blue-50 dark:bg-blue-900/20", icon: "text-blue-500" },
  success: { bg: "bg-green-50 dark:bg-green-900/20", icon: "text-green-500" },
  warning: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    icon: "text-orange-500",
  },
  error: { bg: "bg-red-50 dark:bg-red-900/20", icon: "text-red-500" },
};

interface NotificationListProps {
  maxItems?: number;
  apartmentId?: number | null;
}

const NotificationList: React.FC<NotificationListProps> = ({
  maxItems = 5,
  apartmentId = null,
}) => {
  const router = useRouter();
  const {
    notifications,
    markAsRead,
    removeNotification,
    refreshNotifications,
    isLoading,
  } = useNotifications();

  // 아파트 ID로 필터링
  const filteredNotifications = apartmentId
    ? notifications.filter(
        (note) =>
          !note.extra?.apartmentId || note.extra?.apartmentId === apartmentId
      )
    : notifications;

  // 최대 표시 개수로 제한
  const displayNotifications = filteredNotifications.slice(0, maxItems);

  // 상대적 시간 포맷팅
  const formatTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: ko });
  };

  // 알림 클릭 핸들러
  const handleNotificationClick = (e: React.MouseEvent, notification: any) => {
    // 로그 개선
    console.log("[알림 목록] 클릭 이벤트 시작:", {
      id: notification.id,
      title: notification.title,
      target: e.target,
      currentTarget: e.currentTarget,
    });

    // 이벤트 전파 방지 및 기본 동작 방지
    e.preventDefault();
    e.stopPropagation();

    console.log("[알림 목록] 알림 데이터:", notification);
    console.log("[알림 목록] 이동 URL:", notification.linkUrl);

    // 읽음 표시
    if (notification.id) {
      try {
        console.log("[알림 목록] 읽음 처리 시작: ID =", notification.id);
        // 비동기 처리이지만 UI 업데이트는 즉시 일어나므로 await 없이 호출
        markAsRead(notification.id);
      } catch (error) {
        console.error("[알림 목록] 읽음 처리 중 오류:", error);
      }
    } else {
      console.warn("[알림 목록] 읽음 처리 실패: 유효한 ID가 없음");
    }

    // 링크가 있으면 해당 페이지로 이동
    if (
      notification.linkUrl &&
      typeof notification.linkUrl === "string" &&
      notification.linkUrl.trim() !== ""
    ) {
      try {
        const url = notification.linkUrl.trim();
        console.log("[알림 목록] 링크 이동 시도:", url);

        // 약간의 지연 후 페이지 이동 (읽음 처리가 먼저 완료되도록)
        setTimeout(() => {
          console.log("[알림 목록] 페이지 이동 실행");

          // 내부 링크인지 확인 ('/'로 시작하면 내부 링크로 간주)
          if (url.startsWith("/")) {
            // 내부 링크는 페이지 이동
            console.log("[알림 목록] 내부 링크로 이동:", url);
            window.location.href = url;
          } else {
            // 외부 링크는 window.location 사용
            console.log("[알림 목록] 외부 링크로 이동:", url);
            window.location.href = url;
          }
        }, 150); // 더 긴 지연 시간 설정
      } catch (error) {
        console.error("[알림 목록] 링크 이동 중 오류 발생:", error);
        // 실패 시 window.location으로 대체 시도
        if (notification.linkUrl) {
          window.location.href = notification.linkUrl;
        }
      }
    } else {
      console.log("[알림 목록] 이동할 링크 없음");
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        알림을 불러오는 중...
      </div>
    );
  }

  if (displayNotifications.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <Bell className="mx-auto h-5 w-5 mb-1 opacity-50" />
        새로운 알림이 없습니다
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-sm font-medium">최근 알림</h3>
        <button
          onClick={(e) => {
            e.preventDefault();
            refreshNotifications();
          }}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          새로고침
        </button>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {displayNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 group transition-colors ${
              notification.read
                ? "opacity-75"
                : `${notificationStyles[notification.type].bg} font-medium`
            }`}
            style={{ position: "relative", zIndex: 1 }}
          >
            <div
              className={`flex cursor-pointer`}
              onClick={(e) => {
                console.log("[알림 목록] 항목 클릭 이벤트 발생");
                handleNotificationClick(e, notification);
              }}
              style={{ pointerEvents: "auto" }}
            >
              <div className="flex-grow min-w-0">
                <p className="text-sm truncate flex items-center">
                  {notification.title}
                  {notification.linkUrl && (
                    <ExternalLink size={12} className="ml-1 text-gray-500" />
                  )}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {formatTimeAgo(notification.time)}
                </p>
              </div>

              <div className="flex items-start ml-2 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!notification.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                    className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    title="읽음으로 표시"
                  >
                    <Check size={14} />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(notification.id);
                  }}
                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  title="알림 삭제"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredNotifications.length > maxItems && (
        <div className="p-2 text-center">
          <button
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            onClick={() => {
              // 전체 알림 보기 팝업 or 페이지 이동
              // 여기서는 NotificationBell 클릭으로 전체 알림 볼 수 있게 함
            }}
          >
            모든 알림 보기 ({filteredNotifications.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationList;
