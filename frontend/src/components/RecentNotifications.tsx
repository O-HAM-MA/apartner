"use client";
import { useNotifications } from "@/contexts/notification-context";
import NotificationItem from "@/components/notification-item";

export default function RecentNotifications() {
  const { notifications, isLoading } = useNotifications();
  const recentNotifications = notifications
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 3);

  if (isLoading)
    return <div className="text-gray-500 text-sm">알림을 불러오는 중...</div>;
  if (recentNotifications.length === 0)
    return <div className="text-gray-500 text-sm">새로운 알림이 없습니다</div>;

  return (
    <>
      {recentNotifications.map((notification, index) => (
        <NotificationItem
          key={notification.id || index}
          title={notification.title}
          details={notification.message}
          time={notification.time.toLocaleString("ko-KR", { hour12: false })}
        />
      ))}
    </>
  );
}
