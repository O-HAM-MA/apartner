"use client";

import { useState } from "react";
import Link from "next/link";
import FindPasswordModal from "@/components/FindPasswordModal";

export default function FindPasswordPage() {
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // 모달을 닫으면 로그인 페이지로 리다이렉트
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-pink-50 p-4 sm:p-8 flex flex-col items-center dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white dark:bg-gray-800 p-10 shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            비밀번호 찾기
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            이메일 인증 후 새 비밀번호를 설정하세요.
          </p>
        </div>

        <div className="mt-4 flex justify-center">
          <Link
            href="/login"
            className="font-medium text-pink-500 dark:text-pink-400 hover:text-pink-400 dark:hover:text-pink-300"
          >
            로그인 페이지로 돌아가기
          </Link>
        </div>
      </div>

      <FindPasswordModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
}
