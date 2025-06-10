"use client";
import { useState, useEffect } from "react";
import type React from "react";

import {
  Play,
  Square,
  User,
  Tag,
  ArrowLeft,
  BellRing,
  Save,
  X,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import Sidebar from "@/components/sidebar";
import { useGlobalLoginMember } from "@/auth/loginMember";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";

interface InspectionFormProps {
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
}

export default function InspectionForm({
  onSubmit,
  onCancel,
}: InspectionFormProps) {
  const { loginMember } = useGlobalLoginMember();
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    type: "소방",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    assignee: "",
    detail: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [types, setTypes] = useState<{ type_id: number; typeName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, detail: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 날짜와 시간 합치기 (ISO 8601 형식)
      const startAt = `${formData.startDate}T${formData.startTime}`;
      const finishAt = `${formData.endDate}T${formData.endTime}`;

      // 시작 시간과 종료 시간 비교 유효성 검사
      const startDateObj = new Date(startAt);
      const finishDateObj = new Date(finishAt);

      if (finishDateObj <= startDateObj) {
        alert("점검 종료 시간은 점검 시작 시간보다 늦어야 합니다.");
        setIsSubmitting(false);
        return; // 제출 중단
      }

      // HTML에서 텍스트 추출
      const parser = new DOMParser();
      const doc = parser.parseFromString(formData.detail, 'text/html');
      const plainTextDetail = doc.body.textContent || "";

      const requestBody = {
        startAt,
        finishAt,
        title: formData.title,
        detail: plainTextDetail,
        type: formData.type,
        userName: formData.assignee,
      };

      // API 호출
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/inspection/manager/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        credentials: "include",
      });

      if (!res.ok) {
        let errorMessage = "점검 등록에 실패했습니다.";
        try {
          const text = await res.text();
          if (text) {
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorMessage;
          }
        } catch (e) {
          // 파싱 에러 무시
        }
        throw new Error(errorMessage);
      }

      // 성공 처리
      if (onSubmit) {
        onSubmit(requestBody);
      }
      router.push("/admin/inspections?success=1");
    } catch (error: any) {
      console.error("Error submitting inspection:", error);
      alert(error.message || "점검 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "CHECKED":
        return {
          bgColor: "bg-green-100 dark:bg-green-900/30",
          textColor: "text-green-800 dark:text-green-300",
          icon: <CheckCircle size={16} className="mr-1" />,
          text: "정상 완료",
        };
      case "PENDING":
        return {
          bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
          textColor: "text-yellow-800 dark:text-yellow-300",
          icon: <Play size={16} className="mr-1" />,
          text: "진행 중",
        };
      case "NOTYET":
        return {
          bgColor: "bg-gray-100 dark:bg-gray-800",
          textColor: "text-gray-800 dark:text-gray-300",
          icon: <Square size={16} className="mr-1" />,
          text: "예정됨",
        };
      default:
        return {
          bgColor: "bg-gray-100 dark:bg-gray-800",
          textColor: "text-gray-800 dark:text-gray-300",
          icon: <Square size={16} className="mr-1" />,
          text: "상태 미정",
        };
    }
  };

  useEffect(() => {
    async function fetchTypes() {
      setLoading(true);
      setError(null);
      try {
        // JWT 토큰을 포함하여 점검 분류 데이터 요청
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/inspection/type`, {
          method: "GET",
          credentials: "include", // JWT 토큰을 위한 credentials 포함
          headers: {
            "Accept": "application/json",
          },
        });
        if (!res.ok) throw new Error("분류 데이터를 불러오지 못했습니다.");
        const data = await res.json();
        setTypes(data);
      } catch (e: any) {
        setError(e.message || "알 수 없는 에러가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
    fetchTypes();
  }, []);

  useEffect(() => {
    if (loginMember && loginMember.userName) {
      setFormData((prev) => ({ ...prev, assignee: loginMember.userName }));
    }
  }, [loginMember]);

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex flex-1 flex-col">
        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Header with Title and Bell Icon */}
          <header className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-foreground">
              시설점검 등록
            </h2>
          </header>

          {/* Back Button */}
          <div className="mb-6">
            <Link href="/admin/inspections">
              <Button
                variant="outline"
                className="flex items-center gap-2 text-pink-600 border-pink-200 hover:bg-pink-50 hover:text-pink-700 dark:text-pink-400 dark:border-pink-900/30 dark:hover:bg-pink-950/30 dark:hover:text-pink-300"
              >
                <ArrowLeft size={16} />
                <span>점검 목록으로 돌아가기</span>
              </Button>
            </Link>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Inspection Information (2/3 width on large screens) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information Card */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">
                    기본 정보
                  </h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label
                          htmlFor="title"
                          className="text-sm font-medium text-muted-foreground"
                        >
                          점검 제목
                        </Label>
                        <Input
                          id="title"
                          name="title"
                          value={formData.title}
                          onChange={handleChange}
                          placeholder="점검 제목을 입력하세요"
                          className="mt-1 w-full"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor="type"
                          className="text-sm font-medium text-muted-foreground"
                        >
                          점검 분류
                        </Label>
                        {loading ? (
                          <div className="text-muted-foreground mb-4">로딩 중...</div>
                        ) : error ? (
                          <div className="text-red-500 mb-4">{error}</div>
                        ) : (
                          <Select
                            value={formData.type}
                            onValueChange={(value) =>
                              handleSelectChange("type", value)
                            }
                          >
                            <SelectTrigger className="mt-1 w-full">
                              <SelectValue placeholder="점검 분류 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {types.map((t) => (
                                <SelectItem key={t.type_id} value={t.typeName}>{t.typeName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <div>
                        <Label
                          htmlFor="assignee"
                          className="text-sm font-medium text-muted-foreground"
                        >
                          담당자
                        </Label>
                        <div className="mt-1 w-full px-3 py-2 border border-border rounded bg-muted text-foreground">
                          {formData.assignee || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-4">
                      <div>
                        <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                          <Play className="h-4 w-4 text-green-600 dark:text-green-400" />
                          점검 시작
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Input
                              type="date"
                              id="startDate"
                              name="startDate"
                              value={formData.startDate}
                              onChange={handleChange}
                              className="w-full"
                              required
                            />
                          </div>
                          <div>
                            <Input
                              type="time"
                              id="startTime"
                              name="startTime"
                              value={formData.startTime}
                              onChange={handleChange}
                              className="w-full"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                          <Square className="h-4 w-4 text-red-600 dark:text-red-400" />
                          점검 종료
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Input
                              type="date"
                              id="endDate"
                              name="endDate"
                              value={formData.endDate}
                              onChange={handleChange}
                              className="w-full"
                              required
                            />
                          </div>
                          <div>
                            <Input
                              type="time"
                              id="endTime"
                              name="endTime"
                              value={formData.endTime}
                              onChange={handleChange}
                              className="w-full"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inspection Content with Textarea */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">
                    점검 내용
                  </h3>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="점검 내용을 입력하세요."
                      value={formData.detail}
                      onChange={handleTextareaChange}
                      className="min-h-[200px]"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Help and Actions (1/3 width on large screens) */}
              <div className="space-y-6">
                {/* Action Buttons */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">
                    작업
                  </h3>
                  <div className="space-y-5">
                    <Button
                      type="submit"
                      className="w-full bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center gap-2 dark:bg-pink-600 dark:hover:bg-pink-700 dark:text-white"
                      disabled={isSubmitting}
                    >
                      <Save size={16} />
                      {isSubmitting ? "저장 중..." : "점검 등록하기"}
                    </Button>
                    <div>
                      <Link href="/admin/inspections">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full flex items-center gap-2 text-muted-foreground hover:bg-secondary"
                        >
                          <X size={16} />
                          취소
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Help Information */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">
                    도움말
                  </h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p className="flex items-start gap-2">
                      <Tag className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span>
                        <strong className="text-foreground">점검 분류</strong>:
                        점검의 유형을 선택하세요. 수도, 정수, 소방, 가스, 전기
                        중에서 선택할 수 있습니다.
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <Play className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400" />
                      <span>
                        <strong className="text-foreground">점검 시작</strong>:
                        점검이 시작되는 날짜와 시간을 입력하세요.
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <Square className="h-4 w-4 mt-0.5 text-red-600 dark:text-red-400" />
                      <span>
                        <strong className="text-foreground">점검 종료</strong>:
                        점검이 종료될 것으로 예상되는 날짜와 시간을 입력하세요.
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span>
                        <strong className="text-foreground">담당자</strong>:
                        점검을 담당하는 사람의 이름을 입력하세요.
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card p-6 text-center text-sm text-muted-foreground">
          © 2025 APTner. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
