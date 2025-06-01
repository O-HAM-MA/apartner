'use client';

import { useState, useEffect } from 'react';
import { post, get } from '@/utils/api';
import { useRouter } from 'next/navigation';
import React from 'react';
import AddressSearch from '@/components/AddressSearch';

export default function SignUpPage() {
  const socialLoginForKakaoUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/oauth2/authorization/kakao`;
  const redirectUrl = `${process.env.NEXT_PUBLIC_FRONT_BASE_URL}`;

  const router = useRouter();
  const [kakaoInfo, setKakaoInfo] = useState<{
    socialProvider?: string;
    nickname?: string;
    profileImage?: string;
    email?: string;
  }>({});
  const [signupType, setSignupType] = useState<'NORMAL' | 'KAKAO'>('NORMAL');
  const [emailId, setEmailId] = useState('');
  const [emailDomain, setEmailDomain] = useState('naver.com');
  const [customEmailDomain, setCustomEmailDomain] = useState('');
  const [emailCheckMessage, setEmailCheckMessage] = useState({
    text: '',
    color: '',
  });
  const [emailVerificationStep, setEmailVerificationStep] = useState<
    'NONE' | 'CHECKED' | 'CODE_SENT' | 'VERIFIED' | 'FAILED'
  >('NONE');
  const [verificationCode, setVerificationCode] = useState('');
  const [isSendCodeDisabled, setIsSendCodeDisabled] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState({
    text: '',
    color: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordMatchMessage, setPasswordMatchMessage] = useState({
    text: '',
    color: '',
  });
  const [passwordPolicy, setPasswordPolicy] = useState({
    length: false,
    specialChar: false,
    uppercase: false,
    number: false,
  });

  const [name, setName] = useState('');

  // 주소 관련 상태
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<{
    id: number;
    name: string;
    address: string;
    zipcode: string;
  } | null>(null);
  const [addressError, setAddressError] = useState('');
  const [dong, setDong] = useState('');
  const [dongError, setDongError] = useState('');
  const [ho, setHo] = useState('');
  const [hoError, setHoError] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCheckMessage, setPhoneCheckMessage] = useState({
    text: '',
    color: '',
  });

  const emailDomains = [
    'naver.com',
    'gmail.com',
    'daum.net',
    'hanmail.net',
    '직접 입력',
  ];

  // 아파트, 동, 호수 데이터
  const [apartments, setApartments] = useState<{ id: number; name: string }[]>(
    []
  );
  const [buildings, setBuildings] = useState<
    { id: number; buildingNumber: string }[]
  >([]);
  const [units, setUnits] = useState<{ id: number; unitNumber: string }[]>([]);

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

  // 선택된 아파트에 따라 동 목록 로드
  useEffect(() => {
    if (!selectedAddress) {
      setBuildings([]);
      return;
    }

    const fetchBuildings = async () => {
      try {
        const response = await get<{ id: number; buildingNumber: string }[]>(
          `/api/v1/apartments/${selectedAddress.id}/buildings`
        );
        setBuildings(response);
        // 동이 선택되어 있었다면 초기화
        setDong('');
        setHo('');
      } catch (error) {
        console.error('동 목록 로드 실패:', error);
        // 실패 시 기본 데이터 사용
        setBuildings([
          { id: 1, buildingNumber: '101동' },
          { id: 2, buildingNumber: '102동' },
          { id: 3, buildingNumber: '103동' },
        ]);
      }
    };

    fetchBuildings();
  }, [selectedAddress]);

  // 선택된 동에 따라 호수 목록 로드
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

        const response = await get<{ id: number; unitNumber: string }[]>(
          `/api/v1/apartments/buildings/${selectedBuilding.id}/units`
        );
        setUnits(response);
      } catch (error) {
        console.error('호수 목록 로드 실패:', error);
        // 실패 시 기본 데이터 사용
        setUnits([
          { id: 1, unitNumber: '101호' },
          { id: 2, unitNumber: '102호' },
          { id: 3, unitNumber: '201호' },
          { id: 4, unitNumber: '202호' },
        ]);
      }
    };

    fetchUnits();
  }, [dong, buildings]);

  // 카카오 소셜 로그인 정보 조회
  useEffect(() => {
    const fetchKakaoInfo = async () => {
      try {
        // URL에서 kakaoInfo 쿼리 파라미터 확인
        const urlParams = new URLSearchParams(window.location.search);
        const kakaoInfoParam = urlParams.get('kakaoInfo');
        const authSource = urlParams.get('authSource');

        if (kakaoInfoParam) {
          // URL 파라미터에서 카카오 정보 파싱
          try {
            const decodedInfo = JSON.parse(decodeURIComponent(kakaoInfoParam));
            console.log('Decoded Kakao info from URL:', decodedInfo);

            if (decodedInfo.socialProvider === 'kakao') {
              // socialId를 제외한 정보만 저장
              setKakaoInfo({
                socialProvider: decodedInfo.socialProvider,
                nickname: decodedInfo.nickname,
                profileImage: decodedInfo.profileImage,
                email: decodedInfo.email,
              });
              setSignupType('KAKAO');

              if (decodedInfo.nickname) {
                setName(decodedInfo.nickname);
              }

              if (decodedInfo.email) {
                const [id, domain] = decodedInfo.email.split('@');
                setEmailId(id || '');

                if (domain) {
                  if (emailDomains.includes(domain)) {
                    setEmailDomain(domain);
                  } else {
                    setEmailDomain('직접 입력');
                    setCustomEmailDomain(domain);
                  }
                }
              }
            }
          } catch (error) {
            console.error('Failed to parse kakaoInfo from URL:', error);
          }

          // 처리 후 URL에서 파라미터 제거 (필요시)
          const url = new URL(window.location.href);
          url.searchParams.delete('kakaoInfo');
          window.history.replaceState({}, document.title, url.toString());

          return; // URL에서 정보를 가져왔으므로 API 호출 불필요
        }

        // 카카오 로그인으로부터 온 경우 또는 기존 로직
        if (
          authSource === 'kakao' ||
          window.location.pathname.includes('/signup')
        ) {
          // API 호출 시도
          const response = await get<{
            socialProvider?: string;
            nickname?: string;
            profileImage?: string;
            email?: string;
          }>('/api/v1/auth/check-social-session'); // 기존 API 경로 유지

          if (response && response.socialProvider === 'kakao') {
            setKakaoInfo(response);
            setSignupType('KAKAO');

            if (Object.prototype.hasOwnProperty.call(response, 'nickname')) {
              setName(response.nickname || '');
            }

            if (response.email) {
              const [id, domain] = response.email.split('@');
              setEmailId(id || '');
              if (domain) {
                if (emailDomains.includes(domain)) {
                  setEmailDomain(domain);
                } else {
                  setEmailDomain('직접 입력');
                  setCustomEmailDomain(domain);
                }
              }
            }
          }

          // URL 파라미터 정리
          if (authSource) {
            const url = new URL(window.location.href);
            url.searchParams.delete('authSource');
            window.history.replaceState({}, document.title, url.toString());
          }
        }
      } catch (error) {
        console.error('카카오 정보 조회 실패:', error);
      }
    };

    fetchKakaoInfo();
  }, []);

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

    setIsLoading(true);

    try {
      const responseData = await post<{ message: string }>(
        '/api/v1/auth/check-email',
        { email: fullEmail }
      );

      setEmailCheckMessage({
        text: responseData.message || '사용 가능한 이메일입니다.',
        color: 'text-green-500',
      });
      setEmailVerificationStep('CHECKED');
    } catch (error: any) {
      console.error('Email check error:', error);
      const backendErrorMessage = error?.response?.data?.message;
      setEmailCheckMessage({
        text:
          backendErrorMessage ||
          error.message ||
          '이미 사용중이거나 확인할 수 없는 이메일입니다.',
        color: 'text-red-500',
      });
      setEmailVerificationStep('NONE');
    } finally {
      setIsLoading(false);
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

    setIsLoading(true);
    setPhoneCheckMessage({ text: '', color: '' });

    try {
      const responseData = await post<{ message: string }>(
        '/api/v1/auth/check-phone',
        { phoneNumber }
      );

      setPhoneCheckMessage({
        text: responseData.message || '사용 가능한 휴대폰 번호입니다.',
        color: 'text-green-500',
      });
    } catch (error: any) {
      console.error('Phone check error:', error);
      const backendErrorMessage = error?.response?.data?.message;
      setPhoneCheckMessage({
        text:
          backendErrorMessage ||
          error.message ||
          '이미 등록되었거나 확인할 수 없는 번호입니다.',
        color: 'text-red-500',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (password && passwordConfirm) {
      if (password === passwordConfirm) {
        setPasswordMatchMessage({
          text: '비밀번호가 일치합니다.',
          color: 'text-green-500',
        });
      } else {
        setPasswordMatchMessage({
          text: '비밀번호가 일치하지 않습니다.',
          color: 'text-red-500',
        });
      }
    } else {
      setPasswordMatchMessage({ text: '', color: '' });
    }

    setPasswordPolicy({
      length: password.length >= 8,
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      uppercase: /[a-zA-Z]/.test(password),
      number: /[0-9]/.test(password),
    });
  }, [password, passwordConfirm]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 이메일을 입력했다면, 타입(일반/카카오)에 관계없이 이메일 인증 완료 여부 확인
    if (emailId && emailVerificationStep !== 'VERIFIED') {
      alert('이메일 인증을 완료해주세요.');
      return;
    }

    // 주소 검증
    if (!selectedAddress) {
      setAddressError('주소를 선택해주세요.');
      return;
    }

    // 동 검증
    if (!dong) {
      setDongError('동을 선택해주세요.');
      return;
    }

    // 호수 검증
    if (!ho) {
      setHoError('호수를 선택해주세요.');
      return;
    }

    if (
      signupType !== 'KAKAO' &&
      (!phoneCheckMessage.text || phoneCheckMessage.color !== 'text-green-500')
    ) {
      alert('휴대폰 번호 중복 확인이 필요합니다.');
      return;
    }

    if (signupType !== 'KAKAO' && password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!name) {
      alert('이름을 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const fullEmail =
        emailDomain === '직접 입력'
          ? `${emailId}@${customEmailDomain}`
          : `${emailId}@${emailDomain}`;

      const selectedBuilding = buildings.find((b) => b.buildingNumber === dong);
      const selectedUnit = units.find((u) => u.unitNumber === ho);

      if (!selectedAddress || !selectedBuilding || !selectedUnit) {
        alert('선택한 주소 정보를 찾을 수 없습니다.');
        return;
      }

      const registrationData: any = {
        email: fullEmail,
        userName: name,
        apartmentId: selectedAddress.id,
        buildingId: selectedBuilding.id,
        unitId: selectedUnit.id,
        // 프로필 이미지 필드를 회원가입 시점에는 전송하지 않음
      };

      if (signupType === 'KAKAO') {
        registrationData.socialProvider = 'kakao';
        // 프로필 이미지 관련 필드 제거 (백엔드에서 처리하도록 함)
        // 카카오의 경우 소셜 ID 전송
        if (kakaoInfo && kakaoInfo.socialProvider === 'kakao') {
          // 카카오 정보가 있으면 소셜 ID만 전송
          // 프로필 이미지는 전송하지 않음 - 백엔드에서 처리하도록 함
        }
      } else {
        registrationData.password = password;
        registrationData.phoneNum = phoneNumber;
      }

      const response = await post('/api/v1/users/userreg', registrationData);

      console.log('회원가입 성공:', response);
      alert('회원가입이 완료되었습니다.');
      router.push('/signup/success');
    } catch (error: any) {
      console.error('회원가입 오류:', error);
      const errorMessage =
        error?.response?.data?.message ||
        '회원가입 처리 중 오류가 발생했습니다.';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const 정책문구스타일 = 'text-xs';
  const 충족스타일 = 'text-green-500';
  const 미충족스타일 = 'text-red-500';

  const handleSendVerificationCode = async () => {
    // 기존 타이머 정리
    clearVerificationTimer();
    setIsSendCodeDisabled(true);
    setIsLoading(true);
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
      const responseData = await post<{ message: string }>(
        '/api/v1/auth/send-verification-code',
        {
          email: fullEmail,
        }
      );

      setEmailVerificationStep('CODE_SENT');
      const timerDuration = 300;
      setRemainingTime(timerDuration);
      setVerificationMessage({
        text: `✅ 인증번호가 발송되었습니다. 이메일을 확인해주세요. (유효시간: ${formatTime(
          timerDuration
        )})`,
        color: 'text-green-500',
      });

      const newTimer = setInterval(() => {
        setRemainingTime((prevTime) => {
          if (prevTime <= 1) {
            clearVerificationTimer();
            setIsSendCodeDisabled(false);
            setVerificationMessage({
              text: "인증번호 유효시간이 만료되었습니다. 재전송이 필요하면 '인증번호 재전송' 버튼을 클릭해주세요.",
              color: 'text-blue-500',
            });
            return 0;
          } else {
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
      console.error('Send verification code error:', error);
      setEmailVerificationStep('FAILED');
      const backendErrorMessage = error?.response?.data?.message;
      setVerificationMessage({
        text: `❌ ${
          backendErrorMessage || error.message || '인증번호 발송 실패'
        }`,
        color: 'text-red-500',
      });
      setIsSendCodeDisabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setVerificationMessage({
        text: '인증번호를 입력해주세요.',
        color: 'text-red-500',
      });
      return;
    }

    setIsLoading(true);
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

      clearVerificationTimer();
      setEmailVerificationStep('VERIFIED');
      setEmailCheckMessage({ text: '', color: '' });
      setVerificationMessage({
        text: responseData.message || '✅ 인증번호가 일치합니다.',
        color: 'text-green-500',
      });
    } catch (error: any) {
      console.error('Verify code error:', error);
      setEmailVerificationStep('FAILED');
      const backendErrorMessage = error?.response?.data?.message;
      setVerificationMessage({
        text: `❌ ${
          backendErrorMessage ||
          '인증번호가 일치하지 않습니다. 다시 확인해주세요.'
        }`,
        color: 'text-red-500',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AddressSearch
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSelectAddress={(address) => {
          setSelectedAddress(address);
          setAddressError('');
        }}
      />
      <div className="min-h-screen bg-pink-50 p-4 sm:p-8 flex flex-col items-center  dark:bg-gray-900">
        <div className="w-full max-w-2xl space-y-2 bg-white dark:bg-gray-800 rounded-2xl py-16 px-8 shadow-xl">
          <div>
            <h2 className="text-center text-5xl font-bold tracking-tight text-pink-500 dark:text-pink-400 mb-2 max-w-xl mx-auto">
              SIGN UP
            </h2>
            {signupType === 'KAKAO' && (
              <p className="text-center text-3xl font-semibold text-yellow-400 mb-10">
                - KAKAO -
              </p>
            )}
          </div>
          <form className="space-y-4 max-w-xl mx-auto" onSubmit={handleSubmit}>
            <div className="rounded-md -space-y-px">
              <div className="mb-5">
                <label
                  htmlFor="email-id"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  이메일
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    id="email-id"
                    name="email-id"
                    type="text"
                    autoComplete="email-id"
                    required
                    className="block w-full h-12 rounded-lg border-0 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-pink-500 focus:border-pink-500 focus:outline-none dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400 dark:focus:ring-pink-400 sm:text-sm sm:leading-6"
                    placeholder="이메일 아이디"
                    value={emailId}
                    onChange={(e) => {
                      setEmailId(e.target.value);
                      setEmailCheckMessage({ text: '', color: '' });
                      setEmailVerificationStep('NONE');
                      setVerificationMessage({ text: '', color: '' });
                      setVerificationCode('');
                    }}
                    disabled={isLoading}
                  />
                  <span className="text-gray-500 dark:text-gray-400">@</span>
                  {emailDomain === '직접 입력' ? (
                    <input
                      type="text"
                      required
                      className="block w-full h-12 rounded-lg border-0 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-pink-500 focus:border-pink-500 focus:outline-none dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400 dark:focus:ring-pink-400 sm:text-sm sm:leading-6"
                      placeholder="도메인 입력"
                      value={customEmailDomain}
                      onChange={(e) => {
                        setCustomEmailDomain(e.target.value);
                        setEmailCheckMessage({ text: '', color: '' });
                        setEmailVerificationStep('NONE');
                        setVerificationMessage({ text: '', color: '' });
                        setVerificationCode('');
                      }}
                      disabled={isLoading}
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
                      className="block w-full h-12 rounded-lg border-0 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-pink-500 focus:border-pink-500 focus:outline-none dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400 dark:focus:ring-pink-400 sm:text-sm sm:leading-6"
                      disabled={isLoading}
                    >
                      {emailDomains.map((domain) => (
                        <option key={domain} value={domain}>
                          {domain}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={handleEmailCheck}
                    className={`ml-2 px-4 h-12 border border-transparent text-sm font-semibold leading-6 text-white rounded-lg ${
                      isLoading || emailVerificationStep === 'VERIFIED'
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-pink-500 hover:bg-pink-600'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 whitespace-nowrap`}
                    disabled={isLoading || emailVerificationStep === 'VERIFIED'}
                  >
                    {isLoading && emailVerificationStep === 'NONE'
                      ? '확인중...'
                      : '중복체크'}
                  </button>
                </div>
                {emailCheckMessage.text && (
                  <p
                    className={`mt-2 text-xs ${emailCheckMessage.color} ${
                      emailCheckMessage.color === 'text-green-500'
                        ? 'dark:text-green-400'
                        : emailCheckMessage.color === 'text-red-500'
                        ? 'dark:text-red-400'
                        : 'dark:text-gray-400'
                    }`}
                  >
                    {emailCheckMessage.text}
                  </p>
                )}
                {/* 이메일 인증 UI - CHECKED, CODE_SENT, FAILED, VERIFIED 상태일 때 표시 */}
                {(emailVerificationStep === 'CHECKED' ||
                  emailVerificationStep === 'CODE_SENT' ||
                  emailVerificationStep === 'FAILED' ||
                  emailVerificationStep === 'VERIFIED') && (
                  <div className="flex flex-col space-y-2 mt-2">
                    {/* VERIFIED 상태가 아닐 때만 입력 필드 및 버튼 표시 */}
                    {emailVerificationStep !== 'VERIFIED' && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="인증번호를 입력해주세요"
                          className="block w-full h-12 rounded-lg border-0 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-pink-500 focus:border-pink-500 focus:outline-none dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400 dark:focus:ring-pink-400 sm:text-sm sm:leading-6"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          disabled={isLoading}
                        />
                        {/* 인증번호 전송 또는 재전송 버튼 - CHECKED 또는 FAILED 상태일 때 표시 */}
                        {(emailVerificationStep === 'CHECKED' ||
                          emailVerificationStep === 'FAILED') && (
                          <button
                            type="button"
                            onClick={handleSendVerificationCode}
                            className={`ml-2 px-4 h-12 border border-transparent text-sm font-semibold leading-6 text-white rounded-lg ${
                              isSendCodeDisabled || isLoading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-pink-500 hover:bg-pink-600'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 whitespace-nowrap`}
                            disabled={isSendCodeDisabled || isLoading}
                          >
                            {isLoading && isSendCodeDisabled
                              ? '전송중...'
                              : isSendCodeDisabled
                              ? '재전송 대기'
                              : emailVerificationStep === 'FAILED'
                              ? '인증번호 재전송'
                              : '인증번호 보내기'}
                          </button>
                        )}
                        {/* 인증번호 확인 버튼 - CODE_SENT 또는 FAILED 상태일 때도 표시 */}
                        {(emailVerificationStep === 'CODE_SENT' ||
                          emailVerificationStep === 'FAILED') && (
                          <button
                            type="button"
                            onClick={handleVerifyCode}
                            className={`ml-2 px-4 h-12 border border-transparent text-sm font-semibold leading-6 text-white rounded-lg ${
                              verificationCode.length === 0 || isLoading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-pink-500 hover:bg-pink-600'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 whitespace-nowrap`}
                            disabled={
                              verificationCode.length === 0 || isLoading
                            }
                          >
                            {isLoading && emailVerificationStep === 'CODE_SENT'
                              ? '확인중...'
                              : '확인'}
                          </button>
                        )}
                      </div>
                    )}
                    {/* 인증번호 관련 메시지 (성공, 실패, 안내 등) */}
                    {verificationMessage.text && (
                      <p
                        className={`text-xs ${verificationMessage.color} ${
                          verificationMessage.color === 'text-green-500'
                            ? 'dark:text-green-400'
                            : verificationMessage.color === 'text-red-500'
                            ? 'dark:text-red-400'
                            : verificationMessage.color === 'text-blue-500'
                            ? 'dark:text-blue-400'
                            : 'dark:text-gray-400'
                        }`}
                      >
                        {verificationMessage.text}
                      </p>
                    )}
                  </div>
                )}
                {isLoading &&
                  emailVerificationStep !== 'CHECKED' &&
                  emailVerificationStep !== 'CODE_SENT' &&
                  emailVerificationStep !== 'FAILED' && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      처리 중...
                    </p>
                  )}
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  이메일은 로그인 ID로 사용됩니다.
                </p>
              </div>

              {signupType !== 'KAKAO' && (
                <>
                  <div className="pb-5">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      비밀번호
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      className="block w-full h-12 rounded-lg border-0 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-pink-500 focus:border-pink-500 focus:outline-none dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400 dark:focus:ring-pink-400 sm:text-sm sm:leading-6"
                      placeholder="비밀번호를 입력하세요"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="pb-5">
                    <label
                      htmlFor="password-confirm"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      비밀번호 확인
                    </label>
                    <input
                      id="password-confirm"
                      name="password-confirm"
                      type="password"
                      autoComplete="new-password"
                      required
                      className="block w-full h-12 rounded-lg border-0 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-pink-500 focus:border-pink-500 focus:outline-none dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400 dark:focus:ring-pink-400 sm:text-sm sm:leading-6"
                      placeholder="비밀번호를 다시 입력하세요"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                    />
                    {passwordMatchMessage.text && (
                      <p
                        className={`mt-2 text-xs ${
                          passwordMatchMessage.color
                        } ${
                          passwordMatchMessage.color === 'text-green-500'
                            ? 'dark:text-green-400'
                            : 'dark:text-red-400'
                        }`}
                      >
                        {passwordMatchMessage.text}
                      </p>
                    )}
                    <ul className="mt-2 list-disc list-inside space-y-1">
                      <li
                        className={`${정책문구스타일} ${
                          passwordPolicy.length ? 충족스타일 : 미충족스타일
                        } ${
                          passwordPolicy.length
                            ? 'dark:text-green-400'
                            : 'dark:text-red-400'
                        }`}
                      >
                        총 8글자 이상
                      </li>
                      <li
                        className={`${정책문구스타일} ${
                          passwordPolicy.specialChar ? 충족스타일 : 미충족스타일
                        } ${
                          passwordPolicy.specialChar
                            ? 'dark:text-green-400'
                            : 'dark:text-red-400'
                        }`}
                      >
                        특수문자 1개 이상
                      </li>
                      <li
                        className={`${정책문구스타일} ${
                          passwordPolicy.uppercase ? 충족스타일 : 미충족스타일
                        } ${
                          passwordPolicy.uppercase
                            ? 'dark:text-green-400'
                            : 'dark:text-red-400'
                        }`}
                      >
                        영문자 1개 이상
                      </li>
                      <li
                        className={`${정책문구스타일} ${
                          passwordPolicy.number ? 충족스타일 : 미충족스타일
                        } ${
                          passwordPolicy.number
                            ? 'dark:text-green-400'
                            : 'dark:text-red-400'
                        }`}
                      >
                        숫자 1개 이상
                      </li>
                    </ul>
                  </div>
                </>
              )}

              <div className="pb-5">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  이름
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="block w-full h-12 rounded-lg border-0 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-pink-500 focus:border-pink-500 focus:outline-none dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400 dark:focus:ring-pink-400 sm:text-sm sm:leading-6"
                  placeholder="이름을 입력하세요"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={
                    signupType === 'KAKAO' && kakaoInfo.nickname !== undefined
                  }
                />
                {signupType === 'KAKAO' && kakaoInfo.nickname && (
                  <p className="mt-2 text-xs text-pink-500 dark:text-pink-400">
                    kakao에서 가져온 이름입니다.
                  </p>
                )}
              </div>

              <div className="pb-5">
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
                    className="flex-1 block w-full h-12 rounded-l-lg border-0 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-pink-500 focus:border-pink-500 focus:outline-none dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400 dark:focus:ring-pink-400 sm:text-sm sm:leading-6"
                  />
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(true)}
                    className="h-12 px-4 bg-pink-500 hover:bg-pink-600 text-white rounded-r-lg"
                  >
                    주소찾기
                  </button>
                </div>

                {addressError && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                    {addressError}
                  </p>
                )}

                {selectedAddress && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    <div>
                      <label
                        htmlFor="address-dong"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        동(빌딩)
                      </label>
                      <select
                        id="address-dong"
                        name="address-dong"
                        value={dong}
                        onChange={(e) => {
                          setDong(e.target.value);
                          setDongError('');
                        }}
                        required
                        className="block w-full h-12 rounded-lg border-0 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-pink-500 focus:border-pink-500 focus:outline-none dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400 dark:focus:ring-pink-400 sm:text-sm sm:leading-6"
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
                      {dongError && (
                        <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                          {dongError}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="address-ho"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        호수
                      </label>
                      <select
                        id="address-ho"
                        name="address-ho"
                        value={ho}
                        onChange={(e) => {
                          setHo(e.target.value);
                          setHoError('');
                        }}
                        required
                        className="block w-full h-12 rounded-lg border-0 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-pink-500 focus:border-pink-500 focus:outline-none dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400 dark:focus:ring-pink-400 sm:text-sm sm:leading-6"
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
                      {hoError && (
                        <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                          {hoError}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {signupType !== 'KAKAO' && (
                <div className="pb-5">
                  <label
                    htmlFor="phone-number"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    휴대폰 번호
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      id="phone-number"
                      name="phone-number"
                      type="tel"
                      autoComplete="tel"
                      required
                      className="block w-full h-12 rounded-lg border-0 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-pink-500 focus:border-pink-500 focus:outline-none dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-400 dark:focus:ring-pink-400 sm:text-sm sm:leading-6"
                      placeholder="휴대폰 번호를 입력하세요 (예: 01012345678)"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''));
                        setPhoneCheckMessage({ text: '', color: '' });
                      }}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={handlePhoneCheck}
                      className={`ml-2 px-4 h-12 border border-transparent text-sm font-semibold leading-6 text-white rounded-lg ${
                        isLoading ||
                        phoneCheckMessage.color === 'text-green-500'
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-pink-500 hover:bg-pink-600'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 whitespace-nowrap`}
                      disabled={
                        isLoading ||
                        phoneCheckMessage.color === 'text-green-500'
                      }
                    >
                      {isLoading
                        ? '확인중...'
                        : phoneCheckMessage.color === 'text-green-500'
                        ? '확인완료'
                        : '중복체크'}
                    </button>
                  </div>
                  {phoneCheckMessage.text && (
                    <p
                      className={`mt-2 text-xs ${phoneCheckMessage.color} ${
                        phoneCheckMessage.color === 'text-green-500'
                          ? 'dark:text-green-400'
                          : phoneCheckMessage.color === 'text-red-500'
                          ? 'dark:text-red-400'
                          : 'dark:text-gray-400'
                      }`}
                    >
                      {phoneCheckMessage.text}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                className={`flex w-full items-center justify-center rounded-lg px-3 h-12 border border-transparent text-sm font-semibold leading-6 text-white ${
                  !isLoading &&
                  (signupType === 'KAKAO'
                    ? emailId
                      ? emailVerificationStep === 'VERIFIED'
                      : true
                    : emailVerificationStep === 'VERIFIED')
                    ? 'bg-pink-500 hover:bg-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
                disabled={
                  isLoading ||
                  (emailId !== '' && emailVerificationStep !== 'VERIFIED')
                }
              >
                {isLoading ? '가입 처리중...' : '회원가입'}
              </button>
            </div>

            {signupType !== 'KAKAO' && (
              <>
                <div className="relative my-6">
                  <div className="flex items-center">
                    <div className="flex-grow h-px bg-gray-300 dark:bg-gray-600"></div>
                    <span className="px-2 text-gray-500 dark:text-gray-400 text-s">
                      또는
                    </span>
                    <div className="flex-grow h-px bg-gray-300 dark:bg-gray-600"></div>
                  </div>
                </div>

                <div>
                  <a
                    href={`${socialLoginForKakaoUrl}?redirectUrl=${redirectUrl}`}
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-center rounded-lg bg-yellow-400 px-3 h-12 text-sm font-semibold leading-6 text-black shadow-sm hover:bg-yellow-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400"
                      disabled={isLoading}
                    >
                      카카오톡으로 1초만에 시작하기
                    </button>
                  </a>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
