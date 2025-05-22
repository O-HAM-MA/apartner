"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity, Users, MessageSquare, AlertTriangle } from "lucide-react";
import { useGlobalAdminMember } from "@/auth/adminMember";
import { useRouter } from "next/navigation";
import client from "@/lib/backend/client";

export default function AdminDashboard() {
  const { adminMember, isAdminLogin } = useGlobalAdminMember();
  const [complaintsCount, setComplaintsCount] = useState(0);
  const [complaintsIncrease, setComplaintsIncrease] = useState(0);
  const router = useRouter();

  // 오늘 접수된 민원 수 조회
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await client.GET(
          "/api/v1/complaints/statistics/today",
          {}
        );
        setComplaintsCount(data);
      } catch (error) {
        console.error("오늘의 통계 데이터를 불러오는 데 실패했습니다:", error);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const fetchComplaintsIncrease = async () => {
      try {
        const { data } = await client.GET(
          "/api/v1/complaints/statistics/today-rate",
          {}
        );
        setComplaintsIncrease(data);
      } catch (error) {
        console.error("오늘의 통계 데이터를 불러오는 데 실패했습니다:", error);
      }
    };

    fetchComplaintsIncrease();
  }, []);

  // 관리자 로그인 상태 확인
  useEffect(() => {
    console.log(
      "[AdminDashboard] 관리자 로그인 상태:",
      isAdminLogin,
      "관리자 정보:",
      adminMember
    );

    // localStorage에서 관리자 정보 확인
    const savedAdmin = localStorage.getItem("adminMember");
    console.log("[AdminDashboard] localStorage 관리자 정보:", savedAdmin);

    // 로그인 상태 확인 기준 강화
    const isLoggedIn =
      isAdminLogin ||
      (adminMember && adminMember.id !== 0) ||
      (savedAdmin && JSON.parse(savedAdmin).id !== 0);

    if (!isLoggedIn) {
      console.log(
        "[AdminDashboard] 로그인 상태가 아니므로 로그인 페이지로 이동"
      );
      window.location.href = "/admin";
    }
  }, [isAdminLogin, adminMember]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">관리자 대시보드</h1>
        <p className="text-muted-foreground">
          {adminMember.userName
            ? `안녕하세요, ${adminMember.userName}님!`
            : "Apartner 관리자 페이지에 오신 것을 환영합니다."}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,248</div>
            <p className="text-xs text-muted-foreground">지난달 대비 +12%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 세션</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">324</div>
            <p className="text-xs text-muted-foreground">지난 시간 대비 +7%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              오늘 접수된 민원 수
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complaintsCount}</div>
            <p className="text-xs text-muted-foreground">
              어제 대비 {complaintsIncrease.increaseRate}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">시스템 알림</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">어제 대비 +2건 증가</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
            <CardDescription>플랫폼 전체의 최근 활동 내역</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center">
                  <div className="mr-4 rounded-full p-2 bg-muted">
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>시스템 상태</CardTitle>
            <CardDescription>현재 시스템 성능 지표</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemStatus.map((status, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {status.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {status.description}
                    </p>
                  </div>
                  <div
                    className={`h-2 w-2 rounded-full ${status.statusColor}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const recentActivity = [
  {
    icon: Users,
    description: "새 사용자 등록: 김지수",
    timestamp: "2분 전",
  },
  {
    icon: MessageSquare,
    description: "새로운 고객 문의: 결제 시스템 관련 문제",
    timestamp: "15분 전",
  },
  {
    icon: AlertTriangle,
    description: "시스템 알림: 데이터베이스 백업 완료",
    timestamp: "1시간 전",
  },
  {
    icon: Activity,
    description: "사용자 로그인: 관리자 계정이 새 위치에서 로그인",
    timestamp: "3시간 전",
  },
];

const systemStatus = [
  {
    name: "API 서비스",
    description: "모든 엔드포인트 정상 작동 중",
    statusColor: "bg-green-500",
  },
  {
    name: "데이터베이스",
    description: "최적의 성능 상태",
    statusColor: "bg-green-500",
  },
  {
    name: "스토리지",
    description: "용량 85% 사용 중",
    statusColor: "bg-yellow-500",
  },
  {
    name: "인증 시스템",
    description: "완전히 작동 중",
    statusColor: "bg-green-500",
  },
];
