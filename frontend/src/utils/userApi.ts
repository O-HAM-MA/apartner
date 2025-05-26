import { get, patch } from './api';
import { 
  UserDetail, 
  UserListResponse, 
  StatusUpdateRequest, 
  RoleUpdateRequest, 
  UserLogResponse,
  UserStatus
} from '@/types/user';

/**
 * 관리자용 사용자 목록 조회 (역할, 상태 필터링 추가)
 * searchField 파라미터 추가: 특정 필드 검색 지정 가능
 */
export const getAdminUserList = async (
  searchTerm?: string,
  searchField?: string,
  role?: string,
  status?: UserStatus,
  page: number = 0,
  size: number = 20,
  sort: string = 'lastLoginAt,desc'
): Promise<UserListResponse> => {
  const queryParams = new URLSearchParams();
  
  if (searchTerm) {
    // searchField에 따라 다른 파라미터 사용
    if (searchField === 'userName') {
      queryParams.append('userName', searchTerm);
    } else if (searchField === 'email') {
      queryParams.append('email', searchTerm);
    } else if (searchField === 'apartmentName') {
      queryParams.append('apartmentName', searchTerm);
    } else {
      // all 또는 기타 경우, 통합 검색어로 처리
      queryParams.append('searchTerm', searchTerm);
    }
  }
  
  if (role) {
    queryParams.append('role', role);
  }
  
  if (status) {
    queryParams.append('status', status);
  }
  
  queryParams.append('page', page.toString());
  queryParams.append('size', size.toString());
  queryParams.append('sort', sort);
  
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
export const getAdminUserDetail = async (userId: number): Promise<UserDetail> => {
  const response = await get<any>(`/api/v1/admin/users/${userId}`, {}, false);
  return response.data;
};

/**
 * 관리자용 사용자 상태 업데이트
 */
export const updateUserStatus = async (userId: number, request: StatusUpdateRequest): Promise<void> => {
  await patch<any>(`/api/v1/admin/users/${userId}/status`, request, {}, false);
};

/**
 * 관리자용 사용자 역할 업데이트
 */
export const updateUserRoles = async (userId: number, request: RoleUpdateRequest): Promise<void> => {
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
    queryParams.append('logType', logType);
  }
  
  queryParams.append('page', page.toString());
  queryParams.append('size', size.toString());
  
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
  format: 'csv' | 'excel' = 'csv'
): string => {
  const queryParams = new URLSearchParams();
  
  if (searchTerm) {
    // searchField에 따라 다른 파라미터 사용
    if (searchField === 'userName') {
      queryParams.append('userName', searchTerm);
    } else if (searchField === 'email') {
      queryParams.append('email', searchTerm);
    } else if (searchField === 'apartmentName') {
      queryParams.append('apartmentName', searchTerm);
    } else {
      // all 또는 기타 경우, 통합 검색어로 처리
      queryParams.append('searchTerm', searchTerm);
    }
  }
  
  if (role) {
    queryParams.append('role', role);
  }
  
  if (status) {
    queryParams.append('status', status);
  }
  
  queryParams.append('format', format);
  
  return `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/admin/users/export?${queryParams.toString()}`;
};