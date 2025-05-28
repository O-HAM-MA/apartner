import { get, patch } from "./api";
import {
  UserDetail,
  UserListResponse,
  StatusUpdateRequest,
  RoleUpdateRequest,
  UserLogResponse,
  UserStatus,
} from "@/types/user";

// Status 열거형 값을 백엔드 Status 열거형 이름으로 변환하는 매핑
const userStatusToBackendStatus = (status: UserStatus): string => {
  switch (status) {
    case UserStatus.ACTIVE:
      return "ACTIVE";
    case UserStatus.INACTIVE:
      return "INACTIVE";
    case UserStatus.PENDING:
      return "PENDING";
    case UserStatus.WITHDRAWN:
      return "WITHDRAWN";
    case UserStatus.SUSPENDED:
      return "SUSPENDED";
    case UserStatus.DELETED:
      return "DELETED";
    default:
      return status;
  }
};

/**
 * 관리자용 사용자 목록 조회 (역할, 상태 필터링 제거)
 * searchField 파라미터 추가: 특정 필드 검색 지정 가능
 */
export const getAdminUserList = async (
  searchTerm?: string,
  searchField?: string,
  role?: string,
  status?: UserStatus,
  page: number = 0,
  size: number = 20,
  sort: string = "lastLoginAt,desc"
): Promise<UserListResponse> => {
  const queryParams = new URLSearchParams();

  // 검색어와 검색 필드에 따라 적절한 파라미터 설정
  if (searchTerm) {
    if (searchField === "userName") {
      queryParams.append("userName", searchTerm);
    } else if (searchField === "email") {
      queryParams.append("email", searchTerm);
    } else if (searchField === "apartmentName") {
      queryParams.append("apartmentName", searchTerm);
    } else {
      // 통합 검색의 경우 searchTerm 파라미터 사용
      queryParams.append("searchTerm", searchTerm);
    }
  }

  // role과 status 파라미터 추가
  if (role) {
    queryParams.append("role", role);
  }
  if (status) {
    queryParams.append("status", userStatusToBackendStatus(status));
  }

  queryParams.append("page", page.toString());
  queryParams.append("size", size.toString());
  queryParams.append("sort", sort);

  console.log("API 요청 파라미터:", queryParams.toString());

  const response = await get<any>(
    `/api/v1/admin/users?${queryParams.toString()}`,
    {},
    false
  );

  return response.data;
};

/**
 * 관리자용 사용자 상세 정보 조회
 */
export const getAdminUserDetail = async (
  userId: number
): Promise<UserDetail> => {
  const response = await get<any>(`/api/v1/admin/users/${userId}`, {}, false);
  return response.data;
};

/**
 * 관리자용 사용자 상태 업데이트
 */
export const updateUserStatus = async (
  userId: number,
  request: StatusUpdateRequest
): Promise<void> => {
  // 백엔드에 보내기 전에 status 값을 변환
  const convertedRequest = {
    status: userStatusToBackendStatus(request.status),
  };
  await patch<any>(
    `/api/v1/admin/users/${userId}/status`,
    convertedRequest,
    {},
    false
  );
};

/**
 * 관리자용 사용자 역할 업데이트
 */
export const updateUserRoles = async (
  userId: number,
  request: RoleUpdateRequest
): Promise<void> => {
  await patch<any>(`/api/v1/admin/users/${userId}/roles`, request, {}, false);
};

/**
 * 관리자용 사용자 로그 조회
 */
export const getUserLogs = async (
  userId: number,
  logType?: string,
  page: number = 0,
  size: number = 20
): Promise<UserLogResponse> => {
  const queryParams = new URLSearchParams();

  if (logType) {
    queryParams.append("logType", logType);
  }

  queryParams.append("page", page.toString());
  queryParams.append("size", size.toString());

  const response = await get<any>(
    `/api/v1/admin/users/${userId}/logs?${queryParams.toString()}`,
    {},
    false
  );

  return response.data;
};

/**
 * 사용자 목록 CSV/Excel 내보내기
 * @returns 다운로드 URL
 */
export const exportUsers = (
  searchTerm?: string,
  searchField?: string,
  role?: string,
  status?: UserStatus,
  format: "csv" | "excel" = "csv"
): string => {
  const queryParams = new URLSearchParams();

  if (searchTerm) {
    // searchField에 따라 다른 파라미터 사용
    if (searchField === "userName") {
      queryParams.append("userName", searchTerm);
    } else if (searchField === "email") {
      queryParams.append("email", searchTerm);
    } else if (searchField === "apartmentName") {
      queryParams.append("apartmentName", searchTerm);
    } else {
      // all 또는 기타 경우, 통합 검색어로 처리
      queryParams.append("searchTerm", searchTerm);
    }
  }

  // role과 status 파라미터 추가
  if (role) {
    queryParams.append("role", role);
  }
  if (status) {
    queryParams.append("status", userStatusToBackendStatus(status));
  }

  queryParams.append("format", format);

  return `${
    process.env.NEXT_PUBLIC_API_BASE_URL
  }/api/v1/admin/users/export?${queryParams.toString()}`;
};
