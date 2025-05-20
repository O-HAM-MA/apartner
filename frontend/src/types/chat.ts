export interface ChatroomType {
  id: number;
  title: string;
  hasNewMessage: boolean;
  userCount: number;
  createdAt: string;
}

export interface ChatMessageType {
  id?: number;
  messageId?: number;
  userId: number;
  message: string;
  timestamp?: string;
  isSystem?: boolean;
  isNew?: boolean;
  isMyMessage?: boolean;
  userName?: string;
  profileImageUrl?: string;
  apartmentName?: string;
  buildingName?: string;
  unitNumber?: string;
}
