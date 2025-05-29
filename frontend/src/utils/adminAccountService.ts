import { get, post, put, patch, del } from './api';

// 관리자 계정 응답 타입 정의
export interface AdminAccount {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
  apartmentId?: number;
  apartmentName?: string;
  buildingId?: number;
  buildingNumber?: string;
  gradeId?: number;
  gradeName?: string;
  gradeLevel?: number; // 등급 레벨 필드 추가
  createdAt: string;
  lastLoginAt: string;
}

// 관리자 등급 타입 정의
export interface AdminGrade {
  id: number;
  name: string;
  level: number;
  description: string;
}

// 아파트 타입 정의
export interface Apartment {
  id: number;
  name: string;
  address: string;
}

// 건물 타입 정의
export interface AdminBuilding {
  id: number;
  apartmentId: number;
  buildingNumber: string;
}

// 계정 생성/수정 요청 타입 정의
export interface AccountRequest {
  name: string;
  email: string;
  role: string;
  password?: string;
  apartmentId?: number;
  buildingId?: number;
  gradeId?: number;
  active: boolean;
}

// 비밀번호 변경 요청 타입 정의
export interface PasswordChangeRequest {
  password: string;
  confirmPassword: string;
}

// 페이지네이션 응답 타입 정의
export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

// 역할 값을 소문자로 변환하는 함수
const convertRoleToLowerCase = (request: AccountRequest): AccountRequest => {
  return {
    ...request,
    role: request.role.toLowerCase(), // 역할 값을 소문자로 변환
  };
};

// 관리자 계정 관리 서비스
const adminAccountService = {
  // 모든 관리자 계정 조회
  getAllAccounts: async (): Promise<AdminAccount[]> => {
    return await get<AdminAccount[]>('/api/v1/admin/accounts');
  },

  // 페이지네이션을 사용한 관리자 계정 조회
  getAccountsByPage: async (
    page: number = 0, 
    size: number = 10, 
    sort: string = 'id', 
    direction: 'ASC' | 'DESC' = 'DESC'
  ): Promise<PaginatedResponse<AdminAccount>> => {
    return await get<PaginatedResponse<AdminAccount>>(
      `/api/v1/admin/accounts/page?page=${page}&size=${size}&sort=${sort}&direction=${direction}`
    );
  },

  // 관리자 계정 상세 조회
  getAccountById: async (id: number): Promise<AdminAccount> => {
    return await get<AdminAccount>(`/api/v1/admin/accounts/${id}`);
  },

  // 관리자 계정 생성
  createAccount: async (request: AccountRequest): Promise<AdminAccount> => {
    // 요청 전에 역할 값을 소문자로 변환
    const convertedRequest = convertRoleToLowerCase(request);
    return await post<AdminAccount>('/api/v1/admin/accounts', convertedRequest);
  },

  // 관리자 계정 수정
  updateAccount: async (id: number, request: AccountRequest): Promise<AdminAccount> => {
    // 요청 전에 역할 값을 소문자로 변환
    const convertedRequest = convertRoleToLowerCase(request);
    return await put<AdminAccount>(`/api/v1/admin/accounts/${id}`, convertedRequest);
  },

  // 관리자 계정 삭제
  deleteAccount: async (id: number): Promise<void> => {
    return await del<void>(`/api/v1/admin/accounts/${id}`);
  },

  // 계정 상태 변경
  changeAccountStatus: async (id: number, active: boolean): Promise<AdminAccount> => {
    return await patch<AdminAccount>(`/api/v1/admin/accounts/${id}/status`, { active });
  },

  // 비밀번호 재설정
  resetPassword: async (id: number, request: PasswordChangeRequest): Promise<void> => {
    return await put<void>(`/api/v1/admin/accounts/${id}/password`, request);
  },

  // 모든 관리자 등급 조회
  getAdminGrades: async (): Promise<AdminGrade[]> => {
    return await get<AdminGrade[]>('/api/v1/admin/accounts/grades');
  },

  // 모든 아파트 조회
  getAllApartments: async (): Promise<Apartment[]> => {
    return await get<Apartment[]>('/api/v1/admin/accounts/apartments');
  },

  // 아파트별 건물 조회
  getBuildingsByApartmentId: async (apartmentId: number): Promise<AdminBuilding[]> => {
    return await get<AdminBuilding[]>(`/api/v1/admin/accounts/apartments/${apartmentId}/buildings`);
  }
};

export default adminAccountService;