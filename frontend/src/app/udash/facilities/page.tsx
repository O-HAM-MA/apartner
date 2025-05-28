'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Search,
  Building2,
  Calendar,
  Loader2,
  User,
  Clock,
  MoreVertical,
  Info,
  XCircle,
  MessageSquare,
} from 'lucide-react';
import { paths } from '@/lib/backend/apiV1/schema';
import client from '@/lib/backend/client';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type FacilitySimpleResponseDto = {
  facilityId: number;
  facilityName: string;
  description: string;
  openTime: string;
  closeTime: string;
};

// API 응답 타입
type ApiReservationResponse = {
  reservationId: number;
  facilityName: string;
  instructorName: string;
  programName: string;
  reservationDateTime: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
};

// 프론트엔드에서 사용할 타입
type FacilityReservationSimpleUserDto = {
  reservationId: number;
  facilityName: string;
  instructorName: string;
  programName: string;
  reservationDateTime: string;
  status: 'AGREE' | 'PENDING' | 'REJECT' | 'CANCEL';
};

type FacilityReservationDetailDto = {
  reservationId: number;
  facilityName: string;
  instructorName: string;
  programName: string;
  reservationDateTime: string;
  createdAt: string;
  requestMessage: string;
  status: 'AGREE' | 'PENDING' | 'REJECT' | 'CANCEL';
};

type CancelReasonType =
  | 'PERSONAL_REASON'
  | 'SCHEDULE_CONFLICT'
  | 'ILLNESS'
  | 'MISTAKE'
  | 'OTHER';

const CANCEL_REASON_OPTIONS = [
  { value: 'PERSONAL_REASON', label: '개인사정' },
  { value: 'SCHEDULE_CONFLICT', label: '일정 중복' },
  { value: 'ILLNESS', label: '질병/건강 문제' },
  { value: 'MISTAKE', label: '잘못 예약함' },
  { value: 'OTHER', label: '기타' },
] as const;

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'AGREE':
      return 'bg-green-100 text-green-800';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'REJECT':
      return 'bg-red-100 text-red-800';
    case 'CANCEL':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'AGREE':
      return '승인 완료';
    case 'PENDING':
      return '승인 대기';
    case 'REJECT':
      return '승인 거절';
    case 'CANCEL':
      return '예약 취소';
    default:
      return '알 수 없음';
  }
};

export default function FacilitiesPage() {
  const router = useRouter();
  const [facilities, setFacilities] = useState<FacilitySimpleResponseDto[]>([]);
  const [reservations, setReservations] = useState<
    FacilityReservationSimpleUserDto[]
  >([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservationsError, setReservationsError] = useState<string | null>(
    null
  );
  const [activeTab, setActiveTab] = useState('facilities');
  const [selectedReservation, setSelectedReservation] =
    useState<FacilityReservationDetailDto | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedCancelReasonType, setSelectedCancelReasonType] = useState<
    CancelReasonType | ''
  >('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReservationId, setCancelReservationId] = useState<number | null>(
    null
  );
  const [isCancelling, setIsCancelling] = useState(false);

  const formatTime = (time: string) => {
    if (!time) return '';
    try {
      // HH:mm:ss 형식이면 HH:mm만 추출
      if (time.includes(':')) {
        const [hours, minutes] = time.split(':');
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      }
      return time;
    } catch (error) {
      console.error('시간 포맷 에러:', error);
      return time;
    }
  };

  const formatOperatingHours = (openTime: string, closeTime: string) => {
    if (!openTime || !closeTime) return '운영시간 정보 없음';

    const openHour = parseInt(openTime.split(':')[0]);
    const closeHour = parseInt(closeTime.split(':')[0]);

    // 종료 시간이 시작 시간보다 작으면 자정을 넘어가는 경우
    if (closeHour < openHour || closeHour === 0) {
      return `운영시간: ${formatTime(openTime)} - 익일 ${formatTime(
        closeTime
      )}`;
    }

    return `운영시간: ${formatTime(openTime)} - ${formatTime(closeTime)}`;
  };

  const fetchFacilities = useCallback(async (keyword?: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await client.GET('/api/v1/facilities', {
        query: { keyword: keyword || undefined },
      });
      if (response.data) {
        setFacilities(response.data as FacilitySimpleResponseDto[]);
      }
    } catch (err) {
      setError('시설 목록을 불러오는데 실패했습니다.');
      console.error('Error fetching facilities:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReservations = useCallback(async () => {
    try {
      setReservationsLoading(true);
      setReservationsError(null);
      const response = await client.GET('/api/v1/facilities/reservations');
      if (response.data) {
        const formattedReservations = (response.data as any[]).map((item) => ({
          reservationId: item.reservationId || 0,
          facilityName: item.facilityName || '',
          instructorName: item.instructorName || '',
          programName: item.programName || '',
          reservationDateTime: item.reservationDateTime || '',
          status: item.status || 'PENDING',
        }));
        setReservations(formattedReservations);
      }
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setReservationsError(
        '예약 내역을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.'
      );
    } finally {
      setReservationsLoading(false);
    }
  }, []);

  const fetchReservationDetail = async (reservationId: number) => {
    try {
      setIsDetailLoading(true);
      const response = await client.GET(
        '/api/v1/facilities/reservations/{facilityReservationId}',
        {
          params: {
            path: {
              facilityReservationId: reservationId,
            },
          },
        }
      );
      if (response.data) {
        setSelectedReservation(response.data as FacilityReservationDetailDto);
        setIsDetailModalOpen(true);
      }
    } catch (err) {
      console.error('Error fetching reservation detail:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!cancelReservationId || !selectedCancelReasonType) return;

    try {
      setIsCancelling(true);
      await client.DELETE(
        '/api/v1/facilities/reservations/{facilityReservationId}',
        {
          params: {
            path: {
              facilityReservationId: cancelReservationId,
            },
          },
          body: {
            cancelReasonType: selectedCancelReasonType,
            cancelReason:
              selectedCancelReasonType === 'OTHER' ? cancelReason : undefined,
          },
        }
      );

      // 성공적으로 취소되면 모달 닫고 예약 목록 새로고침
      setIsCancelModalOpen(false);
      fetchReservations();

      // 상태 초기화
      setSelectedCancelReasonType('');
      setCancelReason('');
      setCancelReservationId(null);
    } catch (err) {
      console.error('Error cancelling reservation:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  const openCancelModal = (reservationId: number) => {
    setCancelReservationId(reservationId);
    setIsCancelModalOpen(true);
  };

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchKeyword !== undefined) {
        fetchFacilities(searchKeyword);
      }
    }, 300); // 300ms 디바운스

    return () => clearTimeout(debounceTimer);
  }, [searchKeyword, fetchFacilities]);

  useEffect(() => {
    if (activeTab === 'my-reservations') {
      fetchReservations();
    }
  }, [activeTab, fetchReservations]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const keyword = e.target.value;
    setSearchKeyword(keyword);
  };

  const FacilitiesList = () => (
    <>
      <div className="relative mb-6">
        <Input
          type="text"
          placeholder="시설 검색..."
          value={searchKeyword}
          onChange={handleSearch}
          className="pl-10 bg-white border-gray-300 focus:border-pink-500 focus:ring-pink-500"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
          <span className="ml-2 text-pink-500">시설 목록을 불러오는 중...</span>
        </div>
      )}
      {error && <div className="text-center text-red-500 py-8">{error}</div>}

      {!loading && facilities.length === 0 && (
        <div className="text-center py-8">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">검색 결과가 없습니다.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {facilities.map((facility) => (
          <Card
            key={facility.facilityId}
            className="overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white border-l-4 border-l-pink-500"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Building2 className="w-6 h-6 text-pink-700" />
                <h3 className="text-lg font-semibold text-gray-800">
                  {facility.facilityName}
                </h3>
              </div>
              <p className="text-gray-600 mb-2">{facility.description}</p>
              <p className="text-sm text-gray-500 mb-3">
                {formatOperatingHours(facility.openTime, facility.closeTime)}
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    router.push(`/udash/facilities/${facility.facilityId}`);
                  }}
                  className="bg-pink-50 hover:bg-pink-100 text-pink-700 text-sm font-semibold py-1.5 px-3 rounded-lg transition-colors duration-300"
                >
                  예약하기
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );

  const MyReservationsList = ({
    reservations,
    reservationsLoading,
    reservationsError,
    onCancelReservation,
  }: {
    reservations: FacilityReservationSimpleUserDto[];
    reservationsLoading: boolean;
    reservationsError: string | null;
    onCancelReservation?: (reservationId: number) => void;
  }) => {
    return (
      <div>
        {reservationsLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
            <span className="ml-2 text-pink-500">
              예약 내역을 불러오는 중...
            </span>
          </div>
        )}
        {reservationsError && (
          <div className="text-center text-red-500 py-8">
            {reservationsError}
          </div>
        )}
        {!reservationsLoading && reservations.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">예약 내역이 없습니다.</p>
          </div>
        )}
        {!reservationsLoading && reservations.length > 0 && (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="py-4 px-6 text-left font-medium text-gray-600">
                    번호
                  </th>
                  <th className="py-4 px-6 text-left font-medium text-gray-600">
                    시설명
                  </th>
                  <th className="py-4 px-6 text-left font-medium text-gray-600">
                    강사명
                  </th>
                  <th className="py-4 px-6 text-left font-medium text-gray-600">
                    프로그램명
                  </th>
                  <th className="py-4 px-6 text-left font-medium text-gray-600">
                    예약 일시
                  </th>
                  <th className="py-4 px-6 text-left font-medium text-gray-600">
                    상태
                  </th>
                  <th className="py-4 px-6 text-center font-medium text-gray-600">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reservations.map((reservation, index) => (
                  <tr
                    key={reservation.reservationId}
                    className="bg-white hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-gray-900">{index + 1}</td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">
                        {reservation.facilityName}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-900">
                      {reservation.instructorName}
                    </td>
                    <td className="py-4 px-6 text-gray-900">
                      {reservation.programName}
                    </td>
                    <td className="py-4 px-6 text-gray-900">
                      {reservation.reservationDateTime}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(
                          reservation.status
                        )}`}
                      >
                        {getStatusText(reservation.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              fetchReservationDetail(reservation.reservationId)
                            }
                            className="text-gray-700 cursor-pointer flex items-center gap-2"
                          >
                            <Info className="h-4 w-4" />
                            <span>상세보기</span>
                          </DropdownMenuItem>
                          {(reservation.status === 'PENDING' ||
                            reservation.status === 'AGREE') && (
                            <DropdownMenuItem
                              onClick={() =>
                                openCancelModal(reservation.reservationId)
                              }
                              className="text-red-600 cursor-pointer flex items-center gap-2"
                            >
                              <XCircle className="h-4 w-4" />
                              <span>예약 취소</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const ReservationDetailModal = () => {
    if (!selectedReservation) return null;

    return (
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>예약 상세 내역</DialogTitle>
            <DialogDescription>
              예약하신 시설의 상세 정보를 확인하실 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <div className="font-medium">시설명</div>
              <div className="col-span-2">
                {selectedReservation.facilityName}
              </div>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <div className="font-medium">강사명</div>
              <div className="col-span-2">
                {selectedReservation.instructorName}
              </div>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <div className="font-medium">프로그램명</div>
              <div className="col-span-2">
                {selectedReservation.programName}
              </div>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <div className="font-medium">예약 일시</div>
              <div className="col-span-2">
                {selectedReservation.reservationDateTime}
              </div>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <div className="font-medium">신청 일시</div>
              <div className="col-span-2">
                {format(
                  new Date(selectedReservation.createdAt),
                  'yyyy-MM-dd HH:mm',
                  { locale: ko }
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <div className="font-medium">요청사항</div>
              <div className="col-span-2">
                {selectedReservation.requestMessage || '(없음)'}
              </div>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <div className="font-medium">상태</div>
              <div className="col-span-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(
                    selectedReservation.status
                  )}`}
                >
                  {getStatusText(selectedReservation.status)}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const CancelReservationModal = () => {
    return (
      <Dialog
        open={isCancelModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCancelReasonType('');
            setCancelReason('');
          }
          setIsCancelModalOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>예약 취소</DialogTitle>
            <DialogDescription>
              예약을 취소하시려면 취소 사유를 선택해 주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">취소 사유 선택</label>
              <Select
                value={selectedCancelReasonType}
                onValueChange={(value: CancelReasonType) =>
                  setSelectedCancelReasonType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="취소 사유를 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  {CANCEL_REASON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCancelReasonType === 'OTHER' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">취소 사유 입력</label>
                <Textarea
                  placeholder="취소 사유를 입력해주세요"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCancelModalOpen(false)}
              className="mr-2"
            >
              취소
            </Button>
            <Button
              onClick={handleCancelReservation}
              disabled={
                !selectedCancelReasonType ||
                (selectedCancelReasonType === 'OTHER' && !cancelReason) ||
                isCancelling
              }
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리중
                </>
              ) : (
                '예약 취소'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="p-4 min-h-screen">
      <h1 className="text-3xl font-bold tracking-tight">
        공용시설 예약 및 확인
      </h1>
      <p className="text-muted-foreground mt-1 mb-6">
        아파트 공용시설을 예약하고, 나의 예약 내역을 확인할 수 있습니다.
      </p>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Tabs
            defaultValue="facilities"
            className="w-full"
            onValueChange={setActiveTab}
          >
            <div className="border-b px-8">
              <TabsList className="h-auto p-0 bg-transparent border-0">
                <TabsTrigger
                  value="facilities"
                  className="flex items-center gap-2 px-8 py-5 border-b-2 border-transparent data-[state=active]:border-pink-500 data-[state=active]:text-pink-700 rounded-none transition-all text-base"
                >
                  <Building2 className="w-5 h-5" />
                  <span className="font-semibold">시설 예약</span>
                </TabsTrigger>
                <TabsTrigger
                  value="my-reservations"
                  className="flex items-center gap-2 px-8 py-5 border-b-2 border-transparent data-[state=active]:border-pink-500 data-[state=active]:text-pink-700 rounded-none transition-all text-base"
                >
                  <Calendar className="w-5 h-5" />
                  <span className="font-semibold">나의 예약 내역</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-8">
              <TabsContent value="facilities" className="m-0">
                <FacilitiesList />
              </TabsContent>

              <TabsContent value="my-reservations" className="m-0">
                <MyReservationsList
                  reservations={reservations}
                  reservationsLoading={reservationsLoading}
                  reservationsError={reservationsError}
                  onCancelReservation={(id) => {
                    // 예약 취소 로직 추가 예정
                    console.log('예약 취소:', id);
                  }}
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
      <ReservationDetailModal />
      <CancelReservationModal />
    </div>
  );
}
