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
import TiptapEditor from "@/components/editor/TiptapEditor";
import { ThemeToggle } from "@/components/theme-toggle";
import { useRouter } from "next/navigation";

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

  const [formData, setFormData] = useState({
    title: "",
    type: "소방",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    assignee: "",
    detail: "",
    result: "NOTYET",
  });

  const [editorContent, setEditorContent] = useState("");

  // Load existing inspection data
  useEffect(() => {
    const loadInspectionData = async () => {
      try {
        // Mock API call for demo purposes
        console.log(`Loading inspection data for ID: ${params.id}`);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Mock data (in real app, this would come from API)
        const mockData = {
          check_id: params.id,
          title: "엘레베이터 1호기 정기 점검",
          type: "소방",
          start_at: "2023-05-15 09:00",
          finish_at: "2023-05-15 11:30",
          assignee: "김기술",
          detail:
            "엘레베이터 1호기에 대한 정기 점검을 실시하였습니다. 점검 결과, 모든 기능이 정상적으로 작동하고 있으며 안전 기준을 충족하고 있습니다.",
          result: "CHECKED",
        };

        // Parse date and time
        const startDateTime = new Date(mockData.start_at);
        const endDateTime = new Date(mockData.finish_at);

        setFormData({
          title: mockData.title,
          type: mockData.type,
          startDate: startDateTime.toISOString().split("T")[0],
          startTime: startDateTime.toTimeString().slice(0, 5),
          endDate: endDateTime.toISOString().split("T")[0],
          endTime: endDateTime.toTimeString().slice(0, 5),
          assignee: mockData.assignee,
          detail: mockData.detail,
          result: mockData.result,
        });

        setEditorContent(mockData.detail);
      } catch (error) {
        console.error("Error loading inspection data:", error);
        alert("점검 데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadInspectionData();
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditorChange = (content: string) => {
    setEditorContent(content);
    setFormData((prev) => ({ ...prev, detail: content }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Combine date and time fields
      const formattedData = {
        ...formData,
        start_at: `${formData.startDate} ${formData.startTime}`,
        finish_at: `${formData.endDate} ${formData.endTime}`,
        check_id: params.id,
      };

      // Mock API call for demo purposes
      console.log("Updating inspection data:", formattedData);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      alert("점검 기록이 성공적으로 수정되었습니다.");

      // Navigate back to inspection detail page
      router.push("/inspection-detail");
    } catch (error) {
      console.error("Error updating inspection:", error);
      alert("점검 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/udash/inspections/${params.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background overflow-hidden">
        <div className="flex flex-1 flex-col bg-background">
          <main className="flex-1 p-8 overflow-y-auto bg-background">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
                <p className="text-muted-foreground">
                  점검 데이터를 불러오는 중...
                </p>
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
              href="/udash/inspections/[id]"
              as={`/udash/inspections/${params.id}`}
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label
                          htmlFor="type"
                          className="text-sm font-medium text-muted-foreground"
                        >
                          점검 분류
                        </Label>
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
                            <SelectItem value="수도">수도</SelectItem>
                            <SelectItem value="정수">정수</SelectItem>
                            <SelectItem value="소방">소방</SelectItem>
                            <SelectItem value="가스">가스</SelectItem>
                            <SelectItem value="전기">전기</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label
                          htmlFor="assignee"
                          className="text-sm font-medium text-muted-foreground"
                        >
                          담당자
                        </Label>
                        <Input
                          id="assignee"
                          name="assignee"
                          value={formData.assignee}
                          onChange={handleChange}
                          placeholder="담당자 이름"
                          className="mt-1 w-full"
                          required
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="result"
                          className="text-sm font-medium text-muted-foreground"
                        >
                          점검 상태
                        </Label>
                        <Select
                          value={formData.result}
                          onValueChange={(value) =>
                            handleSelectChange("result", value)
                          }
                        >
                          <SelectTrigger className="mt-1 w-full">
                            <SelectValue placeholder="점검 상태 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NOTYET">예정됨</SelectItem>
                            <SelectItem value="PENDING">진행 중</SelectItem>
                            <SelectItem value="CHECKED">정상 완료</SelectItem>
                          </SelectContent>
                        </Select>
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

                {/* Inspection Content with TipTap Editor */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">
                    점검 내용
                  </h3>
                  <div className="min-h-[400px]">
                    <TiptapEditor
                      content={editorContent}
                      onChange={handleEditorChange}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Actions and Help (1/3 width on large screens) */}
              <div className="space-y-6">
                {/* Action Buttons */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">
                    작업
                  </h3>
                  <div className="space-y-3">
                    <Button
                      type="submit"
                      className="w-full bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center gap-2 dark:bg-pink-600 dark:hover:bg-pink-700 dark:text-white"
                      disabled={isSubmitting}
                    >
                      <Save size={16} />
                      {isSubmitting ? "저장 중..." : "변경사항 저장"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-border text-foreground hover:bg-secondary flex items-center justify-center gap-2"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                    >
                      <X size={16} />
                      취소
                    </Button>
                  </div>
                </div>

                {/* Help Information */}
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold text-card-foreground mb-4">
                    수정 안내
                  </h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400" />
                      <span>
                        <strong className="text-foreground">점검 상태</strong>:
                        현재 점검의 진행 상황을 업데이트할 수 있습니다.
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <Tag className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span>
                        <strong className="text-foreground">점검 분류</strong>:
                        점검 유형을 변경할 수 있습니다.
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span>
                        <strong className="text-foreground">담당자 변경</strong>
                        : 점검 담당자를 다른 사람으로 변경할 수 있습니다.
                      </span>
                    </p>
                    <div className="border-t border-border pt-3 mt-3">
                      <p className="text-amber-600 dark:text-amber-400 font-medium text-xs">
                        ⚠️ 변경사항은 저장 후 즉시 적용됩니다.
                      </p>
                    </div>
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
