"use client";

import { useState, useEffect, useRef } from "react";
import { post } from "@/utils/api";
import { useRouter } from "next/navigation";

interface FindPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FindPasswordModal({
  isOpen,
  onClose,
}: FindPasswordModalProps) {
  // 단계 관리
  const [step, setStep] = useState<
    "EMAIL_INPUT" | "VERIFICATION" | "PASSWORD_RESET" | "COMPLETE"
  >("EMAIL_INPUT");

  // 이메일 관련 상태
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [emailMessage, setEmailMessage] = useState({ text: "", color: "" });
  const [verificationMessage, setVerificationMessage] = useState({
    text: "",
    color: "",
  });

  // 비밀번호 관련 상태
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordPolicy, setPasswordPolicy] = useState({
    length: false,
    specialChar: false,
    uppercase: false,
    number: false,
  });
  const [passwordMatchMessage, setPasswordMatchMessage] = useState({
    text: "",
    color: "",
  });

  // 타이머 관련 상태
  const [remainingTime, setRemainingTime] = useState(0);
  const [verificationTimer, setVerificationTimer] =
    useState<NodeJS.Timeout | null>(null);
  const [isSendCodeDisabled, setIsSendCodeDisabled] = useState(false);

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);

  // 현재 단계를 Ref로 관리하여 setInterval 내에서 최신 값 참조
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  // 비밀번호 정책 체크
  useEffect(() => {
    if (newPassword) {
      setPasswordPolicy({
        length: newPassword.length >= 8,
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
        uppercase: /[a-zA-Z]/.test(newPassword),
        number: /[0-9]/.test(newPassword),
      });
    }

    if (newPassword && confirmPassword) {
      if (newPassword === confirmPassword) {
        setPasswordMatchMessage({
          text: "비밀번호가 일치합니다.",
          color: "text-green-500",
        });
      } else {
        setPasswordMatchMessage({
          text: "비밀번호가 일치하지 않습니다.",
          color: "text-red-500",
        });
      }
    } else {
      setPasswordMatchMessage({ text: "", color: "" });
    }
  }, [newPassword, confirmPassword]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => clearVerificationTimer();
  }, []);

  // 타이머 정리 함수
  const clearVerificationTimer = () => {
    if (verificationTimer) {
      clearInterval(verificationTimer);
      setVerificationTimer(null);
    }
  };

  // 시간 포맷팅 함수 (mm:ss 형태로 변환)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // 이메일 인증 코드 전송
  const handleSendVerificationCode = async () => {
    // 이메일 유효성 검사
    if (!email) {
      setEmailMessage({
        text: "이메일을 입력해주세요.",
        color: "text-red-500",
      });
      return;
    }

    // 기존 타이머 정리
    clearVerificationTimer();
    setIsSendCodeDisabled(true);
    setIsLoading(true);
    setEmailMessage({ text: "", color: "" });
    setVerificationMessage({
      text: "인증번호를 전송 중입니다...",
      color: "text-gray-500",
    });

    try {
      // 이메일 인증 코드 전송 API 호출
      const responseData = await post<{ message: string }>(
        "/api/v1/auth/send-verification-code",
        { email }
      );

      setStep("VERIFICATION");
      const timerDuration = 300; // 5분
      setRemainingTime(timerDuration);
      setVerificationMessage({
        text: `✅ 인증번호가 발송되었습니다. 이메일을 확인해주세요. (유효시간: ${formatTime(
          timerDuration
        )})`,
        color: "text-green-500",
      });

      // 타이머 설정
      const newTimer = setInterval(() => {
        setRemainingTime((prevTime) => {
          if (prevTime <= 1) {
            clearVerificationTimer();
            setIsSendCodeDisabled(false);
            setVerificationMessage({
              text: "인증번호 유효시간이 만료되었습니다. 재전송이 필요하면 '인증번호 재전송' 버튼을 클릭해주세요.",
              color: "text-blue-500",
            });
            return 0;
          } else {
            setVerificationMessage({
              text: `✅ 인증번호가 발송되었습니다. 이메일을 확인해주세요. (유효시간: ${formatTime(
                prevTime - 1
              )})`,
              color: "text-green-500",
            });
            return prevTime - 1;
          }
        });
      }, 1000);
      setVerificationTimer(newTimer);
    } catch (error: any) {
      console.error("인증번호 전송 오류:", error);
      const backendErrorMessage = error?.response?.data?.message;
      setVerificationMessage({
        text: `❌ ${
          backendErrorMessage || error.message || "인증번호 발송 실패"
        }`,
        color: "text-red-500",
      });
      setIsSendCodeDisabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 인증 코드 확인
  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setVerificationMessage({
        text: "인증번호를 입력해주세요.",
        color: "text-red-500",
      });
      return;
    }

    setIsLoading(true);
    setVerificationMessage({
      text: "인증번호를 확인 중입니다...",
      color: "text-gray-500",
    });

    try {
      // 인증 코드 확인 API 호출
      const responseData = await post<{ message: string }>(
        "/api/v1/auth/verify-code",
        {
          email,
          code: verificationCode,
        }
      );

      clearVerificationTimer();
      setStep("PASSWORD_RESET");
      setVerificationMessage({
        text: responseData.message || "✅ 인증번호가 일치합니다.",
        color: "text-green-500",
      });
    } catch (error: any) {
      console.error("인증번호 확인 오류:", error);
      const backendErrorMessage = error?.response?.data?.message;
      setVerificationMessage({
        text: `❌ ${
          backendErrorMessage ||
          "인증번호가 일치하지 않습니다. 다시 확인해주세요."
        }`,
        color: "text-red-500",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 비밀번호 재설정
  const handleResetPassword = async () => {
    // 비밀번호 정책 및 일치 여부 확인
    const { length, specialChar, uppercase, number } = passwordPolicy;
    if (!length || !specialChar || !uppercase || !number) {
      setPasswordMatchMessage({
        text: "비밀번호는 8자 이상이며, 영문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.",
        color: "text-red-500",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMatchMessage({
        text: "비밀번호가 일치하지 않습니다.",
        color: "text-red-500",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 비밀번호 재설정 API 호출
      const responseData = await post<{ message: string }>(
        "/api/v1/auth/reset-password",
        {
          email,
          password: newPassword,
          confirmPassword,
          verificationCode,
        }
      );

      setStep("COMPLETE");
    } catch (error: any) {
      console.error("비밀번호 재설정 오류:", error);
      const backendErrorMessage = error?.response?.data?.message;
      setPasswordMatchMessage({
        text: `❌ ${backendErrorMessage || "비밀번호 재설정 실패"}`,
        color: "text-red-500",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // 모달 내용 렌더링 (각 단계별로)
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          비밀번호 찾기
        </h2>

        {/* 이메일 입력 단계 */}
        {step === "EMAIL_INPUT" && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              가입 시 등록한 이메일을 입력하시면 인증번호를 보내드립니다.
            </p>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="이메일을 입력하세요"
                required
                disabled={isLoading}
              />
              {emailMessage.text && (
                <p className={`mt-2 text-xs ${emailMessage.color}`}>
                  {emailMessage.text}
                </p>
              )}
            </div>
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none"
                disabled={isLoading}
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleSendVerificationCode}
                className={`px-4 py-2 bg-pink-500 dark:bg-pink-600 text-white rounded hover:bg-pink-600 dark:hover:bg-pink-700 focus:outline-none disabled:opacity-50`}
                disabled={isLoading}
              >
                {isLoading ? "처리 중..." : "인증번호 받기"}
              </button>
            </div>
          </div>
        )}

        {/* 인증번호 확인 단계 */}
        {step === "VERIFICATION" && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              이메일로 전송된 인증번호를 입력해주세요.
            </p>
            <div className="mb-4">
              <label
                htmlFor="verification-code"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                인증번호
              </label>
              <div className="flex items-center space-x-2">
                <input
                  id="verification-code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="인증번호를 입력하세요"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={handleSendVerificationCode}
                  className={`px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                    isSendCodeDisabled || isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 whitespace-nowrap`}
                  disabled={isSendCodeDisabled || isLoading}
                >
                  {isLoading && isSendCodeDisabled
                    ? "전송중..."
                    : isSendCodeDisabled
                    ? "재전송 대기"
                    : "재전송"}
                </button>
              </div>
              {verificationMessage.text && (
                <p className={`mt-2 text-xs ${verificationMessage.color}`}>
                  {verificationMessage.text}
                </p>
              )}
            </div>
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none"
                disabled={isLoading}
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleVerifyCode}
                className={`px-4 py-2 bg-pink-500 dark:bg-pink-600 text-white rounded hover:bg-pink-600 dark:hover:bg-pink-700 focus:outline-none disabled:opacity-50`}
                disabled={isLoading || !verificationCode}
              >
                {isLoading ? "확인 중..." : "인증 확인"}
              </button>
            </div>
          </div>
        )}

        {/* 비밀번호 재설정 단계 */}
        {step === "PASSWORD_RESET" && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              새로운 비밀번호를 설정해주세요.
            </p>
            <div className="mb-4">
              <label
                htmlFor="new-password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                새 비밀번호
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="새 비밀번호를 입력하세요"
                required
                disabled={isLoading}
              />
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li
                  className={`text-xs ${
                    passwordPolicy.length
                      ? "text-green-500 dark:text-green-400"
                      : "text-red-500 dark:text-red-400"
                  }`}
                >
                  총 8글자 이상
                </li>
                <li
                  className={`text-xs ${
                    passwordPolicy.uppercase
                      ? "text-green-500 dark:text-green-400"
                      : "text-red-500 dark:text-red-400"
                  }`}
                >
                  영문자 1개 이상
                </li>
                <li
                  className={`text-xs ${
                    passwordPolicy.number
                      ? "text-green-500 dark:text-green-400"
                      : "text-red-500 dark:text-red-400"
                  }`}
                >
                  숫자 1개 이상
                </li>
                <li
                  className={`text-xs ${
                    passwordPolicy.specialChar
                      ? "text-green-500 dark:text-green-400"
                      : "text-red-500 dark:text-red-400"
                  }`}
                >
                  특수문자 1개 이상
                </li>
              </ul>
            </div>
            <div className="mb-4">
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                새 비밀번호 확인
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="새 비밀번호를 다시 입력하세요"
                required
                disabled={isLoading}
              />
              {passwordMatchMessage.text && (
                <p className={`mt-2 text-xs ${passwordMatchMessage.color}`}>
                  {passwordMatchMessage.text}
                </p>
              )}
            </div>
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={() => setStep("VERIFICATION")}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none"
                disabled={isLoading}
              >
                이전
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                className={`px-4 py-2 bg-pink-500 dark:bg-pink-600 text-white rounded hover:bg-pink-600 dark:hover:bg-pink-700 focus:outline-none disabled:opacity-50`}
                disabled={isLoading || !newPassword || !confirmPassword}
              >
                {isLoading ? "처리 중..." : "비밀번호 재설정"}
              </button>
            </div>
          </div>
        )}

        {/* 완료 단계 */}
        {step === "COMPLETE" && (
          <div>
            <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 dark:bg-opacity-20 text-green-700 dark:text-green-300 rounded text-center">
              <svg
                className="w-12 h-12 mx-auto text-green-500 dark:text-green-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p className="font-medium text-lg">
                비밀번호가 재설정되었습니다.
              </p>
              <p className="text-sm mt-2">새 비밀번호로 로그인해주세요.</p>
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  // 로그인 페이지로 이동
                  window.location.href = "/login";
                }}
                className="px-6 py-2 bg-pink-500 dark:bg-pink-600 text-white rounded hover:bg-pink-600 dark:hover:bg-pink-700 focus:outline-none"
              >
                로그인 페이지로 이동
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
