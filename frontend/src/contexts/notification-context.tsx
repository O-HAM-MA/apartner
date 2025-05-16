"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"

export type NotificationType = "info" | "success" | "warning" | "error"

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  time: Date
  read: boolean
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (title: string, message: string, type?: NotificationType) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Sample notifications
const sampleNotifications: Notification[] = [
  {
    id: uuidv4(),
    title: "공지사항",
    message: "이번 주 토요일 오전 10시부터 단지 내 소방 점검이 있을 예정입니다.",
    type: "info",
    time: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    read: false,
  },
  {
    id: uuidv4(),
    title: "시설 예약 확인",
    message: "커뮤니티 센터 예약이 확정되었습니다. 5월 15일 오후 2시.",
    type: "success",
    time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: true,
  },
  {
    id: uuidv4(),
    title: "민원 접수 완료",
    message: "접수하신 엘리베이터 고장 민원이 처리되었습니다.",
    type: "success",
    time: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
  },
]

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications)
  const [unreadCount, setUnreadCount] = useState<number>(0)

  // Update unread count whenever notifications change
  useEffect(() => {
    const count = notifications.filter((notification) => !notification.read).length
    setUnreadCount(count)
  }, [notifications])

  // Demo: Add a random notification every 30 seconds
  useEffect(() => {
    const demoNotifications = [
      {
        title: "주차장 알림",
        message: "방문자 주차 공간이 부족합니다. 가능한 경우 지정 주차 공간을 이용해 주세요.",
        type: "warning" as NotificationType,
      },
      {
        title: "관리비 납부 안내",
        message: "이번 달 관리비 납부 기한이 3일 남았습니다.",
        type: "info" as NotificationType,
      },
      {
        title: "택배 도착",
        message: "택배가 관리실에 도착했습니다. 편하실 때 찾아가세요.",
        type: "info" as NotificationType,
      },
      {
        title: "단지 내 소독 안내",
        message: "내일 오전 10시부터 12시까지 단지 내 소독이 진행됩니다.",
        type: "warning" as NotificationType,
      },
      {
        title: "커뮤니티 센터 운영 시간 변경",
        message: "이번 주 금요일부터 커뮤니티 센터 운영 시간이 변경됩니다.",
        type: "info" as NotificationType,
      },
    ]

    const interval = setInterval(() => {
      if (Math.random() > 0.5) {
        const randomNotification = demoNotifications[Math.floor(Math.random() * demoNotifications.length)]
        addNotification(randomNotification.title, randomNotification.message, randomNotification.type)
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  const addNotification = (title: string, message: string, type: NotificationType = "info") => {
    const newNotification: Notification = {
      id: uuidv4(),
      title,
      message,
      type,
      time: new Date(),
      read: false,
    }

    setNotifications((prev) => [newNotification, ...prev])
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
