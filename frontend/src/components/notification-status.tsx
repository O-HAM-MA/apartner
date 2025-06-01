// src/components/notification-status.tsx
"use client";

import { useEffect } from "react";
import { useNotifications } from "@/contexts/notification-context";
import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationStatusProps {
  className?: string;
}

export default function NotificationStatus({
  className = "",
}: NotificationStatusProps) {
  const { unreadCount, isConnected, refreshNotifications } = useNotifications();

  useEffect(() => {
    if (isConnected) {
    } else {
    }
  }, [isConnected, unreadCount]);

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      {/* 연결 상태 텍스트 및 아이콘 완전 제거 */}
      {unreadCount > 0 && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-1.5 py-0.5 rounded-full">
          {unreadCount}
        </div>
      )}
    </div>
  );
}
