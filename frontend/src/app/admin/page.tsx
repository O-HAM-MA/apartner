"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Lock, AlertCircle } from "lucide-react";
import { post, get } from "@/utils/api";
import { useAdminMember } from "@/auth/adminMember";

// 백엔드 응답 타입 정의 (토큰은 쿠키로 전송됨)
type AdminLoginResponse = {
  userId: number;
  userName: string;
};

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setAdminMember } = useAdminMember();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 실제 API 호출 (토큰은 쿠키에 자동 저장됨)
      console.log("[AdminLogin] 로그인 시도:", email);
      const response = await post<AdminLoginResponse>(
        "/api/v1/admin/login",
        { username: email, password },
        {},
        true // 401 리다이렉트 방지
      );
      console.log("[AdminLogin] 로그인 응답:", response);

      // 로그인 성공 시 관리자 정보 조회 (쿠키의 토큰 사용)
      try {
        const adminData = await get<any>("/api/v1/admin/me", {}, true);
        console.log("[AdminLogin] 관리자 정보 로드 성공:", adminData);

        // 관리자 정보가 유효한지 확인
        if (!adminData || !adminData.id) {
          console.error(
            "[AdminLogin] 관리자 데이터가 유효하지 않음:",
            adminData
          );
          setError("관리자 정보가 유효하지 않습니다.");
          setIsLoading(false);
          return;
        }

        // 상태 업데이트 후 대시보드로 이동
        setAdminMember(adminData);
        console.log("[AdminLogin] 대시보드로 이동 시도");

        // 약간의 지연 후 이동
        setTimeout(() => {
          window.location.href = "/admin/addash";
        }, 100);
      } catch (meError) {
        console.error("관리자 정보 조회 실패:", meError);
        setError("로그인은 성공했으나 관리자 정보를 불러오는데 실패했습니다.");
        setIsLoading(false);
      }
    } catch (err: any) {
      // 에러 메시지 처리
      if (err.message.includes("401")) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else if (err.message.includes("403")) {
        setError("관리자 권한이 없는 계정입니다.");
      } else if (err.message.includes("404")) {
        setError("존재하지 않는 계정입니다.");
      } else {
        setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-6">
            <Lock className="h-10 w-10 text-apartner-600 dark:text-apartner-400" />
          </div>
          <CardTitle className="text-2xl text-center">관리자 로그인</CardTitle>
          <CardDescription className="text-center">
            관리자 계정 정보를 입력하여 로그인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@apartner.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">비밀번호</Label>
                <Link
                  href="/admin/forgot-password"
                  className="text-xs text-apartner-600 dark:text-apartner-400 hover:underline"
                >
                  비밀번호 찾기
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            메인 사이트로 돌아가기
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
