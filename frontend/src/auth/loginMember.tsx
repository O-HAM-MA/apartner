import {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { fetchApi, checkUserAuth } from "@/utils/api";

type Member = {
  id: number;
  createDate: string;
  modifyDate: string;
  userName: string;
  profileImageUrl: string | null;
  apartmentName: string | null;
  buildingName: string | null;
  unitNumber: string | null;
  email: string | null;
  phoneNum: string | null;
  socialProvider: string | null;
  zipcode: string | null;
  address: string | null;
};

export const LoginMemberContext = createContext<{
  loginMember: Member;
  setLoginMember: (member: Member) => void;
  isLoginMemberPending: boolean;
  isLogin: boolean;
  hasValidAuth: boolean;
  logout: (callback: () => void) => void;
  logoutAndHome: () => void;
  clearLoginState: () => void;
}>({
  loginMember: createEmptyMember(),
  setLoginMember: () => {},
  isLoginMemberPending: true,
  isLogin: false,
  hasValidAuth: false,
  logout: () => {},
  logoutAndHome: () => {},
  clearLoginState: () => {},
});

function createEmptyMember(): Member {
  return {
    id: 0,
    createDate: "",
    modifyDate: "",
    userName: "",
    profileImageUrl: null,
    apartmentName: null,
    buildingName: null,
    unitNumber: null,
    email: null,
    phoneNum: null,
    socialProvider: null,
    zipcode: null,
    address: null,
  };
}

// 백엔드 인증 검증 및 유저 데이터 가져오기
async function verifyAuthWithBackend(): Promise<{
  isAuthenticated: boolean;
  userData?: Member;
}> {
  try {
    // 백엔드 API를 통한 인증 검증 및 유저 데이터 가져오기
    const userData = await checkUserAuth();
    return { isAuthenticated: true, userData };
  } catch (error) {
    console.log("인증 검증 실패:", error);
    return { isAuthenticated: false };
  }
}

export function useLoginMember() {
  const router = useRouter();

  const [isLoginMemberPending, setLoginMemberPending] = useState(true);
  const [loginMember, _setLoginMember] = useState<Member>(createEmptyMember());
  const [hasValidAuth, setHasValidAuth] = useState(false);

  // 컴포넌트 마운트 시 백엔드 인증 검증 및 유저 데이터 로드
  useEffect(() => {
    const checkAuthAndLoadUser = async () => {
      try {
        setLoginMemberPending(true);
        const { isAuthenticated, userData } = await verifyAuthWithBackend();

        setHasValidAuth(isAuthenticated);

        if (isAuthenticated && userData) {
          // 인증이 유효하고 유저 데이터가 있으면 상태 업데이트
          _setLoginMember(userData);
        } else if (!isAuthenticated) {
          // 인증이 유효하지 않으면 빈 멤버로 설정
          _setLoginMember(createEmptyMember());
        }

        setLoginMemberPending(false);
      } catch (error) {
        console.error("인증 및 유저 데이터 로드 실패:", error);
        setHasValidAuth(false);
        _setLoginMember(createEmptyMember());
        setLoginMemberPending(false);
      }
    };

    checkAuthAndLoadUser();
  }, []);

  const removeLoginMember = useCallback(() => {
    _setLoginMember(createEmptyMember());
    setHasValidAuth(false);
  }, []);

  const setLoginMember = useCallback((member: Member) => {
    _setLoginMember(member);
    setLoginMemberPending(false);
    setHasValidAuth(true);
  }, []);

  const setNoLoginMember = useCallback(() => {
    _setLoginMember(createEmptyMember());
    setLoginMemberPending(false);
    setHasValidAuth(false);
  }, []);

  const clearLoginState = useCallback(() => {
    removeLoginMember();
  }, [removeLoginMember]);

  const isLogin = loginMember.id !== 0 || hasValidAuth;

  const logout = useCallback(
    (callback: () => void) => {
      fetchApi("/api/v1/auth/logout", { method: "DELETE" })
        .then((response) => {
          if (!response.ok) {
            console.error(
              "Logout request failed with status:",
              response.status
            );
          }
          removeLoginMember();
          callback();
        })
        .catch((error) => {
          console.error("Logout failed:", error);
          removeLoginMember();
          callback();
        });
    },
    [removeLoginMember]
  );

  const logoutAndHome = useCallback(() => {
    logout(() => router.replace("/"));
  }, [logout, router]);

  return {
    loginMember,
    setLoginMember,
    isLoginMemberPending,
    setNoLoginMember,
    isLogin,
    hasValidAuth,

    logout,
    logoutAndHome,
    clearLoginState,
  };
}

export function useGlobalLoginMember() {
  return useContext(LoginMemberContext);
}
