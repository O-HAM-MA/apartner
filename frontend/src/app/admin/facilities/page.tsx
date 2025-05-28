'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import koLocale from '@fullcalendar/core/locales/ko';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  MoreHorizontal,
  Plus,
  Edit,
  Trash,
  Calendar as CalendarIcon,
  Table as TableIcon,
  Building2,
  CalendarDays,
  Check,
  X,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import client from '@/lib/backend/client';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: number;
}

interface FacilitySimpleResponseDto {
  facilityId: number;
  facilityName: string;
  description: string;
  openTime: string;
  closeTime: string;
}

interface TimeSlotResponse {
  timeSlotId: number;
  scheduleName: string;
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  reservedCount: number;
  isFull: boolean;
}

interface FacilityApiResponse {
  facilityId: number;
  facilityName: string;
  description?: string;
  openTime: string;
  closeTime: string;
}

type Facility = {
  id: number;
  name: string;
  description: string;
  openTime: string;
  closeTime: string;
  status: string;
};

type Instructor = {
  id: number;
  name: string;
  description: string;
};

type TimeSlot = {
  timeSlotId: number;
  scheduleName: string;
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  reservedCount: number;
  isFull: boolean;
};

// 예약 상태 타입 수정
type ReservationStatus = 'AGREE' | 'PENDING' | 'REJECT' | 'CANCEL';

// 예약 정보 타입 추가
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

// 예약 상세 정보 타입 추가
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

export default function FacilitiesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('facilities');

  // 시간 형식을 'HH:mm' 형식으로 변환하는 함수
  const formatTimeToHHMM = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  };

  // 요일 변환 함수 추가
  const getDayOfWeek = (date: string) => {
    const days = [
      '일요일',
      '월요일',
      '화요일',
      '수요일',
      '목요일',
      '금요일',
      '토요일',
    ];
    const dayIndex = new Date(date).getDay();
    return days[dayIndex];
  };

  // 날짜 포맷 함수 추가
  const formatDateWithDay = (date: string) => {
    return `${date}-${getDayOfWeek(date)}`;
  };

  // 시간 포맷 함수 추가
  const formatTimeRange = (startTime: string, endTime: string) => {
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    };
    return `${formatTime(startTime)}-${formatTime(endTime)}`;
  };

  // 주소 포맷팅 함수 추가
  const formatAddress = (building: string, unit: string) => {
    return `${building}동 ${unit}호`;
  };

  // 날짜 포맷팅 함수 추가
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

  // 시설 관련 상태
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(
    null
  );
  const [facilitySearchTerm, setFacilitySearchTerm] = useState('');
  const [isAddFacilityDialogOpen, setIsAddFacilityDialogOpen] = useState(false);
  const [isEditFacilityDialogOpen, setIsEditFacilityDialogOpen] =
    useState(false);
  const [isDeleteFacilityDialogOpen, setIsDeleteFacilityDialogOpen] =
    useState(false);
  const [newFacility, setNewFacility] = useState({
    name: '',
    description: '',
    openTime: '09:00',
    closeTime: '18:00',
  });

  // 강사 관련 상태
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedInstructor, setSelectedInstructor] =
    useState<Instructor | null>(null);
  const [instructorSearchTerm, setInstructorSearchTerm] = useState('');
  const [isAddInstructorDialogOpen, setIsAddInstructorDialogOpen] =
    useState(false);
  const [isEditInstructorDialogOpen, setIsEditInstructorDialogOpen] =
    useState(false);
  const [isDeleteInstructorDialogOpen, setIsDeleteInstructorDialogOpen] =
    useState(false);
  const [newInstructor, setNewInstructor] = useState({
    name: '',
    description: '',
  });

  // 타임슬롯 관련 상태
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [isAddTimeSlotDialogOpen, setIsAddTimeSlotDialogOpen] = useState(false);
  const [isDeleteTimeSlotDialogOpen, setIsDeleteTimeSlotDialogOpen] =
    useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  const [searchDateRange, setSearchDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
      .toISOString()
      .split('T')[0],
  });
  const [newTimeSlot, setNewTimeSlot] = useState({
    scheduleName: '',
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '18:00',
    slotMinutes: 60,
    capacity: 20,
    periodStart: new Date().toISOString().split('T')[0],
    periodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1))
      .toISOString()
      .split('T')[0],
  });

  // 예약 관련 상태 추가
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationSearchTerm, setReservationSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'ALL'>(
    'ALL'
  );
  const [facilityFilter, setFacilityFilter] = useState('ALL');
  const [uniqueFacilities, setUniqueFacilities] = useState<string[]>([]);

  // 예약 상세 관련 상태 추가
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<ReservationDetail | null>(null);

  const dayOfWeekOptions = [
    { value: 'MONDAY', label: '월요일' },
    { value: 'TUESDAY', label: '화요일' },
    { value: 'WEDNESDAY', label: '수요일' },
    { value: 'THURSDAY', label: '목요일' },
    { value: 'FRIDAY', label: '금요일' },
    { value: 'SATURDAY', label: '토요일' },
    { value: 'SUNDAY', label: '일요일' },
  ];

  // 시간 형식 변환 함수들
  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${parseInt(hours)}:${minutes}`;
  };

  const formatOperatingHours = (openTime: string, closeTime: string) => {
    const openHour = parseInt(openTime.split(':')[0]);
    const closeHour = parseInt(closeTime.split(':')[0]);

    if (closeHour < openHour || closeHour === 0) {
      return `${openTime} - 익일 ${closeTime}`;
    }
    return `${openTime} - ${closeTime}`;
  };

  // API 호출 함수들
  const fetchFacilities = async () => {
    try {
      const { data } = await client.GET('/api/v1/admin/facilities' as any, {
        params: {
          query: {
            page: '0',
            size: '100',
            sort: 'desc',
          },
        },
      });

      if (data) {
        setFacilities(
          data.map((item: FacilitySimpleResponseDto) => ({
            id: item.facilityId,
            name: item.facilityName,
            description: item.description || '',
            openTime: formatTimeDisplay(item.openTime),
            closeTime: formatTimeDisplay(item.closeTime),
            status: 'AVAILABLE',
          }))
        );
      }
    } catch (error) {
      console.error('시설 목록 조회 실패:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '시설 목록을 불러오는데 실패했습니다.',
      });
    }
  };

  const fetchInstructors = async (facilityId: number) => {
    try {
      const response = await client.GET(
        '/api/v1/admin/facilities/{facilityId}/instructors',
        {
          params: {
            path: {
              facilityId,
            },
          },
        }
      );

      if (response.data) {
        setInstructors(
          response.data.map((item: any) => ({
            id: item.instructorId,
            name: item.name,
            description: item.description || '',
          }))
        );
      }
    } catch (error) {
      console.error('강사 목록 조회 실패:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '강사 목록을 불러오는데 실패했습니다.',
      });
    }
  };

  const fetchTimeSlots = async (facilityId: number, instructorId: number) => {
    try {
      const response = await client.GET(
        '/api/v1/admin/facilities/{facilityId}/instructors/{instructorId}/schedules/timeslots',
        {
          params: {
            path: {
              facilityId,
              instructorId,
            },
            query: {
              startDate: searchDateRange.startDate,
              endDate: searchDateRange.endDate,
            },
          },
        }
      );

      if (response.data) {
        setTimeSlots(
          response.data.map((item: any) => ({
            timeSlotId: item.timeSlotId,
            scheduleName: item.scheduleName,
            date: item.date,
            startTime: item.startTime,
            endTime: item.endTime,
            maxCapacity: item.maxCapacity,
            reservedCount: item.reservedCount,
            isFull: item.isFull,
          }))
        );
      }
    } catch (error) {
      console.error('타임슬롯 목록 조회 실패:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '타임슬롯 목록을 불러오는데 실패했습니다.',
      });
    }
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

  // 이벤트 핸들러들
  const handleFacilitySelect = (facility: Facility) => {
    if (selectedFacility?.id === facility.id) {
      setSelectedFacility(null);
      setSelectedInstructor(null);
    } else {
      setSelectedFacility(facility);
      setSelectedInstructor(null);
      fetchInstructors(facility.id);
    }
  };

  const handleInstructorSelect = (instructor: Instructor) => {
    if (selectedInstructor?.id === instructor.id) {
      setSelectedInstructor(null);
    } else {
      setSelectedInstructor(instructor);
      if (selectedFacility) {
        fetchTimeSlots(selectedFacility.id, instructor.id);
      }
    }
  };

  // 캘린더 이벤트 변환
  const calendarEvents = timeSlots.map((slot) => ({
    id: String(slot.timeSlotId),
    title: `${slot.scheduleName} (${slot.startTime}~${slot.endTime})${
      slot.isFull ? ' [마감]' : ''
    }`,
    start: `${slot.date}T${slot.startTime}`,
    end: `${slot.date}T${slot.endTime}`,
    allDay: false,
    classNames: slot.isFull
      ? ['cursor-pointer', 'bg-red-50']
      : ['cursor-pointer', 'hover:bg-red-100', 'active:bg-red-200'],
    extendedProps: slot,
  }));

  // 시설 관련 핸들러
  const handleAddFacility = async () => {
    if (!newFacility.name.trim()) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '시설 이름을 입력해주세요.',
      });
      return;
    }

    // 시설명 중복 체크
    const isDuplicate = facilities.some(
      (facility) =>
        facility.name.toLowerCase() === newFacility.name.trim().toLowerCase()
    );

    if (isDuplicate) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '이미 운영 중인 시설 이름입니다.',
      });
      return;
    }

    if (!newFacility.description.trim()) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '시설 설명을 입력해주세요.',
      });
      return;
    }

    try {
      await client.POST('/api/v1/admin/facilities', {
        body: {
          name: newFacility.name,
          description: newFacility.description,
          openTime: formatTimeToHHMM(newFacility.openTime),
          closeTime: formatTimeToHHMM(newFacility.closeTime),
        },
      });

      toast({
        title: '성공',
        description: '시설이 등록되었습니다.',
      });
      setIsAddFacilityDialogOpen(false);
      setNewFacility({
        name: '',
        description: '',
        openTime: '09:00',
        closeTime: '18:00',
      });
      fetchFacilities();
    } catch (error: any) {
      console.error('시설 등록 실패:', error);
      toast({
        variant: 'destructive',
        title: '등록 실패',
        description: error?.response?.data || '시설 등록에 실패했습니다.',
      });
    }
  };

  const handleEditFacility = async () => {
    if (!selectedFacility) return;

    if (!selectedFacility.name.trim()) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '시설 이름을 입력해주세요.',
      });
      return;
    }

    // 시설명 중복 체크 (자기 자신은 제외)
    const isDuplicate = facilities.some(
      (facility) =>
        facility.id !== selectedFacility.id &&
        facility.name.toLowerCase() ===
          selectedFacility.name.trim().toLowerCase()
    );

    if (isDuplicate) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '이미 운영 중인 시설 이름입니다.',
      });
      return;
    }

    try {
      await client.PUT('/api/v1/admin/facilities/{facilityId}', {
        params: {
          path: {
            facilityId: selectedFacility.id,
          },
        },
        body: {
          name: selectedFacility.name,
          description: selectedFacility.description,
          openTime: `${selectedFacility.openTime}:00`,
          closeTime: `${selectedFacility.closeTime}:00`,
        },
      });

      toast({
        title: '성공',
        description: '시설 정보가 수정되었습니다.',
      });
      setIsEditFacilityDialogOpen(false);
      fetchFacilities();
    } catch (error: any) {
      console.error('시설 수정 실패:', error);
      toast({
        variant: 'destructive',
        title: '수정 실패',
        description: error?.response?.data || '시설 수정에 실패했습니다.',
      });
    }
  };

  const handleDeleteFacility = async () => {
    if (!selectedFacility) return;

    try {
      await client.DELETE('/api/v1/admin/facilities/{facilityId}', {
        params: {
          path: {
            facilityId: selectedFacility.id,
          },
        },
      });

      toast({
        title: '성공',
        description: '시설이 삭제되었습니다.',
      });
      setIsDeleteFacilityDialogOpen(false);
      setSelectedFacility(null);
      fetchFacilities();
    } catch (error: any) {
      console.error('시설 삭제 실패:', error);
      toast({
        variant: 'destructive',
        title: '삭제 실패',
        description: error?.response?.data || '시설 삭제에 실패했습니다.',
      });
    }
  };

  // 강사 관련 핸들러
  const handleAddInstructor = async () => {
    if (!selectedFacility) return;

    try {
      await client.POST('/api/v1/admin/facilities/{facilityId}/instructors', {
        params: {
          path: {
            facilityId: selectedFacility.id,
          },
        },
        body: newInstructor,
      });

      toast({
        title: '성공',
        description: '강사가 등록되었습니다.',
      });
      setIsAddInstructorDialogOpen(false);
      setNewInstructor({
        name: '',
        description: '',
      });
      fetchInstructors(selectedFacility.id);
    } catch (error: any) {
      console.error('강사 등록 실패:', error);
      toast({
        variant: 'destructive',
        title: '등록 실패',
        description: error?.response?.data || '강사 등록에 실패했습니다.',
      });
    }
  };

  const handleEditInstructor = async () => {
    if (!selectedFacility || !selectedInstructor) return;

    try {
      await client.PUT(
        '/api/v1/admin/facilities/{facilityId}/instructors/{instructorId}',
        {
          params: {
            path: {
              facilityId: selectedFacility.id,
              instructorId: selectedInstructor.id,
            },
          },
          body: {
            name: selectedInstructor.name,
            description: selectedInstructor.description,
          },
        }
      );

      toast({
        title: '성공',
        description: '강사 정보가 수정되었습니다.',
      });
      setIsEditInstructorDialogOpen(false);
      fetchInstructors(selectedFacility.id);
    } catch (error: any) {
      console.error('강사 수정 실패:', error);
      toast({
        variant: 'destructive',
        title: '수정 실패',
        description: error?.response?.data || '강사 수정에 실패했습니다.',
      });
    }
  };

  const handleDeleteInstructor = async () => {
    if (!selectedFacility || !selectedInstructor) return;

    try {
      await client.DELETE(
        '/api/v1/admin/facilities/{facilityId}/instructors/{instructorId}',
        {
          params: {
            path: {
              facilityId: selectedFacility.id,
              instructorId: selectedInstructor.id,
            },
          },
        }
      );

      toast({
        title: '성공',
        description: '강사가 삭제되었습니다.',
      });
      setIsDeleteInstructorDialogOpen(false);
      setSelectedInstructor(null);
      fetchInstructors(selectedFacility.id);
    } catch (error: any) {
      console.error('강사 삭제 실패:', error);
      toast({
        variant: 'destructive',
        title: '삭제 실패',
        description: error?.response?.data || '강사 삭제에 실패했습니다.',
      });
    }
  };

  // 타임슬롯 관련 핸들러
  const handleAddTimeSlot = async () => {
    if (!selectedFacility || !selectedInstructor) return;

    if (!newTimeSlot.scheduleName.trim()) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '프로그램명을 입력해주세요.',
      });
      return;
    }

    if (newTimeSlot.endTime <= newTimeSlot.startTime) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '종료 시간은 시작 시간보다 늦어야 합니다.',
      });
      return;
    }

    if (newTimeSlot.periodEnd < newTimeSlot.periodStart) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '종료일은 시작일보다 늦어야 합니다.',
      });
      return;
    }

    try {
      await client.POST(
        '/api/v1/admin/facilities/{facilityId}/instructors/{instructorId}/schedules',
        {
          params: {
            path: {
              facilityId: selectedFacility.id,
              instructorId: selectedInstructor.id,
            },
          },
          body: {
            scheduleName: newTimeSlot.scheduleName,
            dayOfWeek: newTimeSlot.dayOfWeek,
            startTime: newTimeSlot.startTime,
            endTime: newTimeSlot.endTime,
            slotMinutes: Number(newTimeSlot.slotMinutes),
            capacity: Number(newTimeSlot.capacity),
            periodStart: newTimeSlot.periodStart,
            periodEnd: newTimeSlot.periodEnd,
          },
        }
      );

      toast({
        title: '성공',
        description: '강사 일정이 등록되었습니다.',
      });
      setIsAddTimeSlotDialogOpen(false);
      setNewTimeSlot({
        scheduleName: '',
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '18:00',
        slotMinutes: 60,
        capacity: 20,
        periodStart: new Date().toISOString().split('T')[0],
        periodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1))
          .toISOString()
          .split('T')[0],
      });
      fetchTimeSlots(selectedFacility.id, selectedInstructor.id);
    } catch (error: any) {
      console.error('강사 일정 등록 실패:', error);
      toast({
        variant: 'destructive',
        title: '등록 실패',
        description:
          error?.response?.data?.message || '강사 일정 등록에 실패했습니다.',
      });
    }
  };

  const handleDeleteTimeSlot = async () => {
    if (!selectedFacility || !selectedInstructor || !selectedTimeSlot) return;

    try {
      await client.DELETE(
        '/api/v1/admin/facilities/{facilityId}/instructors/{instructorId}/schedules/timeslots/{timeSlotId}',
        {
          params: {
            path: {
              facilityId: selectedFacility.id,
              instructorId: selectedInstructor.id,
              timeSlotId: selectedTimeSlot.timeSlotId,
            },
          },
        }
      );

      toast({
        title: '성공',
        description: '타임슬롯이 삭제되었습니다.',
      });
      setIsDeleteTimeSlotDialogOpen(false);
      fetchTimeSlots(selectedFacility.id, selectedInstructor.id);
    } catch (error: any) {
      console.error('타임슬롯 삭제 실패:', error);
      toast({
        variant: 'destructive',
        title: '삭제 실패',
        description: error?.response?.data || '타임슬롯 삭제에 실패했습니다.',
      });
    }
  };

  // searchDateRange가 변경될 때마다 타임슬롯을 다시 불러오는 useEffect 추가
  useEffect(() => {
    if (selectedFacility && selectedInstructor) {
      fetchTimeSlots(selectedFacility.id, selectedInstructor.id);
    }
  }, [searchDateRange.startDate, searchDateRange.endDate]);

  useEffect(() => {
    fetchFacilities();
  }, []);

  useEffect(() => {
    if (activeTab === 'reservations') {
      fetchReservations();
    }
  }, [activeTab]);

  // 예약 상세 조회 함수
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
          reservationId: response.data.reservationId ?? 0,
          applicantName: response.data.applicantName ?? '',
          building: response.data.building ?? '',
          unit: response.data.unit ?? '',
          facilityName: response.data.facilityName ?? '',
          instructorName: response.data.instructorName ?? '',
          programName: response.data.programName ?? '',
          reservationDateTime: response.data.reservationDateTime ?? '',
          createdAt: response.data.createdAt
            ? formatDateTime(response.data.createdAt)
            : '',
          status: response.data.status as ReservationStatus,
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

  return (
    <div className="container-fluid p-6 max-w-[2000px] mx-auto">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          공용시설 예약 및 확인
        </h1>
        <p className="text-muted-foreground mt-1">
          아파트 공용시설을 관리하고 예약 현황을 확인할 수 있습니다.
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="facilities" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            시설 관리
          </TabsTrigger>
          <TabsTrigger value="reservations" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            예약 관리
          </TabsTrigger>
        </TabsList>

        <TabsContent value="facilities">
          {/* 시설 관리 컨텐츠 */}
          <div className="grid grid-cols-12 gap-6">
            {/* 시설 목록 섹션 */}
            <div
              className={`${
                selectedFacility ? 'col-span-5 lg:col-span-5' : 'col-span-12'
              } transition-all duration-300`}
            >
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>시설 목록</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => setIsAddFacilityDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" /> 시설 추가
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="시설명으로 검색..."
                        className="pl-8"
                        value={facilitySearchTerm}
                        onChange={(e) => setFacilitySearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {facilities
                      .filter((facility) =>
                        facility.name
                          .toLowerCase()
                          .includes(facilitySearchTerm.toLowerCase())
                      )
                      .map((facility) => (
                        <Card
                          key={facility.id}
                          className={`cursor-pointer hover:bg-accent ${
                            selectedFacility?.id === facility.id
                              ? 'border-primary bg-accent'
                              : ''
                          }`}
                          onClick={() => handleFacilitySelect(facility)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">
                                  {facility.name}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {formatOperatingHours(
                                    facility.openTime,
                                    facility.closeTime
                                  )}
                                </p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  asChild
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedFacility(facility);
                                      setIsEditFacilityDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="w-4 h-4 mr-2" /> 수정
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedFacility(facility);
                                      setIsDeleteFacilityDialogOpen(true);
                                    }}
                                  >
                                    <Trash className="w-4 h-4 mr-2" /> 삭제
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 강사 목록 섹션 */}
            {selectedFacility && (
              <div
                className={`col-span-7 lg:col-span-7 transition-all duration-300`}
              >
                <Card className="h-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>강사 목록</CardTitle>
                      <CardDescription>{selectedFacility.name}</CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setIsAddInstructorDialogOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" /> 강사 추가
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="강사명으로 검색..."
                          className="pl-8"
                          value={instructorSearchTerm}
                          onChange={(e) =>
                            setInstructorSearchTerm(e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      {instructors
                        .filter((instructor) =>
                          instructor.name
                            .toLowerCase()
                            .includes(instructorSearchTerm.toLowerCase())
                        )
                        .map((instructor) => (
                          <Card
                            key={instructor.id}
                            className={`cursor-pointer hover:bg-accent ${
                              selectedInstructor?.id === instructor.id
                                ? 'border-primary bg-accent'
                                : ''
                            }`}
                            onClick={() => handleInstructorSelect(instructor)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold">
                                    {instructor.name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {instructor.description}
                                  </p>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    asChild
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedInstructor(instructor);
                                        setIsEditInstructorDialogOpen(true);
                                      }}
                                    >
                                      <Edit className="w-4 h-4 mr-2" /> 수정
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedInstructor(instructor);
                                        setIsDeleteInstructorDialogOpen(true);
                                      }}
                                    >
                                      <Trash className="w-4 h-4 mr-2" /> 삭제
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 타임슬롯 섹션 */}
            {selectedFacility && selectedInstructor && (
              <div className="col-span-12">
                <Card className="h-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>스케줄 관리</CardTitle>
                      <CardDescription>
                        {selectedFacility.name} - {selectedInstructor.name}{' '}
                        강사의 수업 일정
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={
                          viewMode === 'calendar' ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() => setViewMode('calendar')}
                      >
                        <CalendarIcon className="w-4 h-4 mr-1" /> 캘린더
                      </Button>
                      <Button
                        variant={viewMode === 'table' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('table')}
                      >
                        <TableIcon className="w-4 h-4 mr-1" /> 테이블
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setIsAddTimeSlotDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-1" /> 일정 추가
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {viewMode === 'table' && (
                      <div className="flex justify-end gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Label className="whitespace-nowrap">조회기간</Label>
                          <Input
                            type="date"
                            value={searchDateRange.startDate}
                            onChange={(e) =>
                              setSearchDateRange((prev) => ({
                                ...prev,
                                startDate: e.target.value,
                              }))
                            }
                          />
                          <span className="flex items-center">~</span>
                          <Input
                            type="date"
                            value={searchDateRange.endDate}
                            onChange={(e) =>
                              setSearchDateRange((prev) => ({
                                ...prev,
                                endDate: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                    {viewMode === 'calendar' ? (
                      <div className="h-[calc(100vh-300px)] min-h-[700px]">
                        <style jsx global>{`
                          .fc .fc-button,
                          .fc .fc-today-button {
                            background-color: transparent !important;
                            border: 1px solid hsl(var(--border));
                            color: hsl(var(--foreground));
                            font-size: 0.875rem;
                            height: 2.25rem;
                            padding-left: 0.75rem;
                            padding-right: 0.75rem;
                            font-weight: 500;
                          }
                          .fc .fc-today-button {
                            color: hsl(var(--foreground)) !important;
                          }
                          .fc .fc-button:hover,
                          .fc .fc-today-button:hover {
                            background-color: hsl(var(--accent)) !important;
                            color: hsl(var(--accent-foreground));
                            border-color: transparent !important;
                          }
                          .fc .fc-button.fc-button-active,
                          .fc .fc-button-primary.fc-button-active {
                            background-color: hsl(var(--primary)) !important;
                            border-color: transparent !important;
                            color: hsl(var(--primary-foreground)) !important;
                          }
                          .fc .fc-today-button.fc-button-active {
                            background-color: transparent !important;
                            border: 1px solid hsl(var(--primary)) !important;
                            color: hsl(var(--foreground)) !important;
                          }
                          .fc .fc-button:disabled,
                          .fc .fc-today-button:disabled {
                            opacity: 0.5;
                          }
                          .fc .fc-button:focus,
                          .fc .fc-today-button:focus {
                            outline: none;
                            box-shadow: 0 0 0 2px hsl(var(--background)),
                              0 0 0 4px hsl(var(--primary));
                          }
                          .fc .fc-toolbar-title {
                            font-size: 1.25rem !important;
                            font-weight: 600;
                          }
                        `}</style>
                        <FullCalendar
                          plugins={[
                            dayGridPlugin,
                            timeGridPlugin,
                            interactionPlugin,
                          ]}
                          initialView="timeGridWeek"
                          locale={koLocale}
                          headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay',
                          }}
                          events={timeSlots.map((slot) => ({
                            id: String(slot.timeSlotId),
                            title: slot.scheduleName,
                            start: `${slot.date}T${slot.startTime}`,
                            end: `${slot.date}T${slot.endTime}`,
                            backgroundColor: slot.isFull
                              ? '#ef4444'
                              : '#fee2e2',
                            textColor: slot.isFull ? '#ffffff' : '#000000',
                            borderColor: slot.isFull ? '#dc2626' : '#fca5a5',
                          }))}
                          height="100%"
                        />
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[80px] text-center">
                                No
                              </TableHead>
                              <TableHead className="text-center">
                                프로그램명
                              </TableHead>
                              <TableHead className="text-center">
                                일자
                              </TableHead>
                              <TableHead className="text-center">
                                시간
                              </TableHead>
                              <TableHead className="text-center">
                                예약현황
                              </TableHead>
                              <TableHead className="text-center">
                                관리
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {timeSlots
                              .sort(
                                (a, b) =>
                                  new Date(a.date).getTime() -
                                  new Date(b.date).getTime()
                              )
                              .map((slot, index) => (
                                <TableRow key={slot.timeSlotId}>
                                  <TableCell className="text-center font-medium">
                                    {index + 1}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {slot.scheduleName}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {formatDateWithDay(slot.date)}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {formatTimeRange(
                                      slot.startTime,
                                      slot.endTime
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex justify-center">
                                      <Badge
                                        className={`${
                                          slot.isFull
                                            ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                                            : ''
                                        }`}
                                        variant={
                                          slot.isFull ? 'default' : 'secondary'
                                        }
                                      >
                                        {slot.reservedCount}/{slot.maxCapacity}
                                      </Badge>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex justify-center">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          setSelectedTimeSlot(slot);
                                          setIsDeleteTimeSlotDialogOpen(true);
                                        }}
                                      >
                                        <Trash className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reservations">
          {/* 예약 관리 컨텐츠 */}
          <Card>
            <CardHeader>
              <CardTitle>예약 현황</CardTitle>
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
                      setStatusFilter(
                        e.target.value as ReservationStatus | 'ALL'
                      )
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
                      <TableHead className="w-[80px] text-center">
                        번호
                      </TableHead>
                      <TableHead>신청자</TableHead>
                      <TableHead>주소</TableHead>
                      <TableHead>시설명</TableHead>
                      <TableHead>강사명</TableHead>
                      <TableHead className="text-center">예약 일시</TableHead>
                      <TableHead className="text-center">상태</TableHead>
                      <TableHead className="w-[100px] text-center">
                        관리
                      </TableHead>
                      <TableHead className="w-[80px] text-center">
                        상세
                      </TableHead>
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
                        return (
                          matchesSearch && matchesStatus && matchesFacility
                        );
                      })
                      .map((reservation, index) => (
                        <TableRow key={reservation.reservationId}>
                          <TableCell className="text-center">
                            {index + 1}
                          </TableCell>
                          <TableCell>{reservation.applicantName}</TableCell>
                          <TableCell>
                            {formatAddress(
                              reservation.building,
                              reservation.unit
                            )}
                          </TableCell>
                          <TableCell>{reservation.facilityName}</TableCell>
                          <TableCell>{reservation.instructorName}</TableCell>
                          <TableCell className="text-center">
                            {reservation.reservationDateTime}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                getStatusBadgeStyle(reservation.status)
                                  .className
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
                                    onClick={async () => {
                                      try {
                                        await client.PATCH(
                                          '/api/v1/admin/facilities/reservations/{reservationId}/status',
                                          {
                                            params: {
                                              path: {
                                                reservationId:
                                                  reservation.reservationId,
                                              },
                                            },
                                            body: {
                                              status: 'AGREE',
                                            },
                                          }
                                        );
                                        toast({
                                          title: '성공',
                                          description: '예약이 승인되었습니다.',
                                          duration: 2000,
                                        });
                                        fetchReservations();
                                      } catch (error) {
                                        toast({
                                          variant: 'destructive',
                                          title: '오류',
                                          description:
                                            '예약 승인에 실패했습니다.',
                                          duration: 2000,
                                        });
                                      }
                                    }}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={async () => {
                                      try {
                                        await client.PATCH(
                                          '/api/v1/admin/facilities/reservations/{reservationId}/status',
                                          {
                                            params: {
                                              path: {
                                                reservationId:
                                                  reservation.reservationId,
                                              },
                                            },
                                            body: {
                                              status: 'REJECT',
                                            },
                                          }
                                        );
                                        toast({
                                          title: '성공',
                                          description: '예약이 거절되었습니다.',
                                          duration: 2000,
                                        });
                                        fetchReservations();
                                      } catch (error) {
                                        toast({
                                          variant: 'destructive',
                                          title: '오류',
                                          description:
                                            '예약 거절에 실패했습니다.',
                                          duration: 2000,
                                        });
                                      }
                                    }}
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
                                      onClick={async () => {
                                        try {
                                          await client.PATCH(
                                            '/api/v1/admin/facilities/reservations/{reservationId}/status',
                                            {
                                              params: {
                                                path: {
                                                  reservationId:
                                                    reservation.reservationId,
                                                },
                                              },
                                              body: {
                                                status: 'AGREE',
                                              },
                                            }
                                          );
                                          toast({
                                            title: '성공',
                                            description:
                                              '예약 상태가 변경되었습니다.',
                                            duration: 2000,
                                          });
                                          fetchReservations();
                                        } catch (error) {
                                          toast({
                                            variant: 'destructive',
                                            title: '오류',
                                            description:
                                              '상태 변경에 실패했습니다.',
                                            duration: 2000,
                                          });
                                        }
                                      }}
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
                                      onClick={async () => {
                                        try {
                                          await client.PATCH(
                                            '/api/v1/admin/facilities/reservations/{reservationId}/status',
                                            {
                                              params: {
                                                path: {
                                                  reservationId:
                                                    reservation.reservationId,
                                                },
                                              },
                                              body: {
                                                status: 'REJECT',
                                              },
                                            }
                                          );
                                          toast({
                                            title: '성공',
                                            description:
                                              '예약 상태가 변경되었습니다.',
                                            duration: 2000,
                                          });
                                          fetchReservations();
                                        } catch (error) {
                                          toast({
                                            variant: 'destructive',
                                            title: '오류',
                                            description:
                                              '상태 변경에 실패했습니다.',
                                            duration: 2000,
                                          });
                                        }
                                      }}
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
                                fetchReservationDetail(
                                  reservation.reservationId
                                )
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
        </TabsContent>
      </Tabs>

      {/* 시설 추가 다이얼로그 */}
      <Dialog
        open={isAddFacilityDialogOpen}
        onOpenChange={setIsAddFacilityDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>시설 추가</DialogTitle>
            <DialogDescription>새로운 시설을 추가합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">시설명</Label>
              <Input
                id="name"
                value={newFacility.name}
                onChange={(e) =>
                  setNewFacility({ ...newFacility, name: e.target.value })
                }
                placeholder="시설명을 입력하세요"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={newFacility.description}
                onChange={(e) =>
                  setNewFacility({
                    ...newFacility,
                    description: e.target.value,
                  })
                }
                placeholder="시설에 대한 설명을 입력하세요"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="openTime">운영 시작 시간</Label>
                <Input
                  id="openTime"
                  type="time"
                  value={newFacility.openTime}
                  onChange={(e) =>
                    setNewFacility({ ...newFacility, openTime: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="closeTime">운영 종료 시간</Label>
                <Input
                  id="closeTime"
                  type="time"
                  value={newFacility.closeTime}
                  onChange={(e) =>
                    setNewFacility({
                      ...newFacility,
                      closeTime: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddFacilityDialogOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleAddFacility}>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 시설 수정 다이얼로그 */}
      <Dialog
        open={isEditFacilityDialogOpen}
        onOpenChange={setIsEditFacilityDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>시설 수정</DialogTitle>
            <DialogDescription>시설 정보를 수정합니다.</DialogDescription>
          </DialogHeader>
          {selectedFacility && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">시설명</Label>
                <Input
                  id="edit-name"
                  value={selectedFacility.name}
                  onChange={(e) =>
                    setSelectedFacility({
                      ...selectedFacility,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">설명</Label>
                <Textarea
                  id="edit-description"
                  value={selectedFacility.description}
                  onChange={(e) =>
                    setSelectedFacility({
                      ...selectedFacility,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-openTime">운영 시작 시간</Label>
                  <Input
                    id="edit-openTime"
                    type="time"
                    value={selectedFacility.openTime}
                    onChange={(e) =>
                      setSelectedFacility({
                        ...selectedFacility,
                        openTime: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-closeTime">운영 종료 시간</Label>
                  <Input
                    id="edit-closeTime"
                    type="time"
                    value={selectedFacility.closeTime}
                    onChange={(e) =>
                      setSelectedFacility({
                        ...selectedFacility,
                        closeTime: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditFacilityDialogOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleEditFacility}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 시설 삭제 다이얼로그 */}
      <Dialog
        open={isDeleteFacilityDialogOpen}
        onOpenChange={setIsDeleteFacilityDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>시설 삭제</DialogTitle>
            <DialogDescription>
              {selectedFacility?.name} 시설을 삭제하시겠습니까? 이 작업은 되돌릴
              수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteFacilityDialogOpen(false)}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteFacility}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 예약 상세 정보 모달 추가 */}
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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailModalOpen(false)}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
