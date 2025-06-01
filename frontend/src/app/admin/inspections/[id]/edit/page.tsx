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
import { ThemeToggle } from "@/components/theme-toggle";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";

interface InspectionEditPageProps {
  params: {
    id: string;
  };
}

export default function InspectionEditPage({
  params,
}: InspectionEditPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [types, setTypes] = useState<{ type_id: number; typeName: string }[]>([]);
  const [typeLoading, setTypeLoading] = useState(true);
  const [typeError, setTypeError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    type: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    assignee: "",
    detail: "",
    result: "",
  });

  // Load existing inspection data
  useEffect(() => {
    const loadInspectionData = async () => {
      setIsLoading(true);
      try {
        const id = params.id;
        // 실제 API 호출로 변경
        const res = await fetch(`/api/v1/inspection/manager/${id}`, {
          credentials: "include", // 쿠키 포함 설정 추가
        });

        if (!res.ok) {
          let errorMessage = "점검 데이터를 불러오지 못했습니다.";
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

        const data = await res.json();

        // API 응답 데이터를 formData 상태에 맞게 파싱 및 설정
        const startDateTime = new Date(data.startAt);
        const endDateTime = new Date(data.finishAt);

        setFormData({
          title: data.title || "",
          type: data.typeName || "",
          startDate: data.startAt ? startDateTime.toISOString().split("T")[0] : "",
          startTime: data.startAt ? startDateTime.toTimeString().slice(0, 5) : "",
          endDate: data.finishAt ? endDateTime.toISOString().split("T")[0] : "",
          endTime: data.finishAt ? endDateTime.toTimeString().slice(0, 5) : "",
          assignee: data.userName || "",
          detail: data.detail || "",
          result: data.result || "",
        });
      } catch (error: any) {
        console.error("Error loading inspection data:", error);
        alert(error.message || "점검 데이터를 불러오는 중 오류가 발생했습니다.");
        // 에러 발생 시 폼 초기화 또는 다른 처리 필요
        setFormData({
          title: "",
          type: "",
          startDate: "",
          startTime: "",
          endDate: "",
          endTime: "",
          assignee: "",
          detail: "",
          result: "",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) loadInspectionData();
  }, [params.id]);

  // 점검 분류 목록 불러오기 (등록 페이지에서 복사)
  useEffect(() => {
    async function fetchTypes() {
      setTypeLoading(true);
      setTypeError(null);
      try {
        const res = await fetch("/api/v1/inspection/type", {
          credentials: "include", // 쿠키 포함 설정 추가
        });
        if (!res.ok) throw new Error("분류 데이터를 불러오지 못했습니다.");
        const data = await res.json();
        setTypes(data);
      } catch (e: any) {
        setTypeError(e.message || "알 수 없는 에러가 발생했습니다.");
      } finally {
        setTypeLoading(false);
      }
    }
    fetchTypes();
  }, []);

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
      // Combine date and time fields (ISO 8601 형식)
      const startAt = `${formData.startDate}T${formData.startTime}`;
      const finishAt = `${formData.endDate}T${formData.endTime}`;

      const requestBody = {
        startAt,
        finishAt,
        title: formData.title,
        detail: formData.detail,
        type: formData.type,
        result: formData.result,
      };

      // API 호출 (PUT 또는 PATCH 사용)
      const res = await fetch(`/api/v1/inspection/manager/${params.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        credentials: "include",
      });

      if (!res.ok) {
        let errorMessage = "점검 기록 수정에 실패했습니다.";
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

      alert("점검 기록이 성공적으로 수정되었습니다.");

      // 수정 완료 후 상세 페이지로 이동
      router.push(`/admin/inspections/${params.id}`);
    } catch (error: any) {
      console.error("Error updating inspection:", error);
      alert(error.message || "점검 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/admin/inspections/${params.id}`);
  };

  if (isLoading || typeLoading) {
    return (
      <div className="flex min-h-screen bg-background overflow-hidden">
        <div className="flex flex-1 flex-col bg-background">
          <main className="flex-1 p-8 overflow-y-auto bg-background">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
                <p className="text-muted-foreground">
                  {isLoading ? "점검 데이터를 불러오는 중..." : "분류 데이터를 불러오는 중..."}
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (typeError) {
    return (
      <div className="flex min-h-screen bg-background overflow-hidden">
        <div className="flex flex-1 flex-col bg-background">
          <main className="flex-1 p-8 overflow-y-auto bg-background">
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-red-500">
                <p>{typeError}</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      <div className="flex flex-1 flex-col bg-background">
        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto bg-background">
          {/* Header with Title, Theme Toggle and Bell Icon */}
          <header className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-foreground">
              시설점검 수정
            </h2>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <button className="relative p-2 rounded-full hover:bg-secondary focus:outline-none">
                <BellRing size={22} className="text-muted-foreground" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-pink-500 ring-2 ring-background"></span>
              </button>
            </div>
          </header>

          {/* Back Button */}
          <div className="mb-6">
            <Link
              href={`/admin/inspections/${params.id}`}
            >
              <Button
                variant="outline"
                className="flex items-center gap-2 text-pink-600 border-pink-200 hover:bg-pink-50 hover:text-pink-700 dark:text-pink-400 dark:border-pink-900/30 dark:hover:bg-pink-950/30 dark:hover:text-pink-300"
              >
                <ArrowLeft size={16} />
                <span>점검 상세로 돌아가기</span>
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
                        {typeLoading ? (
                          <div className="text-muted-foreground">로딩 중...</div>
                        ) : typeError ? (
                          <div className="text-red-500">{typeError}</div>
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

                    {/* 점검 결과 (Select) */}
                    <div>
                      <Label
                        htmlFor="result"
                        className="text-sm font-medium text-muted-foreground"
                      >
                        점검 결과
                      </Label>
                      <Select
                        value={formData.result}
                        onValueChange={(value) =>
                          handleSelectChange("result", value)
                        }
                      >
                        <SelectTrigger className="mt-1 w-full">
                          <SelectValue placeholder="점검 결과 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CHECKED">정상 완료</SelectItem>
                          <SelectItem value="PENDING">진행 중</SelectItem>
                          <SelectItem value="NOTYET">예정됨</SelectItem>
                          <SelectItem value="ISSUE">이슈 있음</SelectItem>
                        </SelectContent>
                      </Select>
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
                      {isSubmitting ? "저장 중..." : "점검 수정하기"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-border text-foreground hover:bg-secondary flex items-center justify-center gap-2"
                      onClick={handleCancel}
                    >
                      <X size={16} />
                      취소
                    </Button>
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
                    {/* 점검 결과 도움말 추가 */}
                    <p className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span>
                        <strong className="text-foreground">점검 결과</strong>:
                        점검 결과를 선택하세요. 정상 완료, 진행 중, 예정됨,
                        이슈 있음 중에서 선택할 수 있습니다.
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
