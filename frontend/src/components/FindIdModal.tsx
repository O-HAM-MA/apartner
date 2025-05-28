"use client";

import { useState } from "react";
import { post } from "@/utils/api";

interface FindIdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FindEmailResponse {
  email: string;
}

export default function FindIdModal({ isOpen, onClose }: FindIdModalProps) {
  const [name, setName] = useState("");
  const [phoneNum, setPhoneNum] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 이메일 마스킹 함수
  const maskEmail = (email: string): string => {
    const [id, domainPart] = email.split("@");
    const [domain, extension] = domainPart.split(".");

    // 아이디 부분: 앞 3글자만 표시하고 나머지는 *로 처리
    const maskedId = id.substring(0, 3) + "*".repeat(id.length - 3);

    // 도메인 부분: 앞 3글자만 표시하고 나머지는 *로 처리
    const maskedDomain = domain.substring(0, 3) + "*".repeat(domain.length - 3);

    return `${maskedId}@${maskedDomain}.${extension}`;
  };

  const handleFindId = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    if (!name) {
      setError("이름을 입력해주세요.");
      setIsLoading(false);
      return;
    }

    if (!phoneNum) {
      setError("휴대폰 번호를 입력해주세요.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await post<FindEmailResponse>(
        "/api/v1/auth/find-email",
        {
          userName: name,
          phoneNum: phoneNum,
        }
      );

      if (response && response.email) {
        setResult(maskEmail(response.email));
      } else {
        setError("일치하는 회원 정보를 찾을 수 없습니다.");
      }
    } catch (err) {
      console.error("아이디 찾기 오류:", err);
      setError("일치하는 회원 정보를 찾을 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          아이디(이메일) 찾기
        </h2>

        <form onSubmit={handleFindId}>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              이름
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="이름을 입력하세요"
              required
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="phoneNum"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              휴대폰 번호
            </label>
            <input
              id="phoneNum"
              type="text"
              value={phoneNum}
              onChange={(e) =>
                setPhoneNum(e.target.value.replace(/[^0-9]/g, ""))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="휴대폰 번호를 입력하세요 (예: 01012345678)"
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-2 bg-red-100 dark:bg-red-900 dark:bg-opacity-20 text-red-700 dark:text-red-300 rounded">
              {error}
            </div>
          )}

          {result && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 dark:bg-opacity-20 text-green-700 dark:text-green-300 rounded">
              <p className="font-medium">찾은 아이디:</p>
              <p className="text-lg">{result}</p>
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none"
            >
              닫기
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-pink-500 dark:bg-pink-600 text-white rounded hover:bg-pink-600 dark:hover:bg-pink-700 focus:outline-none disabled:opacity-50"
            >
              {isLoading ? "검색 중..." : "아이디 찾기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
