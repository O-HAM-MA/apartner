'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import client from '@/lib/backend/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// API 응답 타입
interface FacilityUsageCountDto {
  facilityName: string;
  count: number;
}

interface UserUsageCountDto {
  userName: string;
  count: number;
}

interface BuildingUsageCountDto {
  buildingNumber: string;
  count: number;
}

interface DayOfWeekUsageDto {
  dayName: string;
  count: number;
}

interface TimePeriodUsageDto {
  period: string;
  count: number;
}

interface ReservationStatusCountDto {
  status: string;
  count: number;
}

interface CancellationRatioDto {
  total: number;
  cancelled: number;
  rate: number;
}

// API 응답 데이터 타입
interface FacilityUsageResponse {
  facilityName: string;
  reservationCount: number;
}

interface UserUsageResponse {
  userName: string;
  buildingNumber: string;
  unitNumber: string;
  reservationCount: number;
}

interface BuildingUsageResponse {
  buildingNumber: string;
  reservationCount: number;
}

interface DayOfWeekUsageResponse {
  dayOfWeek: string;
  reservationCount: number;
}

interface TimePeriodUsageResponse {
  timePeriod: string;
  reservationCount: number;
}

interface ReservationStatusCountResponse {
  status: string;
  count: number;
}

interface CancellationRatioResponse {
  totalReservations: number;
  totalCancelled: number;
  cancellationRatio: number;
}

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
];

// 요일 순서 상수
const DAY_ORDER = [
  '월요일',
  '화요일',
  '수요일',
  '목요일',
  '금요일',
  '토요일',
  '일요일',
];

// 시간대 순서 상수
// 오전: 05시 ~ 11시
// 오후: 12시 ~ 16시
// 저녁: 17시 ~ 22시
// 야간: 23시 ~ 04시
const TIME_PERIOD_ORDER = ['오전', '오후', '저녁', '야간'];

// 시간대 설명
const TIME_PERIOD_DESCRIPTION: Record<string, string> = {
  오전: '05시 ~ 11시',
  오후: '12시 ~ 16시',
  저녁: '17시 ~ 22시',
  야간: '23시 ~ 04시',
} as const;

export default function FacilitiesAnalyticsPage() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('7d');
  const [facilityUsage, setFacilityUsage] = useState<FacilityUsageCountDto[]>(
    []
  );
  const [userUsage, setUserUsage] = useState<UserUsageCountDto[]>([]);
  const [buildingUsage, setBuildingUsage] = useState<BuildingUsageCountDto[]>(
    []
  );
  const [dayOfWeekUsage, setDayOfWeekUsage] = useState<DayOfWeekUsageDto[]>([]);
  const [timePeriodUsage, setTimePeriodUsage] = useState<TimePeriodUsageDto[]>(
    []
  );
  const [statusCounts, setStatusCounts] = useState<ReservationStatusCountDto[]>(
    []
  );
  const [cancellationRatio, setCancellationRatio] =
    useState<CancellationRatioDto | null>(null);

  const handleTabChange = (value: string) => {
    if (value !== 'facilities') {
      router.push('/admin/analytics');
    }
  };

  const fetchStatistics = async () => {
    try {
      const [
        facilityRes,
        userRes,
        buildingRes,
        dayOfWeekRes,
        timePeriodRes,
        statusRes,
        cancellationRes,
      ] = await Promise.all([
        client.GET('/api/v1/admin/facilities/statistics/facility-usage'),
        client.GET('/api/v1/admin/facilities/statistics/user-usage'),
        client.GET('/api/v1/admin/facilities/statistics/building-usage'),
        client.GET('/api/v1/admin/facilities/statistics/day-of-week'),
        client.GET('/api/v1/admin/facilities/statistics/time-period'),
        client.GET('/api/v1/admin/facilities/statistics/reservation-status'),
        client.GET('/api/v1/admin/facilities/statistics/cancellation-ratio'),
      ]);

      if (facilityRes?.data) {
        setFacilityUsage(
          (facilityRes.data as FacilityUsageResponse[]).map((item) => ({
            facilityName: item.facilityName,
            count: item.reservationCount,
          }))
        );
      }
      if (userRes?.data) {
        setUserUsage(
          (userRes.data as UserUsageResponse[]).map((item) => ({
            userName: item.userName,
            count: item.reservationCount,
          }))
        );
      }
      if (buildingRes?.data) {
        setBuildingUsage(
          (buildingRes.data as BuildingUsageResponse[]).map((item) => ({
            buildingNumber: item.buildingNumber,
            count: item.reservationCount,
          }))
        );
      }
      if (dayOfWeekRes?.data) {
        const dayOfWeekData = (
          dayOfWeekRes.data as DayOfWeekUsageResponse[]
        ).map((item) => ({
          dayName: item.dayOfWeek,
          count: item.reservationCount,
        }));

        // 요일 순서대로 정렬
        const sortedDayOfWeekData = DAY_ORDER.map(
          (day) =>
            dayOfWeekData.find((item) => item.dayName === day) || {
              dayName: day,
              count: 0,
            }
        );

        setDayOfWeekUsage(sortedDayOfWeekData);
      }
      if (timePeriodRes?.data) {
        const timePeriodData = (
          timePeriodRes.data as TimePeriodUsageResponse[]
        ).map((item) => ({
          period: item.timePeriod,
          count: item.reservationCount,
        }));

        // 시간대 순서대로 정렬
        const sortedTimePeriodData = TIME_PERIOD_ORDER.map(
          (period) =>
            timePeriodData.find((item) => item.period === period) || {
              period,
              count: 0,
            }
        );

        setTimePeriodUsage(sortedTimePeriodData);
      }
      if (statusRes?.data) {
        setStatusCounts(statusRes.data as ReservationStatusCountResponse[]);
      }
      if (cancellationRes?.data) {
        const data = cancellationRes.data as CancellationRatioResponse;
        setCancellationRatio({
          total: data.totalReservations,
          cancelled: data.totalCancelled,
          rate: data.cancellationRatio,
        });
      }
    } catch (error) {
      console.error('통계 데이터 조회 실패:', error);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [timeRange]);

  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#666">
          {payload.value}
        </text>
        <text
          x={0}
          y={20}
          dy={16}
          textAnchor="middle"
          fill="#666"
          fontSize="12"
        >
          {TIME_PERIOD_DESCRIPTION[payload.value]}
        </text>
      </g>
    );
  };

  return (
    <div className="container-fluid p-6 max-w-[2000px] mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">통계 - 공용시설</h1>
        <p className="text-muted-foreground mt-1">
          시스템 사용량 및 성능 측정 항목을 모니터링합니다
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Tabs defaultValue="facilities" onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="facilities">Facilities</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="기간 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">최근 24시간</SelectItem>
            <SelectItem value="7d">최근 7일</SelectItem>
            <SelectItem value="30d">최근 30일</SelectItem>
            <SelectItem value="90d">최근 90일</SelectItem>
            <SelectItem value="1y">최근 1년</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">총 예약 건수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cancellationRatio?.total || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">취소율</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((cancellationRatio?.rate || 0) * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              가장 인기 있는 시설
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {facilityUsage[0]?.facilityName || '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              가장 인기 있는 시간대
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {timePeriodUsage[0]?.period || '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>시설별 이용 현황</CardTitle>
            <CardDescription>시설별 예약 건수</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={facilityUsage}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="facilityName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>요일별 이용 현황</CardTitle>
            <CardDescription>요일별 예약 건수</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dayOfWeekUsage}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dayName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>시간대별 이용 현황</CardTitle>
            <CardDescription>시간대별 예약 건수</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={timePeriodUsage}
                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="period"
                  height={60}
                  tick={<CustomXAxisTick />}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>예약 상태 분포</CardTitle>
            <CardDescription>상태별 예약 건수</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusCounts}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="status"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {statusCounts.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
