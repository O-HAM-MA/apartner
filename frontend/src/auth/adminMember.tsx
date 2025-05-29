import { createContext, useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/utils/api";

type AdminMember = {
  id: number;
  userName: string;
  email: string | null;
  phoneNum: string | null;
  createdAt: string;
  modifiedAt: string;
  profileImageUrl: string | null;
  apartmentId: number | null;
  apartmentName: string | null;
  buildingName: string | null;
  unitNumber: string | null;
  socialProvider: string | null;
  roles: string[];
  gradeId: number;
  isAdmin?: boolean;
};

export const AdminMemberContext = createContext<{
  adminMember: AdminMember;
  setAdminMember: (member: AdminMember) => void;
  isAdminMemberPending: boolean;
  isAdminLogin: boolean;
  adminLogout: (callback: () => void) => void;
  logoutAndRedirect: () => void;
  clearAdminState: () => void;
}>({
  adminMember: createEmptyAdminMember(),
  setAdminMember: () => {},
  isAdminMemberPending: true,
  isAdminLogin: false,
  adminLogout: () => {},
  logoutAndRedirect: () => {},
  clearAdminState: () => {},
});

function createEmptyAdminMember(): AdminMember {
  return {
    id: 0,
    userName: "",
    email: null,
    phoneNum: null,
    createdAt: "",
    modifiedAt: "",
    profileImageUrl: null,
    apartmentId: null,
    apartmentName: null,
    buildingName: null,
    unitNumber: null,
    socialProvider: null,
    roles: [],
    gradeId: 0,
    isAdmin: false,
  };
}

export function useAdminMember() {
  const router = useRouter();

  const [isAdminMemberPending, setAdminMemberPending] = useState(true);
  const [adminMember, _setAdminMember] = useState<AdminMember>(() => {
    // 브라우저 환경에서만 실행
    if (typeof window !== "undefined") {
      const savedAdmin = localStorage.getItem("adminMember");
      if (savedAdmin) {
        try {
          return JSON.parse(savedAdmin);
        } catch (e) {
          console.error("[AdminMember] localStorage 파싱 오류:", e);
          return createEmptyAdminMember();
        }
      }
    }
    return createEmptyAdminMember();
  });

  const removeAdminMember = () => {
    _setAdminMember(createEmptyAdminMember());
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminMember");
    }
  };

  const setAdminMember = (member: AdminMember) => {
    console.log("[AdminMember] 관리자 정보 설정:", member);
    // isAdmin 속성 설정 - roles 배열에 ADMIN이 포함되어 있으면 true
    const memberWithIsAdmin = {
      ...member,
      isAdmin: member.roles.includes("ADMIN"),
    };
    _setAdminMember(memberWithIsAdmin);
    setAdminMemberPending(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("adminMember", JSON.stringify(memberWithIsAdmin));
    }
  };

  const setNoAdminMember = () => {
    _setAdminMember(createEmptyAdminMember());
    setAdminMemberPending(false);
  };

  const clearAdminState = () => {
    removeAdminMember();
  };

  const isAdminLogin = adminMember.id !== 0;
  console.log(
    "[AdminMember] 로그인 상태 확인:",
    isAdminLogin,
    "ID:",
    adminMember.id
  );

  const adminLogout = (callback: () => void) => {
    fetchApi("/api/v1/admin/logout", { method: "DELETE" })
      .then((response) => {
        setTimeout(() => {
          removeAdminMember();
          callback();
        }, 100); // 쿠키 삭제 적용 대기
      })
      .catch((error) => {
        setTimeout(() => {
          removeAdminMember();
          callback();
        }, 100);
      });
  };

  const logoutAndRedirect = () => {
    adminLogout(() => router.replace("/admin"));
  };

  return {
    adminMember,
    setAdminMember,
    isAdminMemberPending,
    setNoAdminMember,
    isAdminLogin,
    adminLogout,
    logoutAndRedirect,
    clearAdminState,
  };
}

export function useGlobalAdminMember() {
  return useContext(AdminMemberContext);
}
