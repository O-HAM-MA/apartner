'use client';

import React, { useState, useEffect } from 'react';
import { MdAccountCircle, MdEdit } from 'react-icons/md';
import { useGlobalLoginMember } from '@/auth/loginMember';
import Image from 'next/image';
import { get, post, patch } from '@/utils/api';
import { useRouter } from 'next/navigation';
import AddressSearch from '@/components/AddressSearch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/dialog';

// 회원가입 페이지에서 사용된 타입들을 참고하여 정의 (실제 프로젝트에서는 공통 타입으로 분리하는 것이 좋음)
interface Apartment {
  id: number;
  name: string;
  address: string;
  zipcode: string;
}

interface Building {
  id: number;
  buildingNumber: string;
}

interface Unit {
  id: number;
  unitNumber: string;
}

const MyPage: React.FC = () => {
  const router = useRouter();
  const { loginMember, isLogin, setLoginMember } = useGlobalLoginMember();
  const [isEditMode, setIsEditMode] = useState(false);

  // 수정할 사용자 정보를 담을 상태
  const [emailId, setEmailId] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [customEmailDomain, setCustomEmailDomain] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState('');

  // 주소 관련 상태 - 회원가입 페이지와 동일하게 변경
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<{
    id: number;
    name: string;
    address: string;
    zipcode: string;
  } | null>(null);
  const [dong, setDong] = useState('');
  const [ho, setHo] = useState('');

  // 이메일 인증 관련 상태
  const [originalEmail, setOriginalEmail] = useState('');
  const [emailCheckMessage, setEmailCheckMessage] = useState({
    text: '',
    color: '',
  });
  const [emailVerificationStep, setEmailVerificationStep] = useState<
    'NONE' | 'CHECKED' | 'CODE_SENT' | 'VERIFIED' | 'FAILED' | 'NOT_CHANGED'
  >('NOT_CHANGED');
  const [verificationCode, setVerificationCode] = useState('');
  const [isSendCodeDisabled, setIsSendCodeDisabled] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState({
    text: '',
    color: '',
  });
  const [isEmailChanged, setIsEmailChanged] = useState(false);

  // 휴대폰 인증 관련 상태
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState('');
  const [phoneCheckMessage, setPhoneCheckMessage] = useState({
    text: '',
    color: '',
  });
  const [isPhoneNumberChanged, setIsPhoneNumberChanged] = useState(false);
  const [isPhoneChecked, setIsPhoneChecked] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEmailCheck, setIsLoadingEmailCheck] = useState(false);
  const [isLoadingSendCode, setIsLoadingSendCode] = useState(false);
  const [isLoadingVerifyCode, setIsLoadingVerifyCode] = useState(false);
  const [isLoadingPhoneCheck, setIsLoadingPhoneCheck] = useState(false);

  // 아파트, 동, 호수 데이터
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  const emailDomains = [
    'naver.com',
    'gmail.com',
    'daum.net',
    'hanmail.net',
    '직접 입력',
  ];

  // 추가: 타이머 관리를 위한 상태 추가
  const [verificationTimer, setVerificationTimer] =
    useState<NodeJS.Timeout | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  // emailVerificationStep 값을 setInterval 콜백에서 최신으로 참조하기 위한 Ref
  const emailVerificationStepRef = React.useRef(emailVerificationStep);
  useEffect(() => {
    emailVerificationStepRef.current = emailVerificationStep;
  }, [emailVerificationStep]);

  // 타이머 정리 함수
  const clearVerificationTimer = () => {
    if (verificationTimer) {
      clearInterval(verificationTimer);
      setVerificationTimer(null);
    }
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => clearVerificationTimer();
  }, []);

  // 시간 포맷팅 함수 (mm:ss 형태로 변환)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  // 아파트 이름으로 검색하는 함수 수정
  const searchApartmentByName = async (apartmentName: string) => {
    try {
      // 올바른 API 경로 사용 - /search 제거
      const response = await get<any[]>(
        `/api/v1/apartments?name=${encodeURIComponent(apartmentName)}`
      );
      return response;
    } catch (error) {
      console.error('아파트 검색 실패:', error);
      return [];
    }
  };

  // 1. loginMember가 바뀔 때(로그인/로그아웃 등)만 상태 초기화
  useEffect(() => {
    if (!loginMember) return;
    setUserName(loginMember.userName || '');
    setOriginalEmail(loginMember.email || '');
    setOriginalPhoneNumber(loginMember.phoneNum || '');
    setPhoneNumber(loginMember.phoneNum || '');
    setDong(loginMember.buildingName || '');
    setHo(loginMember.unitNumber || '');
    // 주소 정보도 초기화
    if (loginMember.apartmentName) {
      searchApartmentByName(loginMember.apartmentName)
        .then((apartments) => {
          if (apartments && apartments.length > 0) {
            const foundApartment = apartments.find(
              (apt) => apt.name === loginMember.apartmentName
            );
            if (foundApartment) {
              setSelectedAddress({
                id: foundApartment.id,
                name: foundApartment.name,
                address: foundApartment.address || loginMember.address || '',
                zipcode: foundApartment.zipcode || loginMember.zipcode || '',
              });
            } else {
              setSelectedAddress({
                id: 0,
                name: loginMember.apartmentName || '',
                address: loginMember.address || '',
                zipcode: loginMember.zipcode || '',
              });
            }
          } else {
            setSelectedAddress({
              id: 0,
              name: loginMember.apartmentName || '',
              address: loginMember.address || '',
              zipcode: loginMember.zipcode || '',
            });
          }
        })
        .catch(() => {
          setSelectedAddress({
            id: 0,
            name: loginMember.apartmentName || '',
            address: loginMember.address || '',
            zipcode: loginMember.zipcode || '',
          });
        });
    } else {
      setSelectedAddress(null);
    }
  }, [loginMember]);

  // 2. isEditMode가 true로 바뀔 때만 입력 상태 초기화
  useEffect(() => {
    if (!isEditMode || !loginMember) return;
    setUserName(loginMember.userName || '');
    const currentFullEmail = loginMember.email || '';
    setOriginalEmail(currentFullEmail);
    if (currentFullEmail) {
      const [id, domain] = currentFullEmail.split('@');
      setEmailId(id || '');
      if (domain) {
        if (emailDomains.includes(domain)) {
          setEmailDomain(domain);
          setCustomEmailDomain('');
        } else {
          setEmailDomain('직접 입력');
          setCustomEmailDomain(domain);
        }
      } else {
        setEmailDomain(emailDomains[0]);
        setCustomEmailDomain('');
      }
    } else {
      setEmailId('');
      setEmailDomain(emailDomains[0]);
      setCustomEmailDomain('');
    }
    setEmailVerificationStep('NOT_CHANGED');
    setEmailCheckMessage({ text: '', color: '' });
    setVerificationMessage({ text: '', color: '' });
    setVerificationCode('');
    setIsEmailChanged(false);
    clearVerificationTimer();
    setOriginalPhoneNumber(loginMember.phoneNum || '');
    setPhoneNumber(loginMember.phoneNum || '');
    setPhoneCheckMessage({ text: '', color: '' });
    setIsPhoneNumberChanged(false);
    setIsPhoneChecked(true);
    // 주소 관련 상태도 최초 1회만 초기화
    setSelectedAddress({
      id: 0,
      name: loginMember.apartmentName || '',
      address: loginMember.address || '',
      zipcode: loginMember.zipcode || '',
    });
    setDong(loginMember.buildingName || '');
    setHo(loginMember.unitNumber || '');
  }, [isEditMode]);

  useEffect(() => {
    const fetchApartments = async () => {
      try {
        const response = await get<Apartment[]>('/api/v1/apartments');
        setApartments(response);
        // 현재 사용자의 아파트 정보가 있으면 설정
        if (loginMember?.apartmentName) {
          const userApartment = response.find(
            (apt) => apt.name === loginMember.apartmentName
          );
          if (userApartment) {
            setSelectedAddress({
              id: userApartment.id,
              name: userApartment.name,
              address: '', // 실제 주소는 별도 API 호출 필요
              zipcode: '', // 실제 우편번호는 별도 API 호출 필요
            });
          }
        }
      } catch (error) {
        console.error('아파트 목록 로드 실패:', error);
      }
    };
    if (isEditMode) {
      fetchApartments();
    }
  }, [isEditMode, loginMember?.apartmentName]);

  // 선택된 아파트에 따라 동 목록 로드 - 회원가입 페이지와 동일하게 수정
  useEffect(() => {
    if (!selectedAddress || selectedAddress.id === 0) {
      setBuildings([]);
      setDong('');
      return;
    }
    const fetchBuildings = async () => {
      try {
        const response = await get<Building[]>(
          `/api/v1/apartments/${selectedAddress.id}/buildings`
        );
        setBuildings(response);
        // 동이 선택되어 있었다면 초기화 (새로운 아파트 선택 시)
        setDong('');
        setHo('');
      } catch (error) {
        console.error('동 목록 로드 실패:', error);
      }
    };
    fetchBuildings();
  }, [selectedAddress]);

  // 선택된 동에 따라 호수 목록 로드 - 회원가입 페이지와 동일하게 수정
  useEffect(() => {
    if (!dong) {
      setUnits([]);
      return;
    }
    const fetchUnits = async () => {
      try {
        const selectedBuilding = buildings.find(
          (b) => b.buildingNumber === dong
        );
        if (!selectedBuilding) return;
        const response = await get<Unit[]>(
          `/api/v1/apartments/buildings/${selectedBuilding.id}/units`
        );
        setUnits(response);
      } catch (error) {
        console.error('호수 목록 로드 실패:', error);
      }
    };
    fetchUnits();
  }, [dong, buildings]);

  // 이메일 변경 감지
  useEffect(() => {
    console.log('[EFFECT] Email changed useEffect triggered. States:', {
      emailId,
      emailDomain,
      customEmailDomain,
      originalEmail,
      isEmailChanged,
      emailVerificationStep,
    });
    const fullEmail =
      emailDomain === '직접 입력'
        ? `${emailId}@${customEmailDomain}`
        : `${emailId}@${emailDomain}`;
    const changed = fullEmail.toLowerCase() !== originalEmail.toLowerCase();
    setIsEmailChanged(changed);
    if (changed) {
      setEmailVerificationStep('NONE');
      setEmailCheckMessage({ text: '', color: '' });
      setVerificationMessage({ text: '', color: '' });
      setVerificationCode('');
    } else {
      setEmailVerificationStep('NOT_CHANGED');
    }
  }, [emailId, emailDomain, customEmailDomain, originalEmail]);

  // 휴대폰 번호 변경 감지
  useEffect(() => {
    const changed = phoneNumber !== originalPhoneNumber;
    setIsPhoneNumberChanged(changed);
    if (changed) {
      setPhoneCheckMessage({ text: '', color: '' });
      setIsPhoneChecked(false);
    } else {
      setPhoneCheckMessage({ text: '', color: '' });
      setIsPhoneChecked(true);
    }

    // 디버깅 로그 추가
    console.log('[DEBUG] Phone number change detected:', {
      phoneNumber,
      originalPhoneNumber,
      isPhoneNumberChanged: changed,
      isPhoneChecked: changed ? false : true,
    });
  }, [phoneNumber, originalPhoneNumber]);

  // "수정 완료" 버튼 활성화 조건
  const isSubmitDisabled =
    isLoading ||
    (isEmailChanged && emailVerificationStep !== 'VERIFIED') ||
    (isPhoneNumberChanged && !isPhoneChecked);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [profileImageError, setProfileImageError] = useState<string>('');
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);

  // 프로필 이미지 업로드 핸들러
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileImageError('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024) {
      setProfileImageError('이미지 크기는 200KB 이하만 가능합니다.');
      setProfileImageFile(null);
      setProfileImagePreview('');
      return;
    }
    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const handleProfileImageUpload = async () => {
    if (!profileImageFile) return;
    setIsUploadingProfile(true);
    setProfileImageError('');
    try {
      const formData = new FormData();
      formData.append('multipartFile', profileImageFile);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/profile-images/upload`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || '프로필 이미지 업로드에 실패했습니다.');
      }

      // 서버 응답이 문자열 URL인 경우를 처리
      const contentType = response.headers.get('content-type');
      let imageUrl;

      if (contentType && contentType.includes('application/json')) {
        // JSON 응답인 경우
        const result = await response.json();
        imageUrl = result.profileImageUrl || '';
      } else {
        // 문자열 URL 응답인 경우
        imageUrl = await response.text();
      }

      if (setLoginMember && loginMember) {
        setLoginMember({ ...loginMember, profileImageUrl: imageUrl });
      }
      setIsProfileModalOpen(false);
      setProfileImageFile(null);
      setProfileImagePreview('');
    } catch (e: any) {
      setProfileImageError(e.message || '업로드 실패');
    } finally {
      setIsUploadingProfile(false);
    }
  };

  // 아파트 목록 불러온 후 selectedAddress 자동 세팅
  useEffect(() => {
    if (!isEditMode || !loginMember || apartments.length === 0) return;
    const apt = apartments.find((a) => a.name === loginMember.apartmentName);
    if (apt) {
      setSelectedAddress({
        id: apt.id,
        name: apt.name,
        address: apt.address,
        zipcode: apt.zipcode,
      });
    }
  }, [isEditMode, loginMember, apartments]);

  // 동 목록 불러온 후 dong 자동 세팅
  useEffect(() => {
    if (!isEditMode || !loginMember || buildings.length === 0) return;
    const bld = buildings.find(
      (b) => b.buildingNumber === loginMember.buildingName
    );
    if (bld) setDong(bld.buildingNumber);
  }, [isEditMode, loginMember, buildings]);

  // 호수 목록 불러온 후 ho 자동 세팅
  useEffect(() => {
    if (!isEditMode || !loginMember || units.length === 0) return;
    const unit = units.find((u) => u.unitNumber === loginMember.unitNumber);
    if (unit) setHo(unit.unitNumber);
  }, [isEditMode, loginMember, units]);

  if (!isLogin || !loginMember) {
    return <div>로그인 정보가 없습니다.</div>;
  }

  const handleEditToggle = () => {
    // 프로필 이미지 업로드 모달 상태 초기화
    setIsProfileModalOpen(false);
    setProfileImageFile(null);
    setProfileImagePreview('');
    setProfileImageError('');
    setIsUploadingProfile(false);
    // 기존 코드
    setIsEditMode(true);
  };

  const handleCancel = () => {
    console.log(
      '[DEBUG] handleCancel: CALLED. Setting isEditMode to false and resetting states.'
    );
    setIsEditMode(false);
    // isEditMode가 false로 바뀌면 위의 useEffect가 실행되어 모든 필드와 상태를 loginMember 기준으로 초기화합니다.
    // 추가적으로 즉시 정리해야 할 상태가 있다면 여기에 명시 (예: 타이머)
    clearVerificationTimer(); // 확실하게 타이머 정리
  };

  const handleEmailCheck = async () => {
    // 상태 초기화
    setEmailVerificationStep('NONE');
    setVerificationMessage({ text: '', color: '' });
    setVerificationCode('');
    clearVerificationTimer();
    setIsSendCodeDisabled(false);
    setEmailCheckMessage({
      text: '이메일 중복 확인 중...',
      color: 'text-gray-500',
    });

    const fullEmail =
      emailDomain === '직접 입력'
        ? `${emailId}@${customEmailDomain}`
        : `${emailId}@${emailDomain}`;
    if (!emailId || (emailDomain === '직접 입력' && !customEmailDomain)) {
      setEmailCheckMessage({
        text: '이메일 주소를 입력해주세요.',
        color: 'text-red-500',
      });
      return;
    }
    if (!isEmailChanged) {
      setEmailCheckMessage({
        text: '현재 이메일과 동일합니다. 변경 시에만 중복확인이 필요합니다.',
        color: 'text-blue-500',
      });
      setEmailVerificationStep('NOT_CHANGED');
      return;
    }

    setIsLoadingEmailCheck(true);
    setEmailCheckMessage({ text: '', color: '' });
    setVerificationMessage({ text: '', color: '' });
    setEmailVerificationStep('NONE');

    try {
      await post<{ message: string }>('/api/v1/auth/check-email', {
        email: fullEmail,
      });
      setEmailCheckMessage({
        text: '사용 가능한 이메일입니다. 인증번호를 받아주세요.',
        color: 'text-green-500',
      });
      setEmailVerificationStep('CHECKED');
    } catch (error: any) {
      const backendErrorMessage = error?.response?.data?.message;
      setEmailCheckMessage({
        text:
          backendErrorMessage ||
          '이미 사용중이거나 사용할 수 없는 이메일입니다.',
        color: 'text-red-500',
      });
      setEmailVerificationStep('FAILED');
    } finally {
      setIsLoadingEmailCheck(false);
    }
  };

  const handleSendVerificationCode = async () => {
    if (
      emailVerificationStep !== 'CHECKED' &&
      emailVerificationStep !== 'FAILED'
    )
      return;

    // 기존 타이머 정리
    clearVerificationTimer();

    setIsSendCodeDisabled(true);
    setIsLoadingSendCode(true);
    setEmailCheckMessage({ text: '', color: '' });
    setVerificationMessage({
      text: '인증번호를 전송 중입니다...',
      color: 'text-gray-500',
    });
    const fullEmail =
      emailDomain === '직접 입력'
        ? `${emailId}@${customEmailDomain}`
        : `${emailId}@${emailDomain}`;

    try {
      await post<{ message: string }>('/api/v1/auth/send-verification-code', {
        email: fullEmail,
      });
      setEmailVerificationStep('CODE_SENT');

      // 타이머 시작 (5분 = 300초)
      const timerDuration = 300;
      setRemainingTime(timerDuration);

      // 타이머 상태 메시지 설정
      setVerificationMessage({
        text: `✅ 인증번호가 발송되었습니다. 이메일을 확인해주세요. (유효시간: ${formatTime(
          timerDuration
        )})`,
        color: 'text-green-500',
      });

      clearVerificationTimer(); // 기존 타이머가 있다면 명시적으로 정리
      const newTimer = setInterval(() => {
        setRemainingTime((prevTime) => {
          if (prevTime <= 1) {
            clearVerificationTimer();
            setIsSendCodeDisabled(false);
            setVerificationMessage({
              text: "인증번호 유효시간이 만료되었습니다. 재전송이 필요하면 '인증번호 재전송' 버튼을 클릭해주세요.",
              color: 'text-blue-500', // 혹은 다른 원하는 색상
            });
            return 0;
          } else {
            // 인증 실패(FAILED) 상태가 아닐 때만 유효시간 메시지 업데이트
            if (emailVerificationStepRef.current !== 'FAILED') {
              setVerificationMessage({
                text: `✅ 인증번호가 발송되었습니다. 이메일을 확인해주세요. (유효시간: ${formatTime(
                  prevTime - 1
                )})`,
                color: 'text-green-500',
              });
            }
            return prevTime - 1;
          }
        });
      }, 1000);

      setVerificationTimer(newTimer);
    } catch (error: any) {
      setEmailVerificationStep('FAILED');
      const backendErrorMessage = error?.response?.data?.message;
      setVerificationMessage({
        text: `❌ ${backendErrorMessage || '인증번호 발송 실패'}`,
        color: 'text-red-500',
      });
      setIsSendCodeDisabled(false);
    } finally {
      setIsLoadingSendCode(false);
    }
  };

  const handleVerifyCode = async () => {
    console.log('[HANDLE_VERIFY_CODE_START] States:', {
      emailId,
      emailDomain,
      customEmailDomain,
      originalEmail,
      isEmailChanged,
      emailVerificationStep,
      verificationCode,
    });
    if (
      emailVerificationStep !== 'CODE_SENT' &&
      emailVerificationStep !== 'FAILED'
    )
      return;
    if (!verificationCode) {
      setVerificationMessage({
        text: '인증번호를 입력해주세요.',
        color: 'text-red-500',
      });
      return;
    }
    setIsLoadingVerifyCode(true);
    setEmailCheckMessage({ text: '', color: '' });
    setVerificationMessage({
      text: '인증번호를 확인 중입니다...',
      color: 'text-gray-500',
    });
    const fullEmail =
      emailDomain === '직접 입력'
        ? `${emailId}@${customEmailDomain}`
        : `${emailId}@${emailDomain}`;

    try {
      const responseData = await post<{ message: string }>(
        '/api/v1/auth/verify-code',
        {
          email: fullEmail,
          code: verificationCode,
        }
      );
      // 인증 성공 시 타이머 정리
      clearVerificationTimer();
      setEmailVerificationStep('VERIFIED');
      setEmailCheckMessage({ text: '', color: '' });
      setVerificationMessage({
        text: responseData.message || '✅ 인증번호가 일치합니다.',
        color: 'text-green-500',
      });
      console.log('[HANDLE_VERIFY_CODE_SUCCESS] States after VERIFIED:', {
        emailId,
        emailDomain,
        customEmailDomain,
        originalEmail,
        isEmailChanged,
        emailVerificationStep: 'VERIFIED', // 실제 상태 반영 전이므로 문자열로 표시
      });
    } catch (error: any) {
      // 인증 실패 시 FAILED 상태로 설정하여 UI 유지
      setEmailVerificationStep('FAILED');
      const backendErrorMessage = error?.response?.data?.message;
      setVerificationMessage({
        text: `❌ ${
          backendErrorMessage ||
          '인증번호가 일치하지 않습니다. 다시 확인해주세요.'
        }`,
        color: 'text-red-500', // 오류 메시지는 빨간색으로 표시
      });
      setEmailCheckMessage({ text: '', color: '' }); // 중복 확인 메시지 초기화
      console.log('[HANDLE_VERIFY_CODE_FAIL] States after FAILED:', {
        emailId,
        emailDomain,
        customEmailDomain,
        originalEmail,
        isEmailChanged,
        emailVerificationStep: 'FAILED', // 실제 상태 반영 전이므로 문자열로 표시
        error,
      });
      // 인증 실패 시에도 타이머는 계속 유지
      // verificationCode는 초기화하지 않고 유지하여 사용자가 수정할 수 있게 함
    } finally {
      setIsLoadingVerifyCode(false);
      console.log('[HANDLE_VERIFY_CODE_END] States in finally:', {
        emailId,
        emailDomain,
        customEmailDomain,
        originalEmail,
        isEmailChanged,
        emailVerificationStep, // 이 시점에는 VERIFIED 또는 FAILED가 반영되어 있어야 함
      });
    }
  };

  const handlePhoneCheck = async () => {
    if (!phoneNumber) {
      setPhoneCheckMessage({
        text: '휴대폰 번호를 입력해주세요.',
        color: 'text-red-500',
      });
      return;
    }
    if (!/^\d{10,11}$/.test(phoneNumber)) {
      setPhoneCheckMessage({
        text: '유효하지 않은 휴대폰 번호 형식입니다.',
        color: 'text-red-500',
      });
      return;
    }
    if (!isPhoneNumberChanged) {
      setPhoneCheckMessage({
        text: '현재 휴대폰 번호와 동일합니다.',
        color: 'text-blue-500',
      });
      setIsPhoneChecked(true);
      return;
    }

    setIsLoadingPhoneCheck(true);
    setPhoneCheckMessage({ text: '', color: '' });
    try {
      await post<{ message: string }>('/api/v1/auth/check-phone', {
        phoneNumber,
      });
      setPhoneCheckMessage({
        text: '사용 가능한 휴대폰 번호입니다.',
        color: 'text-green-500',
      });
      setIsPhoneChecked(true);
    } catch (error: any) {
      const backendErrorMessage = error?.response?.data?.message;
      setPhoneCheckMessage({
        text:
          backendErrorMessage || '이미 등록되었거나 사용할 수 없는 번호입니다.',
        color: 'text-red-500',
      });
      setIsPhoneChecked(false);
    } finally {
      setIsLoadingPhoneCheck(false);
    }
  };

  const handleSubmit = async () => {
    if (!isEditMode) {
      console.warn(
        '[DEBUG] handleSubmit: CALLED when not in edit mode. Aborting.'
      );
      return;
    }
    console.log('[DEBUG] handleSubmit: CALLED in edit mode.');

    if (isEmailChanged && emailVerificationStep !== 'VERIFIED') {
      alert('변경된 이메일의 인증을 완료해주세요.');
      return;
    }

    // 전화번호가 변경되었지만 중복확인이 되지 않은 경우 자동으로 중복확인 시도
    if (isPhoneNumberChanged && !isPhoneChecked) {
      console.log(
        '[DEBUG] handleSubmit: 전화번호 변경 감지, 자동 중복확인 시도'
      );
      try {
        setIsLoadingPhoneCheck(true);
        const response = await post<{ message: string }>(
          '/api/v1/auth/check-phone',
          {
            phoneNumber,
          }
        );
        console.log('[DEBUG] 전화번호 자동 중복확인 성공:', response);
        setPhoneCheckMessage({
          text: '사용 가능한 휴대폰 번호입니다.',
          color: 'text-green-500',
        });
        setIsPhoneChecked(true);
      } catch (error: any) {
        const backendErrorMessage = error?.response?.data?.message;
        setPhoneCheckMessage({
          text:
            backendErrorMessage ||
            '이미 등록되었거나 사용할 수 없는 번호입니다.',
          color: 'text-red-500',
        });
        alert(
          '변경된 휴대폰 번호의 중복 확인에 실패했습니다. 다른 번호를 입력해주세요.'
        );
        setIsLoadingPhoneCheck(false);
        return;
      } finally {
        setIsLoadingPhoneCheck(false);
      }
    }

    if (!confirm('정보를 수정하시겠습니까?')) {
      console.log('[DEBUG] handleSubmit: User cancelled information update.');
      return;
    }
    console.log('[DEBUG] handleSubmit: User confirmed information update.');
    setIsLoading(true);

    const selectedApartmentObj = apartments.find(
      (apt) => apt.name === selectedAddress?.name
    );
    const selectedBuildingObj = buildings.find(
      (b) => b.buildingNumber === dong
    );
    const selectedUnitObj = units.find((u) => u.unitNumber === ho);

    if (!selectedApartmentObj || !selectedBuildingObj || !selectedUnitObj) {
      alert('주소 정보를 올바르게 선택해주세요.');
      setIsLoading(false);
      return;
    }

    const updatedData: any = {
      userName: userName,
      apartmentId: selectedApartmentObj.id,
      buildingId: selectedBuildingObj.id,
      unitId: selectedUnitObj.id,
    };

    if (isEmailChanged && emailVerificationStep === 'VERIFIED') {
      const fullEmail =
        emailDomain === '직접 입력'
          ? `${emailId}@${customEmailDomain}`
          : `${emailId}@${emailDomain}`;
      updatedData.email = fullEmail;
    }
    if (isPhoneNumberChanged && isPhoneChecked) {
      updatedData.phoneNum = phoneNumber;
    }

    // 디버깅 로그 추가
    console.log('[DEBUG] Submit data preparation:', {
      isPhoneNumberChanged,
      isPhoneChecked,
      phoneNumber,
      phoneNumIncluded: isPhoneNumberChanged && isPhoneChecked,
      updatedData,
    });

    try {
      await patch('/api/v1/myInfos/update', updatedData);
      alert('정보가 성공적으로 수정되었습니다.');
      setIsEditMode(false);
      if (setLoginMember && loginMember) {
        const newEmail =
          isEmailChanged && emailVerificationStep === 'VERIFIED'
            ? emailDomain === '직접 입력'
              ? `${emailId}@${customEmailDomain}`
              : `${emailId}@${emailDomain}`
            : loginMember.email;
        const newPhoneNum =
          isPhoneNumberChanged && isPhoneChecked
            ? phoneNumber
            : loginMember.phoneNum;

        setLoginMember({
          ...loginMember,
          userName: userName,
          email: newEmail,
          phoneNum: newPhoneNum,
          apartmentName: selectedApartmentObj.name,
          buildingName: selectedBuildingObj.buildingNumber,
          unitNumber: selectedUnitObj.unitNumber,
        });
      }
    } catch (error: any) {
      console.error('정보 수정 실패:', error);
      alert(
        `정보 수정에 실패했습니다: ${
          error.message || '알 수 없는 오류가 발생했습니다.'
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 이메일 인증 UI를 보여줄지 결정하는 변수 - FAILED 상태일 때도 UI가 표시되도록 함
  const showEmailVerificationProcessUI =
    isEmailChanged && // 이메일이 변경된 경우에만 전체 프로세스 UI를 보여줌
    (emailVerificationStep === 'CHECKED' ||
      emailVerificationStep === 'CODE_SENT' ||
      emailVerificationStep === 'FAILED' ||
      emailVerificationStep === 'VERIFIED'); // VERIFIED 상태 추가

  // 이메일 관련 입력 필드들의 비활성화 여부 결정 변수
  const emailRelatedInputsDisabled =
    isLoadingEmailCheck ||
    isLoadingSendCode ||
    isLoadingVerifyCode ||
    isLoading;

  return (
    <>
      {/* 주소 검색 모달 */}
      <AddressSearch
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSelectAddress={(address) => {
          setSelectedAddress(address);
          setDong(''); // 동/호는 새 주소 선택 시 초기화
          setHo('');
          setIsAddressModalOpen(false);
        }}
      />

      <div className="min-h-screen bg-pink-50 p-4 sm:p-8 flex flex-col items-center dark:bg-gray-900">
        <div className="max-w-2xl w-full">
          <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-xl overflow-hidden">
            <div className="p-6 md:p-8">
              <h2 className="text-center text-5xl font-bold tracking-tight text-pink-500 dark:text-pink-400 mb-10 mt-6">
                MY INFO
              </h2>

              {/* 프로필 이미지 섹션 */}
              {!isEditMode && (
                <div className="flex flex-col items-center mb-10">
                  <div className="relative group">
                    {loginMember.profileImageUrl ? (
                      <Image
                        src={loginMember.profileImageUrl}
                        alt={loginMember.userName || 'Profile'}
                        width={144}
                        height={144}
                        className="rounded-full object-cover w-36 h-36"
                      />
                    ) : (
                      <span className="w-36 h-36 text-slate-300 dark:text-slate-600 flex items-center justify-center">
                        <MdAccountCircle size={144} />
                      </span>
                    )}
                    <button
                      type="button"
                      className="absolute bottom-2 right-2 bg-pink-500 hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700 text-white rounded-full p-3 shadow-lg transition-all duration-300 opacity-80 group-hover:opacity-100 transform scale-90 group-hover:scale-100"
                      aria-label="프로필 사진 변경"
                      onClick={() => {
                        setProfileImageFile(null);
                        setProfileImagePreview('');
                        setProfileImageError('');
                        setIsUploadingProfile(false);
                        setIsProfileModalOpen(true);
                      }}
                    >
                      <MdEdit size={20} />
                    </button>
                  </div>
                </div>
              )}

              {isEditMode ? (
                <form
                  id="mypage-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    console.log(
                      '[DEBUG] Form onSubmit: Default prevented. handleSubmit will be called by button click.'
                    );
                  }}
                  className="space-y-6"
                >
                  <div>
                    <label
                      htmlFor="userName"
                      className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      이름
                    </label>
                    <input
                      type="text"
                      name="userName"
                      id="userName"
                      className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm h-11"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  {/* 이메일 수정 필드 */}
                  <div>
                    <label
                      htmlFor="email-id"
                      className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      이메일{' '}
                      {isEmailChanged &&
                        emailVerificationStep !== 'VERIFIED' &&
                        '(변경 시 인증 필요)'}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        id="email-id"
                        name="email-id"
                        type="text"
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm h-11"
                        placeholder="이메일 아이디"
                        value={emailId}
                        onChange={(e) => {
                          setEmailId(e.target.value);
                          setEmailCheckMessage({ text: '', color: '' });
                          setEmailVerificationStep('NONE');
                          setVerificationMessage({ text: '', color: '' });
                          setVerificationCode('');
                        }}
                        disabled={emailRelatedInputsDisabled}
                      />
                      <span className="text-gray-500 dark:text-gray-400">
                        @
                      </span>
                      {emailDomain === '직접 입력' ? (
                        <input
                          type="text"
                          required
                          className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm h-11"
                          placeholder="도메인 입력"
                          value={customEmailDomain}
                          onChange={(e) => {
                            setCustomEmailDomain(e.target.value);
                            setEmailCheckMessage({ text: '', color: '' });
                            setEmailVerificationStep('NONE');
                            setVerificationMessage({ text: '', color: '' });
                            setVerificationCode('');
                          }}
                          disabled={emailRelatedInputsDisabled}
                        />
                      ) : (
                        <select
                          id="email-domain"
                          name="email-domain"
                          value={emailDomain}
                          onChange={(e) => {
                            setEmailDomain(e.target.value);
                            if (e.target.value !== '직접 입력')
                              setCustomEmailDomain('');
                            setEmailCheckMessage({ text: '', color: '' });
                            setEmailVerificationStep('NONE');
                            setVerificationMessage({ text: '', color: '' });
                            setVerificationCode('');
                          }}
                          className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm h-11"
                          disabled={emailRelatedInputsDisabled}
                        >
                          {emailDomains.map((domain) => (
                            <option key={domain} value={domain}>
                              {domain}
                            </option>
                          ))}
                        </select>
                      )}
                      {isEmailChanged &&
                        emailVerificationStep !== 'VERIFIED' &&
                        emailVerificationStep !== 'CHECKED' &&
                        emailVerificationStep !== 'CODE_SENT' &&
                        emailVerificationStep !== 'FAILED' && (
                          <button
                            type="button"
                            onClick={handleEmailCheck}
                            className={`ml-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white whitespace-nowrap ${
                              isLoadingEmailCheck
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-pink-500 hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700'
                            } focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-pink-400`}
                            disabled={
                              isLoadingEmailCheck ||
                              isLoadingSendCode ||
                              isLoadingVerifyCode ||
                              isLoading
                            }
                          >
                            {isLoadingEmailCheck ? '확인중...' : '중복확인'}
                          </button>
                        )}
                    </div>
                    {emailCheckMessage.text && (
                      <p
                        className={`mt-2 text-xs ${emailCheckMessage.color} ${
                          emailCheckMessage.color === 'text-green-500'
                            ? 'dark:text-green-400'
                            : emailCheckMessage.color === 'text-red-500'
                            ? 'dark:text-red-400'
                            : emailCheckMessage.color === 'text-blue-500'
                            ? 'dark:text-blue-400'
                            : emailCheckMessage.color === 'text-gray-500'
                            ? 'dark:text-gray-400'
                            : ''
                        }`}
                      >
                        {emailCheckMessage.text}
                      </p>
                    )}
                    {showEmailVerificationProcessUI && (
                      <>
                        {emailVerificationStep !== 'VERIFIED' && (
                          <div className="flex items-center space-x-2 mt-2">
                            <input
                              type="text"
                              placeholder="인증번호 입력"
                              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm h-11"
                              value={verificationCode}
                              onChange={(e) =>
                                setVerificationCode(e.target.value)
                              }
                              disabled={
                                isLoadingSendCode ||
                                isLoadingVerifyCode ||
                                isLoading
                              }
                            />
                            {(emailVerificationStep === 'CHECKED' ||
                              emailVerificationStep === 'FAILED') && (
                              <button
                                type="button"
                                onClick={handleSendVerificationCode}
                                className={`ml-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white whitespace-nowrap ${
                                  isSendCodeDisabled || isLoadingSendCode
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-pink-500 hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700'
                                } focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-pink-400`}
                                disabled={
                                  isSendCodeDisabled ||
                                  isLoadingSendCode ||
                                  isLoadingVerifyCode ||
                                  isLoading
                                }
                              >
                                {isLoadingSendCode
                                  ? '전송중...'
                                  : isSendCodeDisabled
                                  ? '재전송 대기'
                                  : emailVerificationStep === 'FAILED'
                                  ? '인증번호 재전송'
                                  : '인증번호 받기'}
                              </button>
                            )}
                            {(emailVerificationStep === 'CODE_SENT' ||
                              emailVerificationStep === 'FAILED') && (
                              <button
                                type="button"
                                onClick={handleVerifyCode}
                                className={`ml-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white whitespace-nowrap ${
                                  verificationCode.length === 0 ||
                                  isLoadingVerifyCode
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-pink-500 hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700'
                                } focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-pink-400`}
                                disabled={
                                  verificationCode.length === 0 ||
                                  isLoadingVerifyCode ||
                                  isLoadingSendCode ||
                                  isLoading
                                }
                              >
                                {isLoadingVerifyCode
                                  ? '확인중...'
                                  : '인증번호 확인'}
                              </button>
                            )}
                          </div>
                        )}
                        {verificationMessage.text && (
                          <p
                            className={`mt-2 text-xs ${
                              verificationMessage.color
                            } ${
                              verificationMessage.color === 'text-green-500'
                                ? 'dark:text-green-400'
                                : verificationMessage.color === 'text-red-500'
                                ? 'dark:text-red-400'
                                : verificationMessage.color === 'text-blue-500'
                                ? 'dark:text-blue-400'
                                : verificationMessage.color === 'text-gray-500'
                                ? 'dark:text-gray-400'
                                : ''
                            }`}
                          >
                            {verificationMessage.text}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* 연락처 수정 필드 */}
                  <div>
                    <label
                      htmlFor="phone-number"
                      className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      연락처{' '}
                      {isPhoneNumberChanged &&
                        !isPhoneChecked &&
                        '(변경 시 중복확인 필요)'}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        id="phone-number"
                        name="phone-number"
                        type="tel"
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm h-11"
                        placeholder="휴대폰 번호 (예: 01012345678)"
                        value={phoneNumber}
                        onChange={(e) => {
                          setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''));
                          setPhoneCheckMessage({ text: '', color: '' });
                          setIsPhoneChecked(false);
                        }}
                        disabled={isLoadingPhoneCheck || isLoading}
                      />
                      {isPhoneNumberChanged && !isPhoneChecked && (
                        <button
                          type="button"
                          onClick={handlePhoneCheck}
                          className={`ml-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white whitespace-nowrap ${
                            isLoadingPhoneCheck || isPhoneChecked
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-pink-500 hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700'
                          } focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-pink-400`}
                          disabled={
                            isLoadingPhoneCheck || isPhoneChecked || isLoading
                          }
                        >
                          {isLoadingPhoneCheck ? '확인중...' : '중복확인'}
                        </button>
                      )}
                    </div>
                    {phoneCheckMessage.text && (
                      <p
                        className={`mt-2 text-xs ${phoneCheckMessage.color} ${
                          phoneCheckMessage.color === 'text-green-500'
                            ? 'dark:text-green-400'
                            : phoneCheckMessage.color === 'text-red-500'
                            ? 'dark:text-red-400'
                            : phoneCheckMessage.color === 'text-blue-500'
                            ? 'dark:text-blue-400'
                            : phoneCheckMessage.color === 'text-gray-500'
                            ? 'dark:text-gray-400'
                            : ''
                        }`}
                      >
                        {phoneCheckMessage.text}
                      </p>
                    )}
                  </div>

                  {/* 주소 수정 - 회원가입 페이지와 동일한 방식으로 변경 */}
                  <div>
                    <label
                      htmlFor="address"
                      className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      주소
                    </label>
                    <div className="flex mb-2">
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={
                          selectedAddress
                            ? `(${selectedAddress.zipcode}) ${selectedAddress.address} ${selectedAddress.name}`
                            : ''
                        }
                        readOnly
                        placeholder="주소찾기 버튼을 클릭하여 주소를 검색하세요"
                        className="flex-1 appearance-none rounded-l-md block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm h-11"
                      />
                      <button
                        type="button"
                        onClick={() => setIsAddressModalOpen(true)}
                        className="h-11 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-r-md"
                        style={{ minWidth: '100px' }}
                      >
                        주소찾기
                      </button>
                    </div>
                    {selectedAddress && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        <div>
                          <label
                            htmlFor="address-dong"
                            className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-1"
                          >
                            동(빌딩)
                          </label>
                          <select
                            id="address-dong"
                            name="address-dong"
                            value={dong}
                            onChange={(e) => setDong(e.target.value)}
                            required
                            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                          >
                            <option value="" disabled>
                              동 선택
                            </option>
                            {buildings.map((b) => (
                              <option key={b.id} value={b.buildingNumber}>
                                {b.buildingNumber}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor="address-ho"
                            className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-1"
                          >
                            호수
                          </label>
                          <select
                            id="address-ho"
                            name="address-ho"
                            value={ho}
                            onChange={(e) => setHo(e.target.value)}
                            required
                            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                          >
                            <option value="" disabled>
                              호 선택
                            </option>
                            {units.map((u) => (
                              <option key={u.id} value={u.unitNumber}>
                                {u.unitNumber}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: '이름', value: loginMember.userName },
                    {
                      label: '이메일',
                      value: loginMember.email || '이메일 정보가 없습니다.',
                    },
                    {
                      label: '연락처',
                      value: loginMember.phoneNum || '연락처 정보가 없습니다.',
                    },
                    {
                      label: '주소',
                      value:
                        loginMember.zipcode &&
                        loginMember.address &&
                        loginMember.apartmentName &&
                        loginMember.buildingName &&
                        loginMember.unitNumber
                          ? `(${loginMember.zipcode}) ${loginMember.address} ${loginMember.apartmentName} ${loginMember.buildingName}동 ${loginMember.unitNumber}호`
                          : '주소 정보가 없습니다.',
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                    >
                      <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:w-1/3">
                        {item.label}
                      </dt>
                      <dd className="mt-1 text-base text-slate-800 dark:text-slate-200 sm:mt-0 sm:w-2/3 sm:text-right">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </div>
              )}

              {/* 액션 버튼 섹션 */}
              <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:justify-center gap-4">
                {isEditMode ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        console.log(
                          "[DEBUG] '수정 완료' button clicked. Calling handleSubmit..."
                        );
                        handleSubmit();
                      }}
                      className={`w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-semibold rounded-lg shadow-md text-white ${
                        isSubmitDisabled
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-pink-500 hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700'
                      } focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-pink-400 transition-all duration-300 transform hover:scale-105`}
                      disabled={isSubmitDisabled}
                    >
                      {isLoading ? '수정 중...' : '수정 완료'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-slate-300 dark:border-slate-600 text-base font-semibold rounded-lg shadow-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-gray-700 hover:bg-slate-50 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-pink-400 transition-all duration-300 transform hover:scale-105"
                      disabled={isLoading}
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleEditToggle}
                      className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-semibold rounded-lg shadow-md text-white bg-pink-500 hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-pink-400 transition-all duration-300 transform hover:scale-105"
                    >
                      정보 수정
                    </button>
                    {loginMember && loginMember.socialProvider === null && (
                      <button
                        type="button"
                        onClick={() => router.push('/mypage/editPassword')}
                        className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-slate-300 dark:border-slate-600 text-base font-semibold rounded-lg shadow-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-gray-700 hover:bg-slate-50 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-pink-400 transition-all duration-300 transform hover:scale-105"
                      >
                        비밀번호 변경
                      </button>
                    )}
                    {!isEditMode && (
                      <button
                        type="button"
                        onClick={() => router.push('/mypage/leave')}
                        className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-slate-300 dark:border-slate-600 text-base font-semibold rounded-lg shadow-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-gray-700 hover:bg-slate-50 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-pink-400 transition-all duration-300 transform hover:scale-105"
                      >
                        회원탈퇴
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 프로필 이미지 업로드 모달 */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>프로필 이미지 변경</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleProfileImageChange}
              disabled={isUploadingProfile}
            />
            {profileImagePreview && (
              <img
                src={profileImagePreview}
                alt="미리보기"
                className="w-32 h-32 rounded-full object-cover border"
              />
            )}
            {profileImageError && (
              <div className="text-red-500 text-sm">{profileImageError}</div>
            )}
          </div>
          <DialogFooter>
            <button
              type="button"
              className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 disabled:bg-gray-300"
              onClick={handleProfileImageUpload}
              disabled={!profileImageFile || isUploadingProfile}
            >
              {isUploadingProfile ? '업로드 중...' : '업로드'}
            </button>
            <DialogClose asChild>
              <button
                type="button"
                className="px-4 py-2 border rounded text-gray-700 bg-white hover:bg-gray-100"
                disabled={isUploadingProfile}
              >
                취소
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MyPage;
