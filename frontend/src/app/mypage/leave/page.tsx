"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useGlobalLoginMember } from "@/auth/loginMember";
import { del } from "@/utils/api";

const LeavePage = () => {
  const router = useRouter();
  const { loginMember, clearLoginState, logout } = useGlobalLoginMember();

  // const userId = "devtestaiko49";
  const displayEmail = loginMember?.email || "이메일 정보 없음";

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [leaveReason, setLeaveReason] =
    React.useState("아이디 변경 / 재가입 목적");
  const [isAgreed, setIsAgreed] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleOpenModal = () => {
    if (!isAgreed) {
      alert("회원탈퇴에 동의해주세요.");
      return;
    }
    setError(null);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPassword("");
    setError(null);
  };

  const handleWithdraw = async () => {
    if (!password) {
      setError("비밀번호를 입력해주세요.");
      return;
    }
    setError(null);

    try {
      await del<void>("/api/v1/users/me/withdraw", {
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password, leaveReason }),
      });

      handleCloseModal();
      logout(() => router.push("/mypage/leave/success"));
    } catch (e: any) {
      console.error("Withdrawal error:", e);
      if (e.message && e.message.includes("400")) {
        const backendMessage = extractBackendErrorMessage(e.message);
        setError(backendMessage || "입력 정보를 다시 확인해주세요.");
      } else if (e.message && e.message.includes("401")) {
        setError("로그인이 필요합니다. 다시 로그인해주세요.");
      } else if (e.message && e.message.includes("404")) {
        setError("사용자 정보를 찾을 수 없습니다.");
      } else {
        setError(
          e.message ||
            "회원탈퇴 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        );
      }
    }
  };

  const extractBackendErrorMessage = (
    fullErrorMessage: string
  ): string | null => {
    const parts = fullErrorMessage.split(" - ");
    if (parts.length > 1) {
      return parts[parts.length - 1];
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-pink-50 p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white shadow-xl rounded-lg p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-pink-700">
            회원탈퇴
          </h1>
          <button
            onClick={() => router.back()}
            className="text-pink-500 hover:text-pink-700 text-2xl flex items-center justify-center"
          >
            <ArrowLeft size={24} />
          </button>
        </div>

        <div className="mb-6 bg-pink-100 p-4 rounded-md border border-pink-200">
          <p className="text-sm text-pink-700 mb-2">
            회원탈퇴 시 개인정보 및 Apartner에서 만들어진 모든 데이터는
            삭제됩니다.
          </p>
          <p className="text-xs text-pink-600 mb-4">
            (단, 아래 항목은 표기된 법률에 따라 특정 기간 동안 보관됩니다.)
          </p>
          <ul className="list-decimal list-inside text-xs text-pink-700 space-y-1">
            <li>
              계약 또는 청약철회 등에 관한 기록 보존 이유 : 전자상거래 등에서의
              소비자보호에 관한 법률 / 보존 기간 : 5년
            </li>
            <li>
              대금결제 및 재화 등의 공급에 관한 기록 보존 이유 : 전자상거래
              등에서의 소비자보호에 관한 법률 / 보존 기간 : 5년
            </li>
            <li>
              전자금융 거래에 관한 기록 보존 이유 : 전자금융거래법 보존 기간 /
              5년
            </li>
            <li>
              소비자의 불만 또는 분쟁처리에 관한 기록 보존 이유 : 전자상거래
              등에서의 소비자보호에 관한 법률 보존 기간 / 3년
            </li>
            <li>
              신용정보의 수집/처리 및 이용 등에 관한 기록 보존 이유 : 신용정보의
              이용 및 보호에 관한 법률 보존 기간 / 3년
            </li>
            <li>
              전자(세금)계산서 시스템 구축 운영하는 사업자가 지켜야 할 사항
              고시(국세청 고시 제 2016-3호) (전자세금계산서 사용자에 한함) : 5년
              <br />
              (단, (세금)계산서 내 개인식별번호는 3년 경과 후 파기)
            </li>
          </ul>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-pink-700 mb-2">유의사항</h2>
          <ul className="list-disc list-inside text-sm text-pink-600 space-y-1 bg-gray-50 p-4 rounded-md">
            <li>
              회원탈퇴 처리 후에는 회원님의 개인정보를 복원할 수 없으며,
              회원탈퇴 진행 시 해당 아이디는 영구적으로 삭제되어 재가입이
              불가합니다.
            </li>
            <li>소속된 회사가 존재할 경우, '탈퇴'회원으로 조회됩니다.</li>
            <li>
              회사가 Apartner 내에 존재하는 경우, 회사에 귀속된 데이터에
              대해서는 보관 됩니다.
            </li>
          </ul>
        </div>

        <div className="mb-6">
          <label
            htmlFor="탈퇴사유"
            className="block text-lg font-semibold text-pink-700 mb-2"
          >
            탈퇴사유
          </label>
          <select
            id="탈퇴사유"
            name="탈퇴사유"
            value={leaveReason}
            onChange={(e) => setLeaveReason(e.target.value)}
            className="w-full p-3 border border-pink-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 text-sm text-gray-700"
          >
            <option value="아이디 변경 / 재가입 목적">
              아이디 변경 / 재가입 목적
            </option>
            <option value="서비스 불만">서비스 불만</option>
            <option value="사용 빈도 낮음">사용 빈도 낮음</option>
            <option value="개인정보 유출 우려">개인정보 유출 우려</option>
            <option value="기타">기타</option>
          </select>
        </div>

        <div className="mb-8 flex items-center">
          <input
            id="동의"
            name="동의"
            type="checkbox"
            checked={isAgreed}
            onChange={(e) => setIsAgreed(e.target.checked)}
            className="h-4 w-4 text-pink-600 border-pink-300 rounded focus:ring-pink-500"
          />
          <label htmlFor="동의" className="ml-2 block text-sm text-pink-700">
            해당 내용을 모두 확인했으며, 회원탈퇴에 동의합니다.
          </label>
        </div>

        <button
          onClick={handleOpenModal}
          className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 px-4 rounded-md shadow-md transition duration-150 ease-in-out"
        >
          회원탈퇴
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-pink-700">
                비밀번호 재확인
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-pink-500 hover:text-pink-700 text-2xl"
              >
                &times;
              </button>
            </div>
            <p className="text-sm text-pink-600 mb-4">
              본인확인을 위해 비밀번호를 다시 한번 확인합니다. <br />
              본인확인 후 최종 회원탈퇴가 가능합니다.
            </p>
            <div className="mb-4">
              <label
                htmlFor="userIdDisplay"
                className="block text-sm font-medium text-pink-700 mb-1"
              >
                아이디 (이메일)
              </label>
              <input
                type="text"
                id="userIdDisplay"
                value={displayEmail}
                readOnly
                className="w-full p-2 border border-pink-300 rounded-md bg-pink-50 text-gray-500 text-sm"
              />
            </div>
            <div className="mb-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-pink-700 mb-1"
              >
                비밀번호
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요."
                  className="w-full p-2 pr-10 border border-pink-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 text-sm"
                />
              </div>
            </div>
            {error && (
              <p className="text-xs text-red-500 mb-4 text-center">{error}</p>
            )}
            <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0">
              <button
                onClick={handleCloseModal}
                className="w-full sm:w-auto px-4 py-2 border border-pink-300 text-pink-700 rounded-md hover:bg-pink-100 transition duration-150 ease-in-out"
              >
                취소
              </button>
              <button
                onClick={handleWithdraw}
                className="w-full sm:w-auto px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-md shadow-sm transition duration-150 ease-in-out"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeavePage;
