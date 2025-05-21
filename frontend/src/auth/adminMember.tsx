import { createContext, useState, useContext } from "react";
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
  apartmentName: string | null;
  buildingName: string | null;
  unitNumber: string | null;
  socialProvider: string | null;
  roles: string[];
  gradeId: number;
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
    apartmentName: null,
    buildingName: null,
    unitNumber: null,
    socialProvider: null,
    roles: [],
    gradeId: 0,
  };
}

export function useAdminMember() {
  const router = useRouter();

  const [isAdminMemberPending, setAdminMemberPending] = useState(true);
  const [adminMember, _setAdminMember] = useState<AdminMember>(
    createEmptyAdminMember()
  );

  const removeAdminMember = () => {
    _setAdminMember(createEmptyAdminMember());
  };

  const setAdminMember = (member: AdminMember) => {
    _setAdminMember(member);
    setAdminMemberPending(false);
  };

  const setNoAdminMember = () => {
    _setAdminMember(createEmptyAdminMember());
    setAdminMemberPending(false);
  };

  const clearAdminState = () => {
    removeAdminMember();
  };

  const isAdminLogin = adminMember.id !== 0;

  const adminLogout = (callback: () => void) => {
    fetchApi("/api/v1/admin/logout", { method: "DELETE" })
      .then((response) => {
        if (!response.ok) {
          console.error(
            "Admin logout request failed with status:",
            response.status
          );
        }
        removeAdminMember();
        callback();
      })
      .catch((error) => {
        console.error("Admin logout failed:", error);
        removeAdminMember();
        callback();
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
