"use client";

import React, { useState, useEffect } from "react";
import { MdAccountCircle, MdEdit } from "react-icons/md";
import { useGlobalLoginMember } from "@/auth/loginMember";
import Image from "next/image";
import { get, post, patch } from "@/utils/api";
import { useRouter } from "next/navigation";

// 회원가입 페이지에서 사용된 타입들을 참고하여 정의 (실제 프로젝트에서는 공통 타입으로 분리하는 것이 좋음)
interface Apartment {
  id: number;
  name: string;
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
  const [emailId, setEmailId] = useState("");
  const [emailDomain, setEmailDomain] = useState("");
  const [customEmailDomain, setCustomEmailDomain] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [apartment, setApartment] = useState("");
  const [dong, setDong] = useState("");
  const [ho, setHo] = useState("");
  const [userName, setUserName] = useState("");

  // 이메일 인증 관련 상태
  const [originalEmail, setOriginalEmail] = useState("");
  const [emailCheckMessage, setEmailCheckMessage] = useState({
    text: "",
    color: "",
  });
  const [emailVerificationStep, setEmailVerificationStep] = useState<
    "NONE" | "CHECKED" | "CODE_SENT" | "VERIFIED" | "FAILED" | "NOT_CHANGED"
  >("NOT_CHANGED");
  const [verificationCode, setVerificationCode] = useState("");
  const [isSendCodeDisabled, setIsSendCodeDisabled] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState({
    text: "",
    color: "",
  });
  const [isEmailChanged, setIsEmailChanged] = useState(false);

  // 휴대폰 인증 관련 상태
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState("");
  const [phoneCheckMessage, setPhoneCheckMessage] = useState({
    text: "",
    color: "",
  });
  const [isPhoneNumberChanged, setIsPhoneNumberChanged] = useState(false);
  const [isPhoneChecked, setIsPhoneChecked] = useState(false); // 휴대폰 중복 확인 완료 여부

  const [isLoading, setIsLoading] = useState(false); // 공통 로딩 상태 (필요시 세분화)
  const [isLoadingEmailCheck, setIsLoadingEmailCheck] = useState(false);
  const [isLoadingSendCode, setIsLoadingSendCode] = useState(false);
  const [isLoadingVerifyCode, setIsLoadingVerifyCode] = useState(false);
  const [isLoadingPhoneCheck, setIsLoadingPhoneCheck] = useState(false);

  // 아파트, 동, 호수 데이터
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  const emailDomains = [
    "naver.com",
    "gmail.com",
    "daum.net",
    "hanmail.net",
    "직접 입력",
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
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    console.log(
      "[DEBUG] useEffect[loginMember, isEditMode] triggered. isEditMode:",
      isEditMode
    );
    if (loginMember) {
      setUserName(loginMember.userName || "");
      const currentFullEmail = loginMember.email || "";
      setOriginalEmail(currentFullEmail);
      if (currentFullEmail) {
        const [id, domain] = currentFullEmail.split("@");
        setEmailId(id || "");
        if (domain) {
          if (emailDomains.includes(domain)) {
            setEmailDomain(domain);
            setCustomEmailDomain("");
          } else {
            setEmailDomain("직접 입력");
            setCustomEmailDomain(domain);
          }
        } else {
          setEmailDomain(emailDomains[0]);
          setCustomEmailDomain("");
        }
      } else {
        setEmailId("");
        setEmailDomain(emailDomains[0]);
        setCustomEmailDomain("");
      }
      // 중요: isEditMode가 false일 때 (즉, 보기 모드로 전환될 때) 인증 상태를 완전히 초기화합니다.
      // isEditMode가 true일 때 (수정 모드 시작 시)도 동일하게 NOT_CHANGED로 시작합니다.
      setEmailVerificationStep("NOT_CHANGED");
      setEmailCheckMessage({ text: "", color: "" });
      setVerificationMessage({ text: "", color: "" });
      setVerificationCode("");
      setIsEmailChanged(false); // 수정 모드 시작 시 이메일 변경 없음으로 시작
      clearVerificationTimer(); // 타이머 정리

      const currentPhoneNumber = loginMember.phoneNum || "";
      setOriginalPhoneNumber(currentPhoneNumber);
      setPhoneNumber(currentPhoneNumber);
      setPhoneCheckMessage({ text: "", color: "" });
      setIsPhoneNumberChanged(false); // 수정 모드 시작 시 휴대폰 번호 변경 없음으로 시작
      setIsPhoneChecked(true); // 원래 번호는 체크된 것으로 간주

      setApartment(loginMember.apartmentName || "");
      setDong(loginMember.buildingName || "");
      setHo(loginMember.unitNumber || "");
    }
  }, [loginMember, isEditMode]); // isEditMode가 변경될 때마다 실행

  useEffect(() => {
    const fetchApartments = async () => {
      try {
        const response = await get<Apartment[]>("/api/v1/apartments");
        setApartments(response);
        if (
          loginMember?.apartmentName &&
          response.find((apt) => apt.name === loginMember.apartmentName)
        ) {
          setApartment(loginMember.apartmentName);
        } else if (response.length > 0) {
        }
      } catch (error) {
        console.error("아파트 목록 로드 실패:", error);
      }
    };
    if (isEditMode) {
      fetchApartments();
    }
  }, [isEditMode, loginMember?.apartmentName]);

  useEffect(() => {
    if (!apartment || !isEditMode) {
      setBuildings([]);
      setDong("");
      return;
    }
    const fetchBuildings = async () => {
      const selectedApartment = apartments.find(
        (apt) => apt.name === apartment
      );
      if (!selectedApartment) return;
      try {
        const response = await get<Building[]>(
          `/api/v1/apartments/${selectedApartment.id}/buildings`
        );
        setBuildings(response);
        // 수정 모드 진입 시 또는 아파트 변경 시 기존 동 정보 설정
        const initialDong =
          isEditMode &&
          loginMember?.buildingName &&
          response.find((b) => b.buildingNumber === loginMember.buildingName)
            ? loginMember.buildingName
            : "";
        setDong(initialDong);
        if (
          !initialDong &&
          response.length > 0 &&
          apartment === loginMember?.apartmentName
        ) {
          // 아파트가 같고, loginMember에 buildingName이 없거나 목록에 없는 경우, 빈값 유지 또는 첫번째 값 설정 안 함
        }
      } catch (error) {
        console.error("동 목록 로드 실패:", error);
      }
    };
    fetchBuildings();
  }, [
    apartment,
    apartments,
    isEditMode,
    loginMember?.apartmentName,
    loginMember?.buildingName,
  ]);

  useEffect(() => {
    if (!dong || !isEditMode) {
      setUnits([]);
      setHo("");
      return;
    }
    const fetchUnits = async () => {
      const selectedBuilding = buildings.find((b) => b.buildingNumber === dong);
      if (!selectedBuilding) return;
      try {
        const response = await get<Unit[]>(
          `/api/v1/apartments/buildings/${selectedBuilding.id}/units`
        );
        setUnits(response);
        // 수정 모드 진입 시 또는 동 변경 시 기존 호수 정보 설정
        const initialHo =
          isEditMode &&
          loginMember?.unitNumber &&
          response.find((u) => u.unitNumber === loginMember.unitNumber)
            ? loginMember.unitNumber
            : "";
        setHo(initialHo);
        if (
          !initialHo &&
          response.length > 0 &&
          dong === loginMember?.buildingName
        ) {
          // 동이 같고, loginMember에 unitNumber가 없거나 목록에 없는 경우, 빈값 유지 또는 첫번째 값 설정 안 함
        }
      } catch (error) {
        console.error("호수 목록 로드 실패:", error);
      }
    };
    fetchUnits();
  }, [
    dong,
    buildings,
    isEditMode,
    loginMember?.buildingName,
    loginMember?.unitNumber,
  ]);

  // 이메일 변경 감지
  useEffect(() => {
    console.log("[EFFECT] Email changed useEffect triggered. States:", {
      emailId,
      emailDomain,
      customEmailDomain,
      originalEmail,
      isEmailChanged,
      emailVerificationStep,
    });
    const fullEmail =
      emailDomain === "직접 입력"
        ? `${emailId}@${customEmailDomain}`
        : `${emailId}@${emailDomain}`;
    const changed = fullEmail.toLowerCase() !== originalEmail.toLowerCase();
    setIsEmailChanged(changed);
    if (changed) {
      setEmailVerificationStep("NONE");
      setEmailCheckMessage({ text: "", color: "" });
      setVerificationMessage({ text: "", color: "" });
      setVerificationCode("");
    } else {
      setEmailVerificationStep("NOT_CHANGED");
    }
  }, [emailId, emailDomain, customEmailDomain, originalEmail]);

  // 휴대폰 번호 변경 감지
  useEffect(() => {
    const changed = phoneNumber !== originalPhoneNumber;
    setIsPhoneNumberChanged(changed);
    if (changed) {
      setPhoneCheckMessage({ text: "", color: "" });
      setIsPhoneChecked(false);
    } else {
      setPhoneCheckMessage({ text: "", color: "" });
      setIsPhoneChecked(true);
    }
  }, [phoneNumber, originalPhoneNumber]);

  // "수정 완료" 버튼 활성화 조건
  const isSubmitDisabled =
    isLoading ||
    (isEmailChanged && emailVerificationStep !== "VERIFIED") ||
    (isPhoneNumberChanged && !isPhoneChecked);

  if (!isLogin || !loginMember) {
    return <div>로그인 정보가 없습니다.</div>;
  }

  const handleEditToggle = () => {
    console.log(
      "[DEBUG] handleEditToggle: CALLED. Current isEditMode:",
      isEditMode
    );
    // 이 함수는 정보 보기 모드에서 정보 수정 모드로 전환할 때만 사용됩니다.
    // (isEditMode가 false일 때만 "정보 수정" 버튼이 보이므로)
    setIsEditMode(true);
    console.log(
      "[DEBUG] handleEditToggle: FINISHED. isEditMode will be true in the next render."
    );
  };

  const handleCancel = () => {
    console.log(
      "[DEBUG] handleCancel: CALLED. Setting isEditMode to false and resetting states."
    );
    setIsEditMode(false);
    // isEditMode가 false로 바뀌면 위의 useEffect가 실행되어 모든 필드와 상태를 loginMember 기준으로 초기화합니다.
    // 추가적으로 즉시 정리해야 할 상태가 있다면 여기에 명시 (예: 타이머)
    clearVerificationTimer(); // 확실하게 타이머 정리
  };

  const handleEmailCheck = async () => {
    // 상태 초기화
    setEmailVerificationStep("NONE");
    setVerificationMessage({ text: "", color: "" });
    setVerificationCode("");
    clearVerificationTimer();
    setIsSendCodeDisabled(false);
    setEmailCheckMessage({
      text: "이메일 중복 확인 중...",
      color: "text-gray-500",
    });

    const fullEmail =
      emailDomain === "직접 입력"
        ? `${emailId}@${customEmailDomain}`
        : `${emailId}@${emailDomain}`;
    if (!emailId || (emailDomain === "직접 입력" && !customEmailDomain)) {
      setEmailCheckMessage({
        text: "이메일 주소를 입력해주세요.",
        color: "text-red-500",
      });
      return;
    }
    if (!isEmailChanged) {
      setEmailCheckMessage({
        text: "현재 이메일과 동일합니다. 변경 시에만 중복확인이 필요합니다.",
        color: "text-blue-500",
      });
      setEmailVerificationStep("NOT_CHANGED");
      return;
    }

    setIsLoadingEmailCheck(true);
    setEmailCheckMessage({ text: "", color: "" });
    setVerificationMessage({ text: "", color: "" });
    setEmailVerificationStep("NONE");

    try {
      await post<{ message: string }>("/api/v1/auth/check-email", {
        email: fullEmail,
      });
      setEmailCheckMessage({
        text: "사용 가능한 이메일입니다. 인증번호를 받아주세요.",
        color: "text-green-500",
      });
      setEmailVerificationStep("CHECKED");
    } catch (error: any) {
      const backendErrorMessage = error?.response?.data?.message;
      setEmailCheckMessage({
        text:
          backendErrorMessage ||
          "이미 사용중이거나 사용할 수 없는 이메일입니다.",
        color: "text-red-500",
      });
      setEmailVerificationStep("FAILED");
    } finally {
      setIsLoadingEmailCheck(false);
    }
  };

  const handleSendVerificationCode = async () => {
    if (
      emailVerificationStep !== "CHECKED" &&
      emailVerificationStep !== "FAILED"
    )
      return;

    // 기존 타이머 정리
    clearVerificationTimer();

    setIsSendCodeDisabled(true);
    setIsLoadingSendCode(true);
    setEmailCheckMessage({ text: "", color: "" });
    setVerificationMessage({
      text: "인증번호를 전송 중입니다...",
      color: "text-gray-500",
    });
    const fullEmail =
      emailDomain === "직접 입력"
        ? `${emailId}@${customEmailDomain}`
        : `${emailId}@${emailDomain}`;

    try {
      await post<{ message: string }>("/api/v1/auth/send-verification-code", {
        email: fullEmail,
      });
      setEmailVerificationStep("CODE_SENT");

      // 타이머 시작 (5분 = 300초)
      const timerDuration = 300;
      setRemainingTime(timerDuration);

      // 타이머 상태 메시지 설정
      setVerificationMessage({
        text: `✅ 인증번호가 발송되었습니다. 이메일을 확인해주세요. (유효시간: ${formatTime(
          timerDuration
        )})`,
        color: "text-green-500",
      });

      clearVerificationTimer(); // 기존 타이머가 있다면 명시적으로 정리
      const newTimer = setInterval(() => {
        setRemainingTime((prevTime) => {
          if (prevTime <= 1) {
            clearVerificationTimer();
            setIsSendCodeDisabled(false);
            setVerificationMessage({
              text: "인증번호 유효시간이 만료되었습니다. 재전송이 필요하면 '인증번호 재전송' 버튼을 클릭해주세요.",
              color: "text-blue-500", // 혹은 다른 원하는 색상
            });
            return 0;
          } else {
            // 인증 실패(FAILED) 상태가 아닐 때만 유효시간 메시지 업데이트
            if (emailVerificationStepRef.current !== "FAILED") {
              setVerificationMessage({
                text: `✅ 인증번호가 발송되었습니다. 이메일을 확인해주세요. (유효시간: ${formatTime(
                  prevTime - 1
                )})`,
                color: "text-green-500",
              });
            }
            return prevTime - 1;
          }
        });
      }, 1000);

      setVerificationTimer(newTimer);
    } catch (error: any) {
      setEmailVerificationStep("FAILED");
      const backendErrorMessage = error?.response?.data?.message;
      setVerificationMessage({
        text: `❌ ${backendErrorMessage || "인증번호 발송 실패"}`,
        color: "text-red-500",
      });
      setIsSendCodeDisabled(false);
    } finally {
      setIsLoadingSendCode(false);
    }
  };

  const handleVerifyCode = async () => {
    console.log("[HANDLE_VERIFY_CODE_START] States:", {
      emailId,
      emailDomain,
      customEmailDomain,
      originalEmail,
      isEmailChanged,
      emailVerificationStep,
      verificationCode,
    });
    if (
      emailVerificationStep !== "CODE_SENT" &&
      emailVerificationStep !== "FAILED"
    )
      return;
    if (!verificationCode) {
      setVerificationMessage({
        text: "인증번호를 입력해주세요.",
        color: "text-red-500",
      });
      return;
    }
    setIsLoadingVerifyCode(true);
    setEmailCheckMessage({ text: "", color: "" });
    setVerificationMessage({
      text: "인증번호를 확인 중입니다...",
      color: "text-gray-500",
    });
    const fullEmail =
      emailDomain === "직접 입력"
        ? `${emailId}@${customEmailDomain}`
        : `${emailId}@${emailDomain}`;

    try {
      const responseData = await post<{ message: string }>(
        "/api/v1/auth/verify-code",
        {
          email: fullEmail,
          code: verificationCode,
        }
      );
      // 인증 성공 시 타이머 정리
      clearVerificationTimer();
      setEmailVerificationStep("VERIFIED");
      setEmailCheckMessage({ text: "", color: "" });
      setVerificationMessage({
        text: responseData.message || "✅ 인증번호가 일치합니다.",
        color: "text-green-500",
      });
      console.log("[HANDLE_VERIFY_CODE_SUCCESS] States after VERIFIED:", {
        emailId,
        emailDomain,
        customEmailDomain,
        originalEmail,
        isEmailChanged,
        emailVerificationStep: "VERIFIED", // 실제 상태 반영 전이므로 문자열로 표시
      });
    } catch (error: any) {
      // 인증 실패 시 FAILED 상태로 설정하여 UI 유지
      setEmailVerificationStep("FAILED");
      const backendErrorMessage = error?.response?.data?.message;
      setVerificationMessage({
        text: `❌ ${
          backendErrorMessage ||
          "인증번호가 일치하지 않습니다. 다시 확인해주세요."
        }`,
        color: "text-red-500", // 오류 메시지는 빨간색으로 표시
      });
      setEmailCheckMessage({ text: "", color: "" }); // 중복 확인 메시지 초기화
      console.log("[HANDLE_VERIFY_CODE_FAIL] States after FAILED:", {
        emailId,
        emailDomain,
        customEmailDomain,
        originalEmail,
        isEmailChanged,
        emailVerificationStep: "FAILED", // 실제 상태 반영 전이므로 문자열로 표시
        error,
      });
      // 인증 실패 시에도 타이머는 계속 유지
      // verificationCode는 초기화하지 않고 유지하여 사용자가 수정할 수 있게 함
    } finally {
      setIsLoadingVerifyCode(false);
      console.log("[HANDLE_VERIFY_CODE_END] States in finally:", {
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
        text: "휴대폰 번호를 입력해주세요.",
        color: "text-red-500",
      });
      return;
    }
    if (!/^\d{10,11}$/.test(phoneNumber)) {
      setPhoneCheckMessage({
        text: "유효하지 않은 휴대폰 번호 형식입니다.",
        color: "text-red-500",
      });
      return;
    }
    if (!isPhoneNumberChanged) {
      setPhoneCheckMessage({
        text: "현재 휴대폰 번호와 동일합니다.",
        color: "text-blue-500",
      });
      setIsPhoneChecked(true);
      return;
    }

    setIsLoadingPhoneCheck(true);
    setPhoneCheckMessage({ text: "", color: "" });
    try {
      await post<{ message: string }>("/api/v1/auth/check-phone", {
        phoneNumber,
      });
      setPhoneCheckMessage({
        text: "사용 가능한 휴대폰 번호입니다.",
        color: "text-green-500",
      });
      setIsPhoneChecked(true);
    } catch (error: any) {
      const backendErrorMessage = error?.response?.data?.message;
      setPhoneCheckMessage({
        text:
          backendErrorMessage || "이미 등록되었거나 사용할 수 없는 번호입니다.",
        color: "text-red-500",
      });
      setIsPhoneChecked(false);
    } finally {
      setIsLoadingPhoneCheck(false);
    }
  };

  const handleSubmit = async () => {
    if (!isEditMode) {
      console.warn(
        "[DEBUG] handleSubmit: CALLED when not in edit mode. Aborting."
      );
      return;
    }
    console.log("[DEBUG] handleSubmit: CALLED in edit mode.");

    if (isEmailChanged && emailVerificationStep !== "VERIFIED") {
      alert("변경된 이메일의 인증을 완료해주세요.");
      return;
    }
    if (isPhoneNumberChanged && !isPhoneChecked) {
      alert("변경된 휴대폰 번호의 중복 확인을 완료해주세요.");
      return;
    }

    if (!confirm("정보를 수정하시겠습니까?")) {
      console.log("[DEBUG] handleSubmit: User cancelled information update.");
      return;
    }
    console.log("[DEBUG] handleSubmit: User confirmed information update.");
    setIsLoading(true);

    const selectedApartmentObj = apartments.find(
      (apt) => apt.name === apartment
    );
    const selectedBuildingObj = buildings.find(
      (b) => b.buildingNumber === dong
    );
    const selectedUnitObj = units.find((u) => u.unitNumber === ho);

    if (!selectedApartmentObj || !selectedBuildingObj || !selectedUnitObj) {
      alert("주소 정보를 올바르게 선택해주세요.");
      setIsLoading(false);
      return;
    }

    const updatedData: any = {
      userName: userName,
      apartmentId: selectedApartmentObj.id,
      buildingId: selectedBuildingObj.id,
      unitId: selectedUnitObj.id,
    };

    if (isEmailChanged && emailVerificationStep === "VERIFIED") {
      const fullEmail =
        emailDomain === "직접 입력"
          ? `${emailId}@${customEmailDomain}`
          : `${emailId}@${emailDomain}`;
      updatedData.email = fullEmail;
    }
    if (isPhoneNumberChanged && isPhoneChecked) {
      updatedData.phoneNum = phoneNumber;
    }

    try {
      await patch("/api/v1/myInfos/update", updatedData);
      alert("정보가 성공적으로 수정되었습니다.");
      setIsEditMode(false);
      if (setLoginMember && loginMember) {
        const newEmail =
          isEmailChanged && emailVerificationStep === "VERIFIED"
            ? emailDomain === "직접 입력"
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
      console.error("정보 수정 실패:", error);
      alert(
        `정보 수정에 실패했습니다: ${
          error.message || "알 수 없는 오류가 발생했습니다."
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 이메일 인증 UI를 보여줄지 결정하는 변수 - FAILED 상태일 때도 UI가 표시되도록 함
  const showEmailVerificationProcessUI =
    isEmailChanged && // 이메일이 변경된 경우에만 전체 프로세스 UI를 보여줌
    (emailVerificationStep === "CHECKED" ||
      emailVerificationStep === "CODE_SENT" ||
      emailVerificationStep === "FAILED" ||
      emailVerificationStep === "VERIFIED"); // VERIFIED 상태 추가

  // 이메일 관련 입력 필드들의 비활성화 여부 결정 변수
  const emailRelatedInputsDisabled =
    isLoadingEmailCheck ||
    isLoadingSendCode ||
    isLoadingVerifyCode ||
    isLoading;

  return (
    <>
      <div className="min-h-screen bg-pink-50 p-4 sm:p-8 flex flex-col items-center dark:bg-gray-900">
        <div className="max-w-2xl w-full">
          <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-xl overflow-hidden">
            <div className="p-6 md:p-8">
              <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-10">
                마이페이지
              </h2>

              {/* 프로필 이미지 섹션 */}
              {!isEditMode && (
                <div className="flex flex-col items-center mb-10">
                  <div className="relative group">
                    {loginMember.profileImageUrl ? (
                      <Image
                        src={loginMember.profileImageUrl}
                        alt={loginMember.userName || "Profile"}
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
                    e.preventDefault(); // 기본 폼 제출 방지
                    console.log(
                      "[DEBUG] Form onSubmit: Default prevented. handleSubmit will be called by button click."
                    );
                    // 이 핸들러에서는 handleSubmit을 호출하지 않습니다.
                  }}
                  className="space-y-6"
                >
                  <div>
                    <label
                      htmlFor="userName"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
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
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      이메일{" "}
                      {isEmailChanged &&
                        emailVerificationStep !== "VERIFIED" &&
                        "(변경 시 인증 필요)"}
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
                          // 이메일 변경 시 관련 상태 초기화
                          setEmailCheckMessage({ text: "", color: "" });
                          setEmailVerificationStep("NONE");
                          setVerificationMessage({ text: "", color: "" });
                          setVerificationCode("");
                        }}
                        disabled={emailRelatedInputsDisabled}
                      />
                      <span className="text-gray-500 dark:text-gray-400">
                        @
                      </span>
                      {emailDomain === "직접 입력" ? (
                        <input
                          type="text"
                          required
                          className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm h-11"
                          placeholder="도메인 입력"
                          value={customEmailDomain}
                          onChange={(e) => {
                            setCustomEmailDomain(e.target.value);
                            setEmailCheckMessage({ text: "", color: "" });
                            setEmailVerificationStep("NONE");
                            setVerificationMessage({ text: "", color: "" });
                            setVerificationCode("");
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
                            if (e.target.value !== "직접 입력")
                              setCustomEmailDomain("");
                            setEmailCheckMessage({ text: "", color: "" });
                            setEmailVerificationStep("NONE");
                            setVerificationMessage({ text: "", color: "" });
                            setVerificationCode("");
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
                        emailVerificationStep !== "VERIFIED" &&
                        emailVerificationStep !== "CHECKED" &&
                        emailVerificationStep !== "CODE_SENT" &&
                        emailVerificationStep !== "FAILED" && (
                          <button
                            type="button"
                            onClick={handleEmailCheck}
                            className={`ml-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white whitespace-nowrap ${
                              isLoadingEmailCheck
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700"
                            } focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500`}
                            disabled={
                              isLoadingEmailCheck ||
                              isLoadingSendCode ||
                              isLoadingVerifyCode ||
                              isLoading
                            }
                          >
                            {isLoadingEmailCheck ? "확인중..." : "중복확인"}
                          </button>
                        )}
                    </div>
                    {emailCheckMessage.text && (
                      <p
                        className={`mt-2 text-xs ${emailCheckMessage.color} ${
                          emailCheckMessage.color === "text-green-500"
                            ? "dark:text-green-400"
                            : emailCheckMessage.color === "text-red-500"
                            ? "dark:text-red-400"
                            : emailCheckMessage.color === "text-blue-500"
                            ? "dark:text-blue-400"
                            : emailCheckMessage.color === "text-gray-500"
                            ? "dark:text-gray-400"
                            : ""
                        }`}
                      >
                        {emailCheckMessage.text}
                      </p>
                    )}
                    {showEmailVerificationProcessUI && (
                      <>
                        {/* VERIFIED 상태가 아닐 때만 입력 필드 및 버튼 표시 */}
                        {emailVerificationStep !== "VERIFIED" && (
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
                            {/* 인증번호 전송 또는 재전송 버튼 - CHECKED 또는 FAILED 상태일 때 표시 */}
                            {(emailVerificationStep === "CHECKED" ||
                              emailVerificationStep === "FAILED") && (
                              <button
                                type="button"
                                onClick={handleSendVerificationCode}
                                className={`ml-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white whitespace-nowrap ${
                                  isSendCodeDisabled || isLoadingSendCode
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-indigo-600 hover:bg-indigo-700"
                                } focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500`}
                                disabled={
                                  isSendCodeDisabled ||
                                  isLoadingSendCode ||
                                  isLoadingVerifyCode ||
                                  isLoading
                                }
                              >
                                {isLoadingSendCode
                                  ? "전송중..."
                                  : isSendCodeDisabled
                                  ? "재전송 대기"
                                  : emailVerificationStep === "FAILED"
                                  ? "인증번호 재전송"
                                  : "인증번호 받기"}
                              </button>
                            )}
                            {/* 인증번호 확인 버튼 - CODE_SENT 또는 FAILED 상태일 때도 표시 */}
                            {(emailVerificationStep === "CODE_SENT" ||
                              emailVerificationStep === "FAILED") && (
                              <button
                                type="button"
                                onClick={handleVerifyCode}
                                className={`ml-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white whitespace-nowrap ${
                                  verificationCode.length === 0 ||
                                  isLoadingVerifyCode
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700"
                                } focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500`}
                                disabled={
                                  verificationCode.length === 0 ||
                                  isLoadingVerifyCode ||
                                  isLoadingSendCode ||
                                  isLoading
                                }
                              >
                                {isLoadingVerifyCode
                                  ? "확인중..."
                                  : "인증번호 확인"}
                              </button>
                            )}
                          </div>
                        )}
                        {/* 인증번호 관련 메시지 (성공, 실패, 안내 등) */}
                        {verificationMessage.text && (
                          <p
                            className={`mt-2 text-xs ${
                              verificationMessage.color
                            } ${
                              verificationMessage.color === "text-green-500"
                                ? "dark:text-green-400"
                                : verificationMessage.color === "text-red-500"
                                ? "dark:text-red-400"
                                : verificationMessage.color === "text-blue-500"
                                ? "dark:text-blue-400"
                                : verificationMessage.color === "text-gray-500"
                                ? "dark:text-gray-400"
                                : ""
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
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      연락처{" "}
                      {isPhoneNumberChanged &&
                        !isPhoneChecked &&
                        "(변경 시 중복확인 필요)"}
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
                          setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""));
                          // 휴대폰 번호 변경 시 관련 상태 초기화
                          setPhoneCheckMessage({ text: "", color: "" });
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
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-indigo-600 hover:bg-indigo-700"
                          } focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500`}
                          disabled={
                            isLoadingPhoneCheck || isPhoneChecked || isLoading
                          }
                        >
                          {isLoadingPhoneCheck ? "확인중..." : "중복확인"}
                        </button>
                      )}
                    </div>
                    {phoneCheckMessage.text && (
                      <p
                        className={`mt-2 text-xs ${phoneCheckMessage.color} ${
                          phoneCheckMessage.color === "text-green-500"
                            ? "dark:text-green-400"
                            : phoneCheckMessage.color === "text-red-500"
                            ? "dark:text-red-400"
                            : phoneCheckMessage.color === "text-blue-500"
                            ? "dark:text-blue-400"
                            : phoneCheckMessage.color === "text-gray-500"
                            ? "dark:text-gray-400"
                            : ""
                        }`}
                      >
                        {phoneCheckMessage.text}
                      </p>
                    )}
                  </div>

                  {/* 주소 수정 */}
                  <div>
                    <label
                      htmlFor="address-apartment"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      주소
                    </label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <select
                        id="address-apartment"
                        name="address-apartment"
                        value={apartment}
                        onChange={(e) => setApartment(e.target.value)}
                        required
                        className="appearance-none rounded-md relative block w-full sm:w-auto flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm h-11"
                        disabled={isLoading}
                      >
                        <option value="" disabled>
                          아파트 선택
                        </option>
                        {apartments.map((apt) => (
                          <option key={apt.id} value={apt.name}>
                            {apt.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center w-full sm:w-auto">
                        <select
                          id="address-dong"
                          name="address-dong"
                          value={dong}
                          onChange={(e) => setDong(e.target.value)}
                          required
                          disabled={
                            !apartment || buildings.length === 0 || isLoading
                          }
                          className="appearance-none rounded-md relative block w-full flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm h-11"
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
                        <span className="ml-1 mr-2 text-sm text-gray-700 dark:text-gray-300">
                          동
                        </span>
                      </div>
                      <div className="flex items-center w-full sm:w-auto">
                        <select
                          id="address-ho"
                          name="address-ho"
                          value={ho}
                          onChange={(e) => setHo(e.target.value)}
                          required
                          disabled={!dong || units.length === 0 || isLoading}
                          className="appearance-none rounded-md relative block w-full flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm h-11"
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
                        <span className="ml-1 text-sm text-gray-700 dark:text-gray-300">
                          호
                        </span>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: "이름", value: loginMember.userName },
                    {
                      label: "이메일",
                      value: loginMember.email || "이메일 정보가 없습니다.",
                    },
                    {
                      label: "연락처",
                      value: loginMember.phoneNum || "연락처 정보가 없습니다.",
                    },
                    {
                      label: "주소",
                      value: loginMember.apartmentName
                        ? `${loginMember.apartmentName} ${
                            loginMember.buildingName || ""
                          }${loginMember.buildingName ? "동" : ""} ${
                            loginMember.unitNumber || ""
                          }${loginMember.unitNumber ? "호" : ""}`.trim()
                        : "주소 정보가 없습니다.",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                    >
                      <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 sm:w-1/3">
                        {item.label}
                      </dt>
                      <dd className="mt-1 text-md text-slate-800 dark:text-slate-200 sm:mt-0 sm:w-2/3 sm:text-right">
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
                      type="button" // type="button"으로 변경
                      onClick={() => {
                        // onClick으로 handleSubmit 호출
                        console.log(
                          "[DEBUG] '수정 완료' button clicked. Calling handleSubmit..."
                        );
                        handleSubmit();
                      }}
                      className={`w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-semibold rounded-lg shadow-md text-white ${
                        isSubmitDisabled
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
                      } focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-400 transition-all duration-300 transform hover:scale-105`}
                      disabled={isSubmitDisabled}
                    >
                      {isLoading ? "수정 중..." : "수정 완료"}
                    </button>
                    <button
                      type="button" // "취소" 버튼
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
                      type="button" // "정보 수정" 버튼
                      onClick={handleEditToggle}
                      className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-semibold rounded-lg shadow-md text-white bg-pink-500 hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-pink-400 transition-all duration-300 transform hover:scale-105"
                    >
                      정보 수정
                    </button>
                    {loginMember && loginMember.socialProvider === null && (
                      <button
                        type="button" // "비밀번호 변경" 버튼
                        onClick={() => router.push("/mypage/editPassword")}
                        className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-slate-300 dark:border-slate-600 text-base font-semibold rounded-lg shadow-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-gray-700 hover:bg-slate-50 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-pink-400 transition-all duration-300 transform hover:scale-105"
                      >
                        비밀번호 변경
                      </button>
                    )}
                    {/* 회원탈퇴 버튼 추가 */}
                    {!isEditMode && (
                      <button
                        type="button"
                        onClick={() => router.push("/mypage/leave")}
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
    </>
  );
};

export default MyPage;
