'use client';

import { use, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Search,
  ArrowLeft,
  User,
  Loader2,
  Building2,
  Clock,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import client from '@/lib/backend/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format, parse, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

type InstructorSimpleResponseDto = {
  instructorId: number;
  name: string;
  description: string;
};

type FacilitySimpleResponseDto = {
  facilityId: number;
  facilityName: string;
  description: string;
  openTime: string;
  closeTime: string;
};

type TimeSlotSimpleResponseDto = {
  timeSlotId: number;
  scheduleName: string;
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  reservedCount: number;
  isFull: boolean;
};

type InstructorScheduleResponseDto = TimeSlotSimpleResponseDto;

export default function InstructorsPage({
  params,
}: {
  params: Promise<{ facilityId: number }>;
}) {
  const { facilityId } = use(params);
  const router = useRouter();
  const [facility, setFacility] = useState<FacilitySimpleResponseDto | null>(
    null
  );
  const [instructors, setInstructors] = useState<InstructorSimpleResponseDto[]>(
    []
  );
  const [filteredInstructors, setFilteredInstructors] = useState<
    InstructorSimpleResponseDto[]
  >([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [facilityLoading, setFacilityLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facilityError, setFacilityError] = useState<string | null>(null);
  const [selectedInstructor, setSelectedInstructor] =
    useState<InstructorSimpleResponseDto | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [schedules, setSchedules] = useState<InstructorScheduleResponseDto[]>(
    []
  );
  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] =
    useState<InstructorScheduleResponseDto | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [reservationLoading, setReservationLoading] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');

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
      return time;
    }
  };

  const formatOperatingHours = (openTime: string, closeTime: string) => {
    if (!openTime || !closeTime) return '운영시간 정보 없음';

    const openHour = parseInt(openTime.split(':')[0]);
    const closeHour = parseInt(closeTime.split(':')[0]);

    if (closeHour < openHour || closeHour === 0) {
      return `운영시간: ${formatTime(openTime)} - 익일 ${formatTime(
        closeTime
      )}`;
    }

    return `운영시간: ${formatTime(openTime)} - ${formatTime(closeTime)}`;
  };

  const fetchFacility = async () => {
    try {
      setFacilityLoading(true);
      setFacilityError(null);
      const response = await client.GET('/api/v1/facilities/{facilityId}', {
        params: {
          path: {
            facilityId: facilityId,
          },
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (
        response.data &&
        typeof response.data === 'object' &&
        'facilityId' in response.data &&
        'facilityName' in response.data
      ) {
        setFacility(response.data as FacilitySimpleResponseDto);
      } else {
        setFacilityError('시설 정보를 불러올 수 없습니다.');
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        setFacilityError('접근 권한이 없습니다.');
      } else {
        setFacilityError('시설 정보를 불러오는데 실패했습니다.');
      }
    } finally {
      setFacilityLoading(false);
    }
  };

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await client.GET(
        '/api/v1/facilities/{facilityId}/instructors',
        {
          params: {
            path: {
              facilityId: facilityId,
            },
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data) {
        const instructorList = response.data as InstructorSimpleResponseDto[];
        setInstructors(instructorList);
        setFilteredInstructors(instructorList);
      } else {
        setError('강사 목록을 불러올 수 없습니다.');
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        setError('접근 권한이 없습니다.');
      } else {
        setError('강사 목록을 불러오는데 실패했습니다.');
      }
      setInstructors([]);
      setFilteredInstructors([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructorSchedules = async (
    instructorId: number,
    selectedDate: Date
  ) => {
    try {
      setSchedulesLoading(true);
      setSchedulesError(null);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

      const response = await client.GET(
        '/api/v1/facilities/{facilityId}/instructors/{instructorId}/schedules',
        {
          params: {
            path: {
              facilityId: facilityId,
              instructorId: instructorId,
            },
            query: {
              startDate: formattedDate,
              endDate: formattedDate,
            },
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data) {
        setSchedules(response.data as InstructorScheduleResponseDto[]);
      } else {
        setSchedulesError('스케줄 정보를 불러올 수 없습니다.');
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        setSchedulesError('접근 권한이 없습니다.');
      } else {
        setSchedulesError('스케줄 정보를 불러오는데 실패했습니다.');
      }
      setSchedules([]);
    } finally {
      setSchedulesLoading(false);
    }
  };

  useEffect(() => {
    fetchFacility();
    fetchInstructors();
  }, [facilityId]);

  useEffect(() => {
    if (selectedInstructor && date) {
      fetchInstructorSchedules(selectedInstructor.instructorId, date);
    } else {
      setSchedules([]);
    }
  }, [selectedInstructor, date]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const keyword = e.target.value.toLowerCase();
    setSearchKeyword(keyword);

    if (!instructors.length) {
      setFilteredInstructors([]);
      return;
    }

    const filtered = instructors.filter(
      (instructor) =>
        instructor.name.toLowerCase().includes(keyword) ||
        instructor.description.toLowerCase().includes(keyword)
    );
    setFilteredInstructors(filtered);
  };

  const handleInstructorSelect = (instructor: InstructorSimpleResponseDto) => {
    if (selectedInstructor?.instructorId === instructor.instructorId) {
      setSelectedInstructor(null);
    } else {
      setSelectedInstructor(instructor);
    }
  };

  const handleBack = () => {
    router.back();
  };

  //예약 신청하기
  const handleScheduleSelect = (schedule: InstructorScheduleResponseDto) => {
    setSelectedSchedule(schedule);
  };

  const handleNextStep = () => {
    if (!selectedInstructor || !date || !selectedSchedule) return;
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    if (!selectedInstructor || !date || !selectedSchedule) return;

    try {
      setReservationLoading(true);
      const response = await client.POST('/api/v1/facilities/reservations', {
        body: {
          timeSlotId: selectedSchedule.timeSlotId,
          requestMessage: requestMessage,
        },
      });

      // 성공적으로 예약 ID가 반환된 경우에만 성공 처리
      if (typeof response.data === 'number') {
        setShowConfirmModal(false);
        setShowSuccessModal(true);
        setRequestMessage('');
      } else {
        throw new Error('예약 처리 중 오류가 발생했습니다.');
      }
    } catch (error: any) {
      setShowConfirmModal(false);

      // 에러 메시지 추출 로직 수정
      let errorMsg = '예약에 실패했습니다.';

      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMsg = error.response.data;
        } else if (typeof error.response.data.message === 'string') {
          errorMsg = error.response.data.message;
        } else if (typeof error.response.data.error === 'string') {
          errorMsg = error.response.data.error;
        }
      }

      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    } finally {
      setReservationLoading(false);
    }
  };

  return (
    <div className="p-4 min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="p-0 hover:bg-transparent"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">공용시설 예약</h1>
          <p className="text-muted-foreground mt-1">
            신청하신 공용시설 예약은 시설 담당자의 확인 및 승인 이후 확정
            처리됩니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div
          className={`${
            selectedInstructor ? 'col-span-12 lg:col-span-5' : 'col-span-12'
          } space-y-6`}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              {facilityLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
                  <span className="ml-2 text-pink-500">
                    시설 정보를 불러오는 중...
                  </span>
                </div>
              ) : facilityError ? (
                <div className="text-center text-red-500 py-4">
                  {facilityError}
                </div>
              ) : (
                facility && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Building2 className="w-6 h-6 text-pink-700 mt-1" />
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                          {facility.facilityName}
                        </h2>
                        <p className="text-gray-600 mt-1">
                          {facility.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">
                            {formatOperatingHours(
                              facility.openTime,
                              facility.closeTime
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-pink-700" />
                <h2 className="text-xl font-semibold text-gray-800">
                  강사 조회
                </h2>
              </div>

              <div className="relative mb-6">
                <Input
                  type="text"
                  placeholder="강사 검색..."
                  value={searchKeyword}
                  onChange={handleSearch}
                  className="pl-10 bg-white border-gray-300 focus:border-pink-500 focus:ring-pink-500"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>

              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
                  <span className="ml-2 text-pink-500">
                    강사 목록을 불러오는 중...
                  </span>
                </div>
              )}

              {error && (
                <div className="text-center text-red-500 py-8">{error}</div>
              )}

              {!loading && filteredInstructors.length === 0 && (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">
                    {searchKeyword
                      ? '검색 결과가 없습니다.'
                      : '등록된 강사가 없습니다.'}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {filteredInstructors.map((instructor) => (
                  <Card
                    key={instructor.instructorId}
                    className={`overflow-hidden hover:shadow-md transition-all duration-300 bg-white border-l-4 ${
                      selectedInstructor?.instructorId ===
                      instructor.instructorId
                        ? 'border-l-pink-700 bg-pink-50'
                        : 'border-l-pink-500'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <User className="w-6 h-6 text-pink-700" />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              {instructor.name}
                            </h3>
                            <p className="text-gray-600">
                              {instructor.description}
                            </p>
                          </div>
                        </div>
                        {selectedInstructor?.instructorId !==
                          instructor.instructorId && (
                          <Button
                            onClick={() => handleInstructorSelect(instructor)}
                            className="bg-pink-50 hover:bg-pink-100 text-pink-700 text-sm font-semibold py-1.5 px-3 rounded-lg transition-colors duration-300"
                          >
                            선택
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedInstructor && (
          <Card className="border-0 shadow-sm col-span-12 lg:col-span-7">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-pink-700" />
                  <h2 className="text-xl font-semibold text-gray-800">
                    예약 일정 조회
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedInstructor(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-medium text-gray-800 mb-3">
                    날짜 선택
                  </h3>
                  <div className="border rounded-lg bg-white">
                    <CalendarComponent
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      locale={ko}
                      className="w-full"
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const targetDate = new Date(date);
                        targetDate.setHours(0, 0, 0, 0);
                        return targetDate < today;
                      }}
                      initialFocus
                      classNames={{
                        months: 'space-y-4',
                        month: 'space-y-4',
                        caption:
                          'flex justify-center pt-1 relative items-center px-10',
                        caption_label: 'text-base font-medium',
                        nav: 'space-x-1 flex items-center',
                        nav_button:
                          'h-9 w-9 bg-transparent p-0 opacity-50 hover:opacity-100 absolute',
                        nav_button_previous: 'left-1',
                        nav_button_next: 'right-1',
                        table: 'w-full border-collapse',
                        head_row: 'flex w-full',
                        head_cell:
                          'text-gray-500 rounded-md w-full font-medium text-[0.875rem] dark:text-gray-400',
                        row: 'flex w-full mt-2',
                        cell: 'text-center relative p-0 text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-gray-100/50 [&:has([aria-selected])]:bg-gray-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:z-20 h-14 w-full',
                        day: 'h-14 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-lg transition-colors',
                        day_range_end: 'day-range-end',
                        day_selected:
                          'bg-pink-500 text-white hover:bg-pink-600 hover:text-white focus:bg-pink-500 focus:text-white rounded-lg',
                        day_today:
                          'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50',
                        day_outside:
                          'day-outside opacity-50 aria-selected:bg-gray-100/50 aria-selected:text-gray-500 aria-selected:opacity-30 dark:aria-selected:bg-gray-800/50 dark:aria-selected:text-gray-400',
                        day_disabled:
                          'text-gray-300 dark:text-gray-600 hover:bg-transparent',
                        day_hidden: 'invisible',
                      }}
                      components={{
                        IconLeft: () => <ChevronLeft className="h-5 w-5" />,
                        IconRight: () => <ChevronRight className="h-5 w-5" />,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-medium text-gray-800 mb-3">
                    시간 선택
                  </h3>
                  <div className="border rounded-lg bg-white p-4">
                    {schedulesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
                        <span className="ml-2 text-pink-500">
                          스케줄을 불러오는 중...
                        </span>
                      </div>
                    ) : schedulesError ? (
                      <div className="text-center text-red-500 py-8">
                        {schedulesError}
                      </div>
                    ) : !date ? (
                      <div className="text-center text-gray-500 py-8">
                        <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>날짜를 선택해주세요.</p>
                      </div>
                    ) : schedules.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>예약 가능한 시간이 없습니다.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {schedules.map((schedule) => {
                          const uniqueKey = `schedule-${schedule.timeSlotId}-${schedule.startTime}-${schedule.endTime}`;
                          const isDisabled =
                            schedule.reservedCount >= schedule.maxCapacity ||
                            (isSameDay(date!, new Date()) &&
                              parse(
                                schedule.startTime,
                                'HH:mm:ss',
                                new Date()
                              ) <= new Date());
                          const isSelected =
                            selectedSchedule?.timeSlotId ===
                            schedule.timeSlotId;

                          return (
                            <button
                              key={uniqueKey}
                              disabled={isDisabled}
                              onClick={() =>
                                !isDisabled && handleScheduleSelect(schedule)
                              }
                              className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-colors ${
                                isDisabled
                                  ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-pink-50 border-pink-500'
                                  : 'bg-white border border-gray-200'
                              }`}
                            >
                              <span
                                className={`font-medium ${
                                  isDisabled
                                    ? 'text-gray-400'
                                    : isSelected
                                    ? 'text-pink-700'
                                    : 'text-gray-900'
                                }`}
                              >
                                {format(
                                  new Date(
                                    `2000-01-01T${formatTime(
                                      schedule.startTime
                                    )}`
                                  ),
                                  'HH:mm'
                                )}{' '}
                                ~{' '}
                                {format(
                                  new Date(
                                    `2000-01-01T${formatTime(schedule.endTime)}`
                                  ),
                                  'HH:mm'
                                )}
                              </span>
                              <span
                                className={`text-sm mt-1 ${
                                  isDisabled
                                    ? 'text-gray-400'
                                    : isSelected
                                    ? 'text-pink-600'
                                    : 'text-gray-500'
                                }`}
                              >
                                {schedule.reservedCount}/{schedule.maxCapacity}
                                명
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {selectedSchedule && (
                  <div className="flex justify-end mt-6">
                    <Button
                      onClick={handleNextStep}
                      className="bg-pink-500 hover:bg-pink-600 text-white px-6"
                    >
                      다음 단계
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>예약 확인</DialogTitle>
            <DialogDescription>아래 예약 정보를 확인해주세요</DialogDescription>
          </DialogHeader>
          {selectedSchedule && (
            <div className="py-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">시설명</span>
                  <span className="font-semibold">
                    {facility?.facilityName}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">강사명</span>
                  <span className="font-semibold">
                    {selectedInstructor?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">예약 날짜</span>
                  <span className="font-semibold">
                    {date && format(date, 'yyyy년 M월 d일')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">프로그램명</span>
                  <span className="font-semibold">
                    {selectedSchedule.scheduleName}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">예약 시간</span>
                  <span className="font-semibold">
                    {format(
                      new Date(
                        `2000-01-01T${formatTime(selectedSchedule.startTime)}`
                      ),
                      'HH:mm'
                    )}{' '}
                    ~{' '}
                    {format(
                      new Date(
                        `2000-01-01T${formatTime(selectedSchedule.endTime)}`
                      ),
                      'HH:mm'
                    )}
                  </span>
                </div>
                <div className="py-2">
                  <span className="text-gray-600 block mb-2">요청사항</span>
                  <Input
                    placeholder="(선택사항) 예약 시 요청사항을 입력해주세요"
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    className="w-full"
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {requestMessage.length}/200자
                  </p>
                </div>
              </div>
              <DialogFooter className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1"
                  disabled={reservationLoading}
                >
                  취소
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
                  disabled={reservationLoading}
                >
                  {reservationLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      예약 중...
                    </>
                  ) : (
                    '예약하기'
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>예약 완료</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6">
            <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              성공적으로 예약되었습니다
            </h2>
            <p className="text-gray-600 text-center">
              시설 담당자의 확인 및 승인 이후 확정 처리됩니다.
            </p>
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                router.push('/udash/facilities');
              }}
              className="mt-6 bg-pink-500 hover:bg-pink-600 text-white"
            >
              예약 내역 확인하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">예약 실패</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6">
            <XCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              예약에 실패했습니다.
            </h2>
            <p className="text-gray-600 text-center whitespace-pre-line">
              {errorMessage}
            </p>
            <Button
              onClick={() => {
                setShowErrorModal(false);
              }}
              className="mt-6 bg-red-500 hover:bg-red-600 text-white px-8"
            >
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
