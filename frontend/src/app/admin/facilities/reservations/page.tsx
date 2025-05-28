'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Check, X, Building2, CalendarDays } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import client from '@/lib/backend/client';
import { Label } from '@/components/ui/label';

// 예약 상태 타입
type ReservationStatus = 'AGREE' | 'PENDING' | 'REJECT' | 'CANCEL';

// 예약 정보 타입
interface Reservation {
  reservationId: number;
  applicantName: string;
  building: string;
  unit: string;
  facilityName: string;
  instructorName: string;
  reservationDateTime: string;
  status: ReservationStatus;
}

// 예약 상세 정보 타입
interface ReservationDetail {
  reservationId: number;
  applicantName: string;
  building: string;
  unit: string;
  facilityName: string;
  instructorName: string;
  programName: string;
  reservationDateTime: string;
  createdAt: string;
  status: ReservationStatus;
}

export default function ReservationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationSearchTerm, setReservationSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'ALL'>(
    'ALL'
  );
  const [facilityFilter, setFacilityFilter] = useState('ALL');
  const [uniqueFacilities, setUniqueFacilities] = useState<string[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<ReservationDetail | null>(null);

  // 주소 포맷팅 함수
  const formatAddress = (building: string, unit: string) => {
    return `${building}동 ${unit}호`;
  };

  // 날짜 포맷팅 함수
  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // 예약 상태별 배지 스타일
  const getStatusBadgeStyle = (status: ReservationStatus) => {
    switch (status) {
      case 'PENDING':
        return {
          variant: 'outline' as const,
          label: '승인 대기',
          className: 'bg-yellow-100 text-yellow-800',
        };
      case 'AGREE':
        return {
          variant: 'default' as const,
          label: '승인 완료',
          className: 'bg-green-100 text-green-800',
        };
      case 'REJECT':
        return {
          variant: 'destructive' as const,
          label: '승인 거절',
          className: 'bg-red-100 text-red-800',
        };
      case 'CANCEL':
        return {
          variant: 'secondary' as const,
          label: '예약 취소',
          className: 'bg-gray-100 text-gray-800',
        };
      default:
        return {
          variant: 'outline' as const,
          label: '알 수 없음',
          className: 'bg-gray-100 text-gray-800',
        };
    }
  };

  // 예약 목록 조회
  const fetchReservations = async () => {
    try {
      const { data } = await client.GET(
        '/api/v1/admin/facilities/reservations' as any,
        {
          params: {
            query: {
              page: '0',
              size: '100',
              sort: 'desc',
            },
          },
        }
      );

      if (data) {
        setReservations(data);
        // 고유한 시설명 목록 추출
        const facilities = [
          'ALL',
          ...Array.from(
            new Set(data.map((item: Reservation) => item.facilityName))
          ),
        ] as string[];
        setUniqueFacilities(facilities);
      }
    } catch (error) {
      console.error('예약 목록 조회 실패:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '예약 목록을 불러오는데 실패했습니다.',
      });
    }
  };

  // 예약 상세 조회
  const fetchReservationDetail = async (reservationId: number) => {
    try {
      const response = await client.GET(
        '/api/v1/admin/facilities/reservations/{reservationId}',
        {
          params: {
            path: {
              reservationId,
            },
          },
        }
      );

      if (response?.data) {
        const reservationDetail: ReservationDetail = {
          reservationId: response.data.reservationId || 0,
          applicantName: response.data.applicantName || '',
          building: response.data.building || '',
          unit: response.data.unit || '',
          facilityName: response.data.facilityName || '',
          instructorName: response.data.instructorName || '',
          programName: response.data.programName || '',
          reservationDateTime: response.data.reservationDateTime || '',
          createdAt: response.data.createdAt || '',
          status: (response.data.status as ReservationStatus) || 'PENDING',
        };

        setSelectedReservation(reservationDetail);
        setIsDetailModalOpen(true);
      }
    } catch (error) {
      console.error('예약 상세 조회 실패:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '예약 상세 정보를 불러오는데 실패했습니다.',
      });
    }
  };

  // 예약 상태 변경
  const handleStatusChange = async (
    reservationId: number,
    newStatus: ReservationStatus
  ) => {
    try {
      await client.PATCH(
        '/api/v1/admin/facilities/reservations/{reservationId}/status',
        {
          params: {
            path: {
              reservationId,
            },
          },
          body: {
            status: newStatus,
          },
        }
      );

      toast({
        title: '성공',
        description: '예약 상태가 변경되었습니다.',
        duration: 2000,
      });
      fetchReservations();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '상태 변경에 실패했습니다.',
        duration: 2000,
      });
    }
  };

  // useEffect 수정
  useEffect(() => {
    fetchReservations();
  }, []);

  return (
    <div className="container-fluid p-6 max-w-[2000px] mx-auto">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">예약 관리</h1>
        <p className="text-muted-foreground mt-1">
          공용시설 예약 현황을 확인하고 관리할 수 있습니다.
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex space-x-2 mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/facilities')}
          className="flex items-center gap-2"
        >
          <Building2 className="w-4 h-4" />
          시설 관리
        </Button>
        <Button variant="default" className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          예약 관리
        </Button>
      </div>

      {/* 예약 관리 컨텐츠 */}
      <Card>
        <CardHeader>
          <CardTitle>예약 목록</CardTitle>
          <CardDescription>
            공용시설 예약 현황을 확인하고 관리할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="신청자 이름, 주소로 검색..."
                  className="pl-8"
                  value={reservationSearchTerm}
                  onChange={(e) => setReservationSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="flex h-9 w-[200px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={facilityFilter}
                onChange={(e) => setFacilityFilter(e.target.value)}
              >
                <option value="ALL">전체 시설</option>
                {uniqueFacilities
                  .filter((facility) => facility !== 'ALL')
                  .map((facility) => (
                    <option key={facility} value={facility}>
                      {facility}
                    </option>
                  ))}
              </select>
              <select
                className="flex h-9 w-[200px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as ReservationStatus | 'ALL')
                }
              >
                <option value="ALL">전체 상태</option>
                <option value="PENDING">승인 대기</option>
                <option value="AGREE">승인 완료</option>
                <option value="REJECT">승인 거절</option>
                <option value="CANCEL">예약 취소</option>
              </select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] text-center">번호</TableHead>
                  <TableHead>신청자</TableHead>
                  <TableHead>주소</TableHead>
                  <TableHead>시설명</TableHead>
                  <TableHead>강사명</TableHead>
                  <TableHead className="text-center">예약 일시</TableHead>
                  <TableHead className="text-center">상태</TableHead>
                  <TableHead className="w-[100px] text-center">관리</TableHead>
                  <TableHead className="w-[80px] text-center">상세</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations
                  .filter((reservation) => {
                    const searchLower = reservationSearchTerm.toLowerCase();
                    const matchesSearch =
                      reservation.applicantName
                        .toLowerCase()
                        .includes(searchLower) ||
                      formatAddress(reservation.building, reservation.unit)
                        .toLowerCase()
                        .includes(searchLower);
                    const matchesStatus =
                      statusFilter === 'ALL' ||
                      reservation.status === statusFilter;
                    const matchesFacility =
                      facilityFilter === 'ALL' ||
                      reservation.facilityName === facilityFilter;
                    return matchesSearch && matchesStatus && matchesFacility;
                  })
                  .map((reservation, index) => (
                    <TableRow key={reservation.reservationId}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell>{reservation.applicantName}</TableCell>
                      <TableCell>
                        {formatAddress(reservation.building, reservation.unit)}
                      </TableCell>
                      <TableCell>{reservation.facilityName}</TableCell>
                      <TableCell>{reservation.instructorName}</TableCell>
                      <TableCell className="text-center">
                        {reservation.reservationDateTime}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            getStatusBadgeStyle(reservation.status).className
                          }`}
                        >
                          {getStatusBadgeStyle(reservation.status).label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center items-center gap-2">
                          {reservation.status === 'PENDING' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleStatusChange(
                                    reservation.reservationId,
                                    'AGREE'
                                  )
                                }
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleStatusChange(
                                    reservation.reservationId,
                                    'REJECT'
                                  )
                                }
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {reservation.status !== 'PENDING' &&
                            reservation.status !== 'CANCEL' && (
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleStatusChange(
                                      reservation.reservationId,
                                      'AGREE'
                                    )
                                  }
                                  className={`text-green-600 hover:text-green-700 hover:bg-green-50 ${
                                    reservation.status === 'AGREE'
                                      ? 'bg-green-50'
                                      : ''
                                  }`}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleStatusChange(
                                      reservation.reservationId,
                                      'REJECT'
                                    )
                                  }
                                  className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${
                                    reservation.status === 'REJECT'
                                      ? 'bg-red-50'
                                      : ''
                                  }`}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          {reservation.status === 'CANCEL' && (
                            <div className="flex items-center justify-center text-sm text-muted-foreground">
                              취소된 예약
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            fetchReservationDetail(reservation.reservationId)
                          }
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 예약 상세 정보 모달 */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>예약 상세 정보</DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">신청자</Label>
                <div className="col-span-3">
                  {selectedReservation.applicantName}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">주소</Label>
                <div className="col-span-3">
                  {formatAddress(
                    selectedReservation.building,
                    selectedReservation.unit
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">시설명</Label>
                <div className="col-span-3">
                  {selectedReservation.facilityName}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">강사명</Label>
                <div className="col-span-3">
                  {selectedReservation.instructorName}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">프로그램명</Label>
                <div className="col-span-3">
                  {selectedReservation.programName}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">예약 일시</Label>
                <div className="col-span-3">
                  {selectedReservation.reservationDateTime}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">신청 일시</Label>
                <div className="col-span-3">
                  {formatDateTime(selectedReservation.createdAt)}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">상태</Label>
                <div className="col-span-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getStatusBadgeStyle(selectedReservation.status).className
                    }`}
                  >
                    {getStatusBadgeStyle(selectedReservation.status).label}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
