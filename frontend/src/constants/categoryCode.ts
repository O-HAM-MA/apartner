/**
 * 채팅 카테고리 코드 매핑
 * 백엔드 ChatCategory enum과 일치하도록 유지
 */

/**
 * 카테고리 코드 및 이름 매핑 관리
 */

// 카테고리 타입 (표시 이름)
export type CategoryType =
  | "민원"
  | "건의사항"
  | "수리/정비"
  | "보안/안전"
  | null;

// 카테고리 코드 타입
export type CategoryCodeType = "A01" | "A02" | "A03" | "A04" | null;

// 카테고리 정보 인터페이스
export interface CategoryInfo {
  code: CategoryCodeType;
  name: CategoryType;
  icon: string;
}

// 카테고리 코드, 이름, 아이콘 매핑 상수
export const CATEGORIES: CategoryInfo[] = [
  {
    code: "A01",
    name: "민원",
    icon: "Flag",
  },
  {
    code: "A02",
    name: "건의사항",
    icon: "MessageSquare",
  },
  {
    code: "A03",
    name: "수리/정비",
    icon: "Wrench",
  },
  {
    code: "A04",
    name: "보안/안전",
    icon: "Shield",
  },
];

/**
 * 카테고리 이름으로 카테고리 코드 찾기
 * @param name 카테고리 이름
 * @returns 카테고리 코드 (없으면 null)
 */
export function getCategoryCodeByName(name: CategoryType): CategoryCodeType {
  if (!name) return null;
  const category = CATEGORIES.find((cat) => cat.name === name);
  return category ? category.code : null;
}

/**
 * 카테고리 코드로 카테고리 이름 찾기
 * @param code 카테고리 코드
 * @returns 카테고리 이름 (없으면 null)
 */
export function getCategoryNameByCode(code: CategoryCodeType): CategoryType {
  if (!code) return null;
  const category = CATEGORIES.find((cat) => cat.code === code);
  return category ? category.name : null;
}

/**
 * 카테고리 코드로 카테고리 정보 찾기
 * @param code 카테고리 코드
 * @returns 카테고리 정보 (없으면 null)
 */
export function getCategoryInfoByCode(
  code: CategoryCodeType
): CategoryInfo | null {
  if (!code) return null;
  return CATEGORIES.find((cat) => cat.code === code) || null;
}

/**
 * 카테고리 이름으로 카테고리 정보 찾기
 * @param name 카테고리 이름
 * @returns 카테고리 정보 (없으면 null)
 */
export function getCategoryInfoByName(name: CategoryType): CategoryInfo | null {
  if (!name) return null;
  return CATEGORIES.find((cat) => cat.name === name) || null;
}
