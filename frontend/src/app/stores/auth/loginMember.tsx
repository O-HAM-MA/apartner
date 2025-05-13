import { createContext, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { del } from '@/utils/api';

type Member = {
   id: number;
   createDate: string;
   modifyDate: string;
   userName: string;
   profileImageUrl: string | null;
   apartmentName: string | null;
   buildingName: string | null;
   unitNumber: string | null;
};

export const LoginMemberContext = createContext<{
   loginMember: Member;
   setLoginMember: (member: Member) => void;
   isLoginMemberPending: boolean;
   isLogin: boolean;
   logout: (callback: () => void) => void;
   logoutAndHome: () => void;
}>({
   loginMember: createEmptyMember(),
   setLoginMember: () => {},
   isLoginMemberPending: true,
   isLogin: false,
   logout: () => {},
   logoutAndHome: () => {},
});

function createEmptyMember(): Member {
   return {
      id: 0,
      createDate: '',
      modifyDate: '',
      userName: '',
      profileImageUrl: null,
      apartmentName: null,
      buildingName: null,
      unitNumber: null,
   };
}

export function useLoginMember() {
   const router = useRouter();

   const [isLoginMemberPending, setLoginMemberPending] = useState(true);
   const [loginMember, _setLoginMember] = useState<Member>(createEmptyMember());

   const removeLoginMember = () => {
      _setLoginMember(createEmptyMember());
      setLoginMemberPending(false);
   };

   const setLoginMember = (member: Member) => {
      _setLoginMember(member);
      setLoginMemberPending(false);
   };

   const setNoLoginMember = () => {
      setLoginMemberPending(false);
   };

   const isLogin = loginMember.id !== 0;

   const logout = (callback: () => void) => {
      del('/api/v1/auth/logout')
         .then(() => {
            removeLoginMember();
            callback();
         })
         .catch(error => {
            console.error('Logout failed:', error);
            removeLoginMember();
            callback();
         });
   };

   const logoutAndHome = () => {
      logout(() => router.replace('/'));
   };

   return {
      loginMember,
      setLoginMember,
      isLoginMemberPending,
      setNoLoginMember,
      isLogin,

      logout,
      logoutAndHome,
   };
}

export function useGlobalLoginMember() {
   return use(LoginMemberContext);
}
