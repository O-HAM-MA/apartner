export interface ChatroomType {
  id: number;
  title: string;
  hasNewMessage: boolean;
  userCount: number;
  createdAt: string;
  status?: "ACTIVE" | "INACTIVE";
  categoryCode?: string;
  categoryName?: string;
  apartmentId?: number;
  apartmentName?: string;
  lastMessageTime?: string;
  assignedAdmin?: {
    id: number;
    userName: string;
    profileImageUrl?: string;
  };
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
  clientId?: string;
  isPreview?: boolean;
  clientTimestamp?: number;
}

export interface ChatFilter {
  status?: "ACTIVE" | "INACTIVE" | "ALL";
  apartmentId?: number;
  categoryCode?: string;
  searchTerm?: string;
  sortBy?: "lastMessageTime" | "createdAt";
  sortOrder?: "asc" | "desc";
}
