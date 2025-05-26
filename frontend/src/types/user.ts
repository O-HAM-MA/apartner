export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  PENDING = "pending",
  WITHDRAWN = "withdrawn",
}

export const UserStatusDisplay: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: "활성",
  [UserStatus.INACTIVE]: "비활성",
  [UserStatus.PENDING]: "정지",
  [UserStatus.WITHDRAWN]: "탈퇴",
};

export enum LogType {
  LOGIN = "LOGIN",
  LOGIN_FAILED = "LOGIN_FAILED",
  LOGOUT = "LOGOUT",
  STATUS_CHANGE = "STATUS_CHANGE",
  ROLE_CHANGE = "ROLE_CHANGE",
  PASSWORD_CHANGE = "PASSWORD_CHANGE",
}

export interface UserListItem {
  id: number;
  userName: string;
  email: string;
  phoneNum: string;
  socialProvider: string | null;
  apartmentName: string | null;
  buildingName: string | null;
  unitNumber: string | null;
  roles: string[];
  status: UserStatus;
  deletedAt: string | null;
  lastLoginAt: string | null;
}

export interface UserDetail {
  id: number;
  userName: string;
  email: string;
  phoneNum: string;
  socialProvider: string | null;
  socialId: string | null;
  apartmentId: number | null;
  apartmentName: string | null;
  buildingId: number | null;
  buildingNumber: string | null;
  unitId: number | null;
  unitNumber: string | null;
  roles: string[];
  status: UserStatus;
  leaveReason: string | null;
  createdAt: string;
  modifiedAt: string;
  lastLoginAt: string | null;
  deletedAt: string | null;
  profileImageUrl: string | null;
}

export interface UserLog {
  id: number;
  userId: number;
  userName: string;
  logType: LogType;
  description: string;
  createdAt: string;
  ipAddress: string;
  details: string;
}

export interface UserListResponse {
  content: UserListItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface UserLogResponse {
  content: UserLog[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface StatusUpdateRequest {
  status: UserStatus;
}

export interface RoleUpdateRequest {
  roles: string[];
}
