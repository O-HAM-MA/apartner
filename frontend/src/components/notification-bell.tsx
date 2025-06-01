"use client";

import React, { useState, useRef, useEffect } from "react";
import { BellRing, X, ExternalLink } from "lucide-react";
import {
  useNotifications,
  NotificationType,
} from "@/contexts/notification-context";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteReadNotifications,
} from "@/utils/api";

// 알림 타입별 스타일 정의
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

const NotificationBell = () => {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    isConnected,
    refreshNotifications,
    isLoading,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const portalDropdownRef = useRef<HTMLDivElement>(null);
  const [isProcessingNotification, setIsProcessingNotification] =
    useState(false);

  useEffect(() => {
    if (isOpen && bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left: rect.left,
        zIndex: 9999,
        width: 320, // w-80
      });
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // 디버깅 로그 제거
      // 알림 처리 중이면 이벤트 무시
      if (isProcessingNotification) {
        return;
      }
      const isClickInsidePortalDropdown =
        portalDropdownRef.current &&
        portalDropdownRef.current.contains(event.target as Node);
      if (
        (!dropdownRef.current ||
          !dropdownRef.current.contains(event.target as Node)) &&
        !isClickInsidePortalDropdown &&
        bellRef.current !== event.target &&
        !bellRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mouseup", handleClickOutside);
    return () => {
      document.removeEventListener("mouseup", handleClickOutside);
    };
  }, [isProcessingNotification]);

  // 알림 목록 열기/닫기
  const toggleNotifications = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      // 알림 목록을 열 때 모든 알림을 읽음으로 표시
      markAllAsRead();
    }
  };

  // 상대적 시간 포맷팅 (예: "3분 전")
  const formatTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: ko });
  };

  // 알림 항목 클릭 핸들러
  const handleNotificationClick = async (
    e: React.MouseEvent,
    notification: any
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsProcessingNotification(true);
    try {
      if (notification.id) {
        try {
          markAsRead(notification.id);
        } catch (error) {}
      }
      if (
        notification.linkUrl &&
        typeof notification.linkUrl === "string" &&
        notification.linkUrl.trim() !== ""
      ) {
        try {
          const url = notification.linkUrl.trim();
          setIsOpen(false);
          setTimeout(() => {
            setIsProcessingNotification(false);
            if (url.startsWith("/")) {
              window.location.href = url;
            } else {
              window.location.href = url;
            }
          }, 50);
        } catch (error) {
          setIsProcessingNotification(false);
          if (notification.linkUrl) {
            window.location.href = notification.linkUrl;
          }
        }
      } else {
        setIsProcessingNotification(false);
      }
    } catch (err) {
      setIsProcessingNotification(false);
    }
  };

  // 알림 모두 읽음 처리
  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    // 이벤트 전파 방지
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      console.log("[알림] 전체 읽음 처리 시작");

      // 컨텍스트의 markAllAsRead 호출
      await markAllAsRead();

      // 성공 시 알림 목록 새로고침
      await refreshNotifications();
      console.log("[알림] 전체 읽음 처리 완료 및 목록 갱신됨");
    } catch (error) {
      console.error("[알림] 전체 읽음 처리 중 오류:", error);
    }
  };

  // 읽은 알림 삭제 처리
  const handleDeleteReadNotifications = async (
    days = 7,
    e?: React.MouseEvent
  ) => {
    // 이벤트 전파 방지
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      console.log(`[알림] ${days}일 이전 읽은 알림 삭제 시작`);

      // API 호출
      await deleteReadNotifications(days);

      // 성공 시 알림 목록 새로고침
      await refreshNotifications();
      console.log("[알림] 읽은 알림 삭제 완료 및 목록 갱신됨");
    } catch (error) {
      console.error(`[알림] ${days}일 이전 읽은 알림 삭제 중 오류:`, error);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* 알림 벨 아이콘 */}
      <button
        ref={bellRef}
        onClick={toggleNotifications}
        className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-200"
        aria-label={`알림 ${unreadCount}개`}
      >
        <BellRing size={22} className="text-gray-600 dark:text-gray-300" />

        {/* 알림 상태 표시 */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-pink-500 ring-2 ring-white dark:ring-gray-900 text-[10px] text-white font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}

        {/* SSE 연결 상태 표시 */}
        {/* {isConnected && (
          <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-500 ring-1 ring-white dark:ring-gray-900"></span>
        )} */}
      </button>

      {/* 알림 드롭다운 (Portal) */}
      {isOpen &&
        createPortal(
          <div
            ref={portalDropdownRef}
            style={{
              ...dropdownStyle,
              pointerEvents: "auto",
              position: "fixed",
              zIndex: 9999,
            }}
            className="max-h-[70vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5"
            onClick={(e) => {
              // 드롭다운 내부 클릭 시 버블링 방지
              e.stopPropagation();
            }}
          >
            {/* 알림 헤더 */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                알림
              </h3>
              <div className="flex items-center space-x-2">
                {/* 새로고침 버튼 추가 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    refreshNotifications && refreshNotifications();
                  }}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  aria-label="알림 새로고침"
                  title="새로고침"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`${isLoading ? "animate-spin" : ""}`}
                  >
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                    <path d="M3 3v5h5"></path>
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                    <path d="M16 21h5v-5"></path>
                  </svg>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  aria-label="알림 닫기"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* 알림 목록 */}
            <div className="py-1">
              {isLoading ? (
                <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                  알림을 불러오는 중...
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                  알림이 없습니다
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700/50 last:border-0",
                      notification.read
                        ? "opacity-75"
                        : "bg-gray-50 dark:bg-gray-700/30",
                      notificationStyles[notification.type].bg,
                      notification.linkUrl ? "cursor-pointer" : ""
                    )}
                    onClick={(e) => {
                      console.log("[알림] 항목 클릭 이벤트 발생");
                      // 삭제 버튼 클릭 시 이벤트 처리 방지
                      if (
                        (e.target as HTMLElement).closest(
                          ".notification-delete-btn"
                        )
                      ) {
                        return;
                      }
                      handleNotificationClick(e, notification);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleNotificationClick(
                          e as unknown as React.MouseEvent,
                          notification
                        );
                      }
                    }}
                    style={{ pointerEvents: "auto" }}
                  >
                    <div className="flex justify-between">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
                        {notification.title}
                        {notification.linkUrl && (
                          <ExternalLink
                            size={12}
                            className="ml-1 text-gray-500"
                          />
                        )}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // 클릭 이벤트 전파 방지
                          removeNotification(notification.id);
                        }}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 notification-delete-btn"
                        aria-label="알림 삭제"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {notification.message}
                    </p>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
                      <span>{formatTimeAgo(notification.time)}</span>
                      {/* {notification.entityId && (
                        <span className="text-xs text-gray-400">
                          ID: {notification.entityId}
                        </span>
                      )} */}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 알림 푸터 */}
            {notifications.length > 0 && (
              <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-center">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleMarkAllAsRead(e)}
                    className="text-xs hover:bg-secondary"
                  >
                    모두 읽음
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteReadNotifications(7, e)}
                    className="text-xs hover:bg-secondary"
                  >
                    읽은 알림 삭제
                  </Button>
                </div>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};

export default NotificationBell;

function getCurrentUserId() {
  // loginMember 또는 adminMember에서 ID 가져오기
  try {
    const loginMember = JSON.parse(localStorage.getItem("loginMember") || "{}");
    const adminMember = JSON.parse(localStorage.getItem("adminMember") || "{}");
    return loginMember.id || adminMember.id;
  } catch {
    return undefined;
  }
}
