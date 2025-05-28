'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  CalendarDays,
  Plus,
  Search,
  Check,
  X,
  Clock,
  MoreVertical,
  Pencil,
  Trash,
  Table as TableIcon,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import client from '@/lib/backend/client';
import { format, addMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import koLocale from '@fullcalendar/core/locales/ko';
import { useRouter } from 'next/navigation';

// 시설 정보 타입
interface Facility {
  facilityId: number;
  facilityName: string;
  description: string;
  openTime: string;
  closeTime: string;
}

// 강사 정보 타입
interface Instructor {
  instructorId: number;
  name: string;
  description: string;
}

// 스케줄 정보 타입
interface Schedule {
  scheduleId: number;
  scheduleName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  capacity: number;
}

// 타임슬롯 응답 타입
interface TimeSlotSimpleResponseDto {
  timeSlotId: number;
  scheduleName: string;
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  reservedCount: number;
  isFull: boolean;
}

// 스케줄 응답 타입
interface InstructorScheduleSimpleResponseDto {
  scheduleId: number;
  instructorId: number;
  scheduleName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  capacity: number;
}

// 시설 생성 폼 스키마
const facilityFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: '시설명은 필수 입력값입니다.' })
    .max(50, { message: '시설명은 50자 이하여야 합니다.' }),
  description: z.string().min(1, { message: '시설 설명은 필수 입력값입니다.' }),
  openTime: z.string().min(1, { message: '운영 시작 시간은 필수입니다.' }),
  closeTime: z.string().min(1, { message: '운영 종료 시간은 필수입니다.' }),
});

// 강사 폼 스키마
const instructorFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: '강사명은 필수 입력값입니다.' })
    .max(50, { message: '강사명은 50자 이하여야 합니다.' }),
  description: z.string().min(1, { message: '설명은 필수 입력값입니다.' }),
});

// 스케줄 생성 폼 스키마
const scheduleFormSchema = z.object({
  scheduleName: z
    .string()
    .min(1, { message: '프로그램명은 필수 입력값입니다.' }),
  dayOfWeek: z.string().min(1, { message: '근무 요일을 선택해주세요.' }),
  startTime: z.string().min(1, { message: '시작 시간은 필수입니다.' }),
  endTime: z.string().min(1, { message: '종료 시간은 필수입니다.' }),
  slotMinutes: z
    .number()
    .min(1, { message: '예약 단위는 1분 이상이어야 합니다.' }),
  capacity: z
    .number()
    .min(1, { message: '수용 인원은 1명 이상이어야 합니다.' }),
  periodStart: z.date({ required_error: '적용 시작일을 선택해주세요.' }),
  periodEnd: z.date({ required_error: '적용 종료일을 선택해주세요.' }),
});

// 시간 검증을 위한 유틸리티 함수 추가
const parseTime = (timeStr: string): { hours: number; minutes: number } => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
};

const isTimeInRange = (
  start: string,
  end: string,
  open: string,
  close: string
): boolean => {
  const startTime = parseTime(start);
  const endTime = parseTime(end);
  const openTime = parseTime(open);
  const closeTime = parseTime(close);

  // 시간을 분으로 변환하여 비교
  const toMinutes = (time: { hours: number; minutes: number }) =>
    time.hours * 60 + time.minutes;
  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);
  const openMinutes = toMinutes(openTime);
  const closeMinutes = toMinutes(closeTime);

  if (openMinutes < closeMinutes) {
    // 일반 운영(예: 09:00~23:00)
    return startMinutes >= openMinutes && endMinutes <= closeMinutes;
  } else {
    // 자정 넘김(예: 23:00~05:00)
    const midnight = 24 * 60;
    const normalizedEndMinutes =
      endMinutes < openMinutes ? endMinutes + midnight : endMinutes;
    const normalizedCloseMinutes = closeMinutes + midnight;

    return (
      (startMinutes >= openMinutes || startMinutes <= closeMinutes) &&
      (normalizedEndMinutes >= openMinutes || endMinutes <= closeMinutes)
    );
  }
};

const checkTimeOverlap = (
  startTime: string,
  endTime: string,
  dayOfWeek: string,
  schedules: InstructorScheduleSimpleResponseDto[]
): boolean => {
  const daySchedules = schedules.filter((s) => s.dayOfWeek === dayOfWeek);

  const start = parseTime(startTime);
  const end = parseTime(endTime);
  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;

  return daySchedules.some((schedule) => {
    const scheduleStart = parseTime(schedule.startTime);
    const scheduleEnd = parseTime(schedule.endTime);
    const scheduleStartMinutes =
      scheduleStart.hours * 60 + scheduleStart.minutes;
    const scheduleEndMinutes = scheduleEnd.hours * 60 + scheduleEnd.minutes;

    return (
      startMinutes < scheduleEndMinutes && endMinutes > scheduleStartMinutes
    );
  });
};

export default function FacilitiesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('facilities');
  const { toast } = useToast();
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(
    null
  );
  const [selectedInstructor, setSelectedInstructor] =
    useState<Instructor | null>(null);
  const [isAddFacilityDialogOpen, setIsAddFacilityDialogOpen] = useState(false);
  const [isEditFacilityDialogOpen, setIsEditFacilityDialogOpen] =
    useState(false);
  const [isDeleteFacilityDialogOpen, setIsDeleteFacilityDialogOpen] =
    useState(false);
  const [facilityToEdit, setFacilityToEdit] = useState<Facility | null>(null);
  const [facilityToDelete, setFacilityToDelete] = useState<Facility | null>(
    null
  );

  // 시설 관리 관련 상태
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilitySearchTerm, setFacilitySearchTerm] = useState('');

  // 강사 관리 관련 상태
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isAddInstructorDialogOpen, setIsAddInstructorDialogOpen] =
    useState(false);
  const [instructorSearchTerm, setInstructorSearchTerm] = useState('');
  const [isEditInstructorDialogOpen, setIsEditInstructorDialogOpen] =
    useState(false);
  const [isDeleteInstructorDialogOpen, setIsDeleteInstructorDialogOpen] =
    useState(false);
  const [instructorToEdit, setInstructorToEdit] = useState<Instructor | null>(
    null
  );
  const [instructorToDelete, setInstructorToDelete] =
    useState<Instructor | null>(null);
  const [expandedInstructorId, setExpandedInstructorId] = useState<
    number | null
  >(null);

  // 스케줄 관리 관련 상태
  const [schedules, setSchedules] = useState<TimeSlotSimpleResponseDto[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isAddScheduleDialogOpen, setIsAddScheduleDialogOpen] = useState(false);
  const [scheduleViewMode, setScheduleViewMode] = useState<
    'calendar' | 'table'
  >('table');
  const [selectedEvents, setSelectedEvents] = useState<
    TimeSlotSimpleResponseDto[]
  >([]);

  // 상태 추가
  const [isDeleteTimeSlotDialogOpen, setIsDeleteTimeSlotDialogOpen] =
    useState(false);
  const [timeSlotToDelete, setTimeSlotToDelete] =
    useState<TimeSlotSimpleResponseDto | null>(null);

  // 날짜 범위 선택 상태 추가
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  // 상태 추가
  const [selectedProgramName, setSelectedProgramName] = useState<string>('all');
  const [programNames, setProgramNames] = useState<string[]>([]);

  // 기존 스케줄 목록을 위한 상태 추가
  const [instructorSchedules, setInstructorSchedules] = useState<
    InstructorScheduleSimpleResponseDto[]
  >([]);

  // 시설 추가 폼
  const form = useForm<z.infer<typeof facilityFormSchema>>({
    resolver: zodResolver(facilityFormSchema),
    defaultValues: {
      name: '',
      description: '',
      openTime: '09:00',
      closeTime: '18:00',
    },
  });

  // 수정용 폼
  const editForm = useForm<z.infer<typeof facilityFormSchema>>({
    resolver: zodResolver(facilityFormSchema),
    defaultValues: {
      name: '',
      description: '',
      openTime: '09:00',
      closeTime: '18:00',
    },
  });

  // 강사 추가 폼
  const instructorForm = useForm<z.infer<typeof instructorFormSchema>>({
    resolver: zodResolver(instructorFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // 강사 수정 폼
  const editInstructorForm = useForm<z.infer<typeof instructorFormSchema>>({
    resolver: zodResolver(instructorFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // 스케줄 추가 폼
  const scheduleForm = useForm<z.infer<typeof scheduleFormSchema>>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      scheduleName: '',
      dayOfWeek: '',
      startTime: '09:00',
      endTime: '18:00',
      slotMinutes: 60,
      capacity: 20,
      periodStart: new Date(),
      periodEnd: new Date(),
    },
  });

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

  // 날짜 포맷팅 함수 수정
  const formatDateSafely = (dateString: string) => {
    try {
      if (!dateString) return '-';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return format(date, 'yyyy-MM-dd (EEE)', { locale: ko });
    } catch (error) {
      console.error('날짜 포맷팅 오류:', error);
      return dateString;
    }
  };

  // 시설 목록 조회
  const fetchFacilities = async () => {
    try {
      const response = await client.GET('/api/v1/admin/facilities');
      if (response.data) {
        const formattedFacilities = (response.data as any[]).map(
          (item): Facility => ({
            facilityId: item.facilityId || 0,
            facilityName: item.facilityName || '',
            description: item.description || '',
            openTime: item.openTime || '',
            closeTime: item.closeTime || '',
          })
        );
        setFacilities(formattedFacilities);
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

  // 강사 목록 조회
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
        const formattedInstructors = (response.data as any[]).map(
          (item): Instructor => ({
            instructorId: item.instructorId || 0,
            name: item.name || '',
            description: item.description || '',
          })
        );
        setInstructors(formattedInstructors);
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

  // 시설 선택 처리 (토글)
  const handleFacilitySelect = (facility: Facility) => {
    if (selectedFacility?.facilityId === facility.facilityId) {
      setSelectedFacility(null);
      setSelectedInstructor(null);
      setInstructors([]);
    } else {
      setSelectedFacility(facility);
      fetchInstructors(facility.facilityId);
    }
  };

  // 강사 선택 처리
  const handleInstructorSelect = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    if (selectedFacility) {
      fetchSchedules(instructor.instructorId);
      fetchInstructorSchedules(instructor.instructorId);
    }
  };

  // 시설 검색 처리
  const handleFacilitySearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFacilitySearchTerm(e.target.value);
  };

  // 강사 검색 처리
  const handleInstructorSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInstructorSearchTerm(e.target.value);
  };

  // 시설 필터링
  const filteredFacilities = facilities.filter(
    (facility) =>
      facility.facilityName
        .toLowerCase()
        .includes(facilitySearchTerm.toLowerCase()) ||
      facility.description
        .toLowerCase()
        .includes(facilitySearchTerm.toLowerCase())
  );

  // 강사 필터링
  const filteredInstructors = instructors.filter(
    (instructor) =>
      instructor.name
        .toLowerCase()
        .includes(instructorSearchTerm.toLowerCase()) ||
      instructor.description
        .toLowerCase()
        .includes(instructorSearchTerm.toLowerCase())
  );

  // 시간 포맷팅 함수 (HH:MM 형식)
  const formatTime = (time: string) => {
    if (!time) return '';
    try {
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

  // 운영 시간 포맷팅 함수
  const formatOperatingHours = (openTime: string, closeTime: string) => {
    if (!openTime || !closeTime) return '';
    try {
      const [openHours, openMinutes] = openTime.split(':').map(Number);
      const [closeHours, closeMinutes] = closeTime.split(':').map(Number);

      // 시작 시간과 종료 시간을 분 단위로 변환하여 비교
      const openTimeInMinutes = openHours * 60 + openMinutes;
      const closeTimeInMinutes = closeHours * 60 + closeMinutes;

      const formattedOpenTime = formatTime(openTime);
      const formattedCloseTime = formatTime(closeTime);

      // 종료 시간이 시작 시간보다 이른 경우 (다음 날로 넘어가는 경우)
      if (closeTimeInMinutes < openTimeInMinutes) {
        return `${formattedOpenTime} - 익일 ${formattedCloseTime}`;
      }

      return `${formattedOpenTime} - ${formattedCloseTime}`;
    } catch (error) {
      console.error('운영 시간 포맷 에러:', error);
      return `${openTime} - ${closeTime}`;
    }
  };

  // 강사 행 클릭 처리
  const handleInstructorRowClick = (instructor: Instructor) => {
    if (selectedInstructor?.instructorId === instructor.instructorId) {
      setSelectedInstructor(null);
    } else {
      setSelectedInstructor(instructor);
      fetchSchedules(instructor.instructorId);
    }
  };

  // 타임슬롯 목록 조회
  const fetchSchedules = async (instructorId: number) => {
    try {
      console.log('Fetching timeslots for instructor:', instructorId);
      console.log('Selected facility:', selectedFacility);

      const startDate = dateRange.from
        ? format(dateRange.from, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd');

      const endDate = dateRange.to
        ? format(dateRange.to, 'yyyy-MM-dd')
        : format(addMonths(new Date(), 3), 'yyyy-MM-dd');

      console.log('Date range:', { startDate, endDate });

      const response = await client.GET(
        '/api/v1/admin/facilities/{facilityId}/instructors/{instructorId}/schedules/timeslots',
        {
          params: {
            path: {
              facilityId: selectedFacility!.facilityId,
              instructorId: instructorId,
            },
            query: {
              startDate,
              endDate,
            },
          },
        }
      );

      console.log('API Response:', response);

      if (response.data) {
        const formattedTimeSlots = (
          response.data as TimeSlotSimpleResponseDto[]
        ).map((item) => ({
          timeSlotId: item.timeSlotId,
          scheduleName: item.scheduleName,
          date: item.date,
          startTime: item.startTime,
          endTime: item.endTime,
          maxCapacity: item.maxCapacity,
          reservedCount: item.reservedCount,
          isFull: item.isFull,
        }));
        console.log('Formatted timeslots:', formattedTimeSlots);
        setSchedules(formattedTimeSlots);
      } else {
        console.log('No data in response');
        setSchedules([]);
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

  // 스케줄 목록 조회 함수 수정
  const fetchInstructorSchedules = async (instructorId: number) => {
    try {
      const response = await client.GET(
        '/api/v1/admin/facilities/{facilityId}/instructors/{instructorId}/schedules',
        {
          params: {
            path: {
              facilityId: selectedFacility!.facilityId,
              instructorId: instructorId,
            },
          },
        }
      );

      if (response.data) {
        const formattedSchedules = (response.data as any[]).map(
          (item): InstructorScheduleSimpleResponseDto => ({
            scheduleId: item.scheduleId,
            instructorId: item.instructorId,
            scheduleName: item.scheduleName,
            dayOfWeek: item.dayOfWeek,
            startTime: item.startTime,
            endTime: item.endTime,
            slotMinutes: item.slotMinutes,
            capacity: item.capacity,
          })
        );
        setInstructorSchedules(formattedSchedules);
      }
    } catch (error) {
      console.error('스케줄 목록 조회 실패:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '스케줄 목록을 불러오는데 실패했습니다.',
      });
    }
  };

  // 시설 수정 처리
  const handleFacilityEdit = (facility: Facility) => {
    setFacilityToEdit(facility);
    editForm.reset({
      name: facility.facilityName,
      description: facility.description,
      openTime: facility.openTime,
      closeTime: facility.closeTime,
    });
    setIsEditFacilityDialogOpen(true);
  };

  // 시설 수정 제출
  const handleEditFacilitySubmit = async (
    values: z.infer<typeof facilityFormSchema>
  ) => {
    try {
      // 시간 형식 변환
      const formattedOpenTime = values.openTime.substring(0, 5);
      const formattedCloseTime = values.closeTime.substring(0, 5);

      await client.PUT('/api/v1/admin/facilities/{facilityId}', {
        params: {
          path: {
            facilityId: facilityToEdit!.facilityId,
          },
        },
        body: {
          name: values.name,
          description: values.description,
          openTime: formattedOpenTime,
          closeTime: formattedCloseTime,
        },
      });

      toast({
        title: '성공',
        description: '시설이 수정되었습니다.',
      });

      setIsEditFacilityDialogOpen(false);
      editForm.reset();
      fetchFacilities();
    } catch (error) {
      console.error('시설 수정 실패:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '시설 수정에 실패했습니다.',
      });
    }
  };

  // 시설 삭제 처리
  const handleFacilityDelete = (facility: Facility) => {
    setFacilityToDelete(facility);
    setIsDeleteFacilityDialogOpen(true);
  };

  // 시설 삭제 확인
  const handleDeleteConfirm = async () => {
    try {
      await client.DELETE('/api/v1/admin/facilities/{facilityId}', {
        params: {
          path: {
            facilityId: facilityToDelete!.facilityId,
          },
        },
      });

      toast({
        title: '성공',
        description: '시설이 삭제되었습니다.',
      });

      setIsDeleteFacilityDialogOpen(false);
      setFacilityToDelete(null);
      fetchFacilities();
    } catch (error) {
      console.error('시설 삭제 실패:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '시설 삭제에 실패했습니다.',
      });
    }
  };

  // 강사 추가 처리
  const handleAddInstructor = async (
    values: z.infer<typeof instructorFormSchema>
  ) => {
    try {
      await client.POST('/api/v1/admin/facilities/{facilityId}/instructors', {
        params: {
          path: {
            facilityId: selectedFacility!.facilityId,
          },
        },
        body: {
          name: values.name,
          description: values.description,
        },
      });

      toast({
        title: '성공',
        description: '강사가 추가되었습니다.',
      });

      setIsAddInstructorDialogOpen(false);
      instructorForm.reset();
      fetchInstructors(selectedFacility!.facilityId);
    } catch (error) {
      console.error('강사 추가 실패:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '강사 추가에 실패했습니다.',
      });
    }
  };

  // 강사 수정 처리
  const handleInstructorEdit = (instructor: Instructor) => {
    setInstructorToEdit(instructor);
    editInstructorForm.reset({
      name: instructor.name,
      description: instructor.description,
    });
    setIsEditInstructorDialogOpen(true);
  };

  // 강사 수정 제출
  const handleEditInstructorSubmit = async (
    values: z.infer<typeof instructorFormSchema>
  ) => {
    try {
      await client.PUT(
        '/api/v1/admin/facilities/{facilityId}/instructors/{instructorId}',
        {
          params: {
            path: {
              facilityId: selectedFacility!.facilityId,
              instructorId: instructorToEdit!.instructorId,
            },
          },
          body: {
            name: values.name,
            description: values.description,
          },
        }
      );

      toast({
        title: '성공',
        description: '강사 정보가 수정되었습니다.',
      });

      setIsEditInstructorDialogOpen(false);
      editInstructorForm.reset();
      fetchInstructors(selectedFacility!.facilityId);
    } catch (error) {
      console.error('강사 수정 실패:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '강사 수정에 실패했습니다.',
      });
    }
  };

  // 강사 삭제 처리
  const handleInstructorDelete = (instructor: Instructor) => {
    setInstructorToDelete(instructor);
    setIsDeleteInstructorDialogOpen(true);
  };

  // 강사 삭제 확인
  const handleDeleteInstructorConfirm = async () => {
    try {
      await client.DELETE(
        '/api/v1/admin/facilities/{facilityId}/instructors/{instructorId}',
        {
          params: {
            path: {
              facilityId: selectedFacility!.facilityId,
              instructorId: instructorToDelete!.instructorId,
            },
          },
        }
      );

      toast({
        title: '성공',
        description: '강사가 삭제되었습니다.',
      });

      setIsDeleteInstructorDialogOpen(false);
      setInstructorToDelete(null);
      fetchInstructors(selectedFacility!.facilityId);
    } catch (error) {
      console.error('강사 삭제 실패:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '강사 삭제에 실패했습니다.',
      });
    }
  };

  // 시설 추가 처리
  const handleAddFacility = async (
    values: z.infer<typeof facilityFormSchema>
  ) => {
    try {
      // 시간 형식 변환
      const formattedOpenTime = values.openTime.substring(0, 5);
      const formattedCloseTime = values.closeTime.substring(0, 5);

      await client.POST('/api/v1/admin/facilities', {
        body: {
          name: values.name,
          description: values.description,
          openTime: formattedOpenTime,
          closeTime: formattedCloseTime,
        },
      });

      toast({
        title: '성공',
        description: '시설이 추가되었습니다.',
      });

      setIsAddFacilityDialogOpen(false);
      form.reset();
      fetchFacilities();
    } catch (error) {
      console.error('시설 추가 실패:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '시설 추가에 실패했습니다.',
      });
    }
  };

  // 스케줄 추가 처리
  const handleAddSchedule = async (
    values: z.infer<typeof scheduleFormSchema>
  ) => {
    try {
      await client
        .POST(
          '/api/v1/admin/facilities/{facilityId}/instructors/{instructorId}/schedules',
          {
            params: {
              path: {
                facilityId: selectedFacility!.facilityId,
                instructorId: selectedInstructor!.instructorId,
              },
            },
            body: {
              scheduleName: values.scheduleName,
              dayOfWeek: values.dayOfWeek,
              startTime: values.startTime,
              endTime: values.endTime,
              slotMinutes: values.slotMinutes,
              capacity: values.capacity,
              periodStart: format(values.periodStart, 'yyyy-MM-dd'),
              periodEnd: format(values.periodEnd, 'yyyy-MM-dd'),
            },
          }
        )
        .catch((error) => {
          throw error;
        });

      // 에러가 없을 경우에만 실행되는 부분
      toast({
        title: '성공',
        description: '스케줄이 추가되었습니다.',
      });

      setIsAddScheduleDialogOpen(false);
      scheduleForm.reset();
      fetchSchedules(selectedInstructor!.instructorId);
    } catch (error: any) {
      console.error('스케줄 추가 실패:', error);

      // 서버에서 반환하는 에러 메시지 처리
      let errorMessage = '스케줄 추가에 실패했습니다.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (
        error.message &&
        error.message.includes('IllegalArgumentException')
      ) {
        // IllegalArgumentException 메시지 파싱
        const match = error.message.match(/IllegalArgumentException: (.+)/);
        if (match) {
          errorMessage = match[1];
        }
      }

      // 운영시간 관련 에러
      if (errorMessage.includes('운영시간')) {
        scheduleForm.setError('startTime', {
          type: 'manual',
          message: errorMessage,
        });
        scheduleForm.setError('endTime', {
          type: 'manual',
          message: errorMessage,
        });
      }
      // 시간 중복 관련 에러
      else if (errorMessage.includes('시간대가 겹치는')) {
        scheduleForm.setError('startTime', {
          type: 'manual',
          message: errorMessage,
        });
        scheduleForm.setError('endTime', {
          type: 'manual',
          message: errorMessage,
        });
      }

      toast({
        variant: 'destructive',
        title: '오류',
        description: errorMessage,
      });
    }
  };

  // 타임슬롯 삭제 처리 함수
  const handleTimeSlotDelete = async (slot: TimeSlotSimpleResponseDto) => {
    setTimeSlotToDelete(slot);
    setIsDeleteTimeSlotDialogOpen(true);
  };

  // 타임슬롯 삭제 확인
  const handleDeleteTimeSlotConfirm = async () => {
    if (!timeSlotToDelete) return;

    try {
      await client.DELETE(
        '/api/v1/admin/facilities/{facilityId}/instructors/{instructorId}/schedules/timeslots/{timeSlotId}',
        {
          params: {
            path: {
              facilityId: selectedFacility!.facilityId,
              instructorId: selectedInstructor!.instructorId,
              timeSlotId: timeSlotToDelete.timeSlotId,
            },
          },
        }
      );

      toast({
        title: '성공',
        description: '타임슬롯이 삭제되었습니다.',
      });

      setIsDeleteTimeSlotDialogOpen(false);
      setTimeSlotToDelete(null);
      fetchSchedules(selectedInstructor!.instructorId);
    } catch (error) {
      console.error('타임슬롯 삭제 실패:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '타임슬롯 삭제에 실패했습니다.',
      });
    }
  };

  // 날짜 범위 변경 시 타임슬롯 재조회
  useEffect(() => {
    if (selectedInstructor && (dateRange.from || dateRange.to)) {
      fetchSchedules(selectedInstructor.instructorId);
    }
  }, [dateRange, selectedInstructor]);

  useEffect(() => {
    if (activeTab === 'facilities') {
      fetchFacilities();
    }
  }, [activeTab]);

  useEffect(() => {
    if (schedules.length > 0) {
      const uniqueNames = Array.from(
        new Set(schedules.map((slot) => slot.scheduleName))
      );
      setProgramNames(uniqueNames);
    }
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    if (selectedProgramName === 'all') return schedules;
    return schedules.filter(
      (slot) => slot.scheduleName === selectedProgramName
    );
  }, [schedules, selectedProgramName]);

  return (
    <div className="container-fluid p-6 max-w-[2000px] mx-auto">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">공용시설 관리</h1>
        <p className="text-muted-foreground mt-1">
          아파트 공용시설을 관리하고 예약 현황을 확인할 수 있습니다.
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex space-x-2 mb-6">
        <Button
          variant={activeTab === 'facilities' ? 'default' : 'outline'}
          onClick={() => setActiveTab('facilities')}
          className="flex items-center gap-2"
        >
          <Building2 className="w-4 h-4" />
          시설 관리
        </Button>
        <Button
          variant={activeTab === 'reservations' ? 'default' : 'outline'}
          onClick={() => router.push('/admin/facilities/reservations')}
          className="flex items-center gap-2"
        >
          <CalendarDays className="w-4 h-4" />
          예약 관리
        </Button>
      </div>

      {/* 시설 관리 컨텐츠 */}
      {activeTab === 'facilities' && (
        <div className="grid grid-cols-12 gap-6">
          {/* 시설 목록 섹션 */}
          <div
            className={`${
              selectedFacility ? 'col-span-5 lg:col-span-5' : 'col-span-12'
            } transition-all duration-300`}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>시설 목록</CardTitle>
                  <CardDescription>
                    공용시설 목록을 확인하고 관리할 수 있습니다.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsAddFacilityDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-1" /> 시설 추가
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="시설명으로 검색..."
                      className="pl-8"
                      value={facilitySearchTerm}
                      onChange={handleFacilitySearch}
                    />
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px] text-center">
                            번호
                          </TableHead>
                          <TableHead>시설명</TableHead>
                          <TableHead>설명</TableHead>
                          <TableHead>운영 시간</TableHead>
                          <TableHead className="w-[100px]">관리</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFacilities.map((facility, index) => (
                          <TableRow
                            key={facility.facilityId}
                            className={`cursor-pointer hover:bg-muted/50 ${
                              selectedFacility?.facilityId ===
                              facility.facilityId
                                ? 'bg-muted/50'
                                : ''
                            }`}
                            onClick={() => handleFacilitySelect(facility)}
                          >
                            <TableCell className="text-center">
                              {index + 1}
                            </TableCell>
                            <TableCell>{facility.facilityName}</TableCell>
                            <TableCell>{facility.description}</TableCell>
                            <TableCell>
                              {formatOperatingHours(
                                facility.openTime,
                                facility.closeTime
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleFacilityEdit(facility);
                                    }}
                                  >
                                    <Pencil className="w-4 h-4 mr-2" />
                                    수정
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleFacilityDelete(facility);
                                    }}
                                  >
                                    <Trash className="w-4 h-4 mr-2" />
                                    삭제
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 강사 목록 섹션 */}
          {selectedFacility && (
            <div className="col-span-7 lg:col-span-7">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>강사 목록</CardTitle>
                    <CardDescription>
                      {selectedFacility.facilityName}의 강사 목록을 확인하고
                      관리할 수 있습니다.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setIsAddInstructorDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" /> 강사 추가
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="강사명으로 검색..."
                        className="pl-8"
                        value={instructorSearchTerm}
                        onChange={handleInstructorSearch}
                      />
                    </div>

                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>강사명</TableHead>
                            <TableHead>소개</TableHead>
                            <TableHead className="w-[100px]">관리</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredInstructors.map((instructor) => (
                            <React.Fragment key={instructor.instructorId}>
                              <TableRow
                                className={`cursor-pointer hover:bg-muted/50 ${
                                  expandedInstructorId ===
                                  instructor.instructorId
                                    ? 'bg-muted/50'
                                    : ''
                                }`}
                                onClick={() =>
                                  handleInstructorRowClick(instructor)
                                }
                              >
                                <TableCell>{instructor.name}</TableCell>
                                <TableCell>{instructor.description}</TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger
                                      asChild
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 p-0"
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleInstructorEdit(instructor);
                                        }}
                                      >
                                        <Pencil className="w-4 h-4 mr-2" />
                                        수정
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleInstructorDelete(instructor);
                                        }}
                                      >
                                        <Trash className="w-4 h-4 mr-2" />
                                        삭제
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 스케줄 관리 카드 */}
          {selectedFacility && selectedInstructor && (
            <div className="col-span-12">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>스케줄 목록</CardTitle>
                    <CardDescription>
                      {selectedFacility.facilityName} -{' '}
                      {selectedInstructor.name} 강사의 스케줄을 관리할 수
                      있습니다.
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsAddScheduleDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" /> 스케줄 추가
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <Input
                          type="date"
                          value={
                            dateRange.from
                              ? format(dateRange.from, 'yyyy-MM-dd')
                              : ''
                          }
                          onChange={(e) => {
                            const date = e.target.value
                              ? new Date(e.target.value)
                              : undefined;
                            setDateRange((prev) => ({
                              ...prev,
                              from: date,
                            }));
                          }}
                          className="w-[160px]"
                        />
                      </div>
                      <span>~</span>
                      <div>
                        <Input
                          type="date"
                          value={
                            dateRange.to
                              ? format(dateRange.to, 'yyyy-MM-dd')
                              : ''
                          }
                          onChange={(e) => {
                            const date = e.target.value
                              ? new Date(e.target.value)
                              : undefined;
                            setDateRange((prev) => ({
                              ...prev,
                              to: date,
                            }));
                          }}
                          className="w-[160px]"
                        />
                      </div>
                      <select
                        className="flex h-9 w-[160px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedProgramName}
                        onChange={(e) => setSelectedProgramName(e.target.value)}
                      >
                        <option value="all">전체 프로그램</option>
                        {programNames.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (selectedInstructor) {
                            fetchSchedules(selectedInstructor.instructorId);
                          }
                        }}
                      >
                        조회
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px] text-center">
                            번호
                          </TableHead>
                          <TableHead className="w-[200px]">
                            프로그램명
                          </TableHead>
                          <TableHead className="w-[150px]">날짜</TableHead>
                          <TableHead className="w-[150px]">시간</TableHead>
                          <TableHead className="w-[120px] text-center">
                            예약 인원
                          </TableHead>
                          <TableHead className="w-[100px] text-center">
                            상태
                          </TableHead>
                          <TableHead className="w-[100px] text-center">
                            관리
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSchedules.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center h-24">
                              <div className="flex flex-col items-center justify-center text-muted-foreground">
                                <Clock className="w-8 h-8 mb-2 opacity-50" />
                                <span>등록된 타임슬롯이 없습니다.</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredSchedules.map((slot, index) => (
                            <TableRow key={slot.timeSlotId}>
                              <TableCell className="text-center">
                                {index + 1}
                              </TableCell>
                              <TableCell>{slot.scheduleName}</TableCell>
                              <TableCell>
                                {formatDateSafely(slot.date)}
                              </TableCell>
                              <TableCell className="text-center">
                                {formatTime(slot.startTime)} -{' '}
                                {formatTime(slot.endTime)}
                              </TableCell>
                              <TableCell className="text-center">
                                <span
                                  className={slot.isFull ? 'text-red-500' : ''}
                                >
                                  {slot.reservedCount}/{slot.maxCapacity}명
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant={
                                    slot.isFull ? 'destructive' : 'default'
                                  }
                                  className={
                                    slot.isFull
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-green-100 text-green-800'
                                  }
                                >
                                  {slot.isFull ? '마감' : '예약 가능'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleTimeSlotDelete(slot)}
                                  >
                                    <Trash className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* 시설 추가 모달 */}
      <Dialog
        open={isAddFacilityDialogOpen}
        onOpenChange={setIsAddFacilityDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>시설 추가</DialogTitle>
            <DialogDescription>
              새로운 공용시설의 정보를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleAddFacility)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>시설명</FormLabel>
                    <FormControl>
                      <Input placeholder="수영장" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>시설 설명</FormLabel>
                    <FormControl>
                      <Input placeholder="반드시 수영모를 씁시다" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="openTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>운영 시작 시간</FormLabel>
                      <FormControl>
                        <Input type="time" placeholder="09:00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="closeTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>운영 종료 시간</FormLabel>
                      <FormControl>
                        <Input type="time" placeholder="18:00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit">추가</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 시설 수정 모달 */}
      <Dialog
        open={isEditFacilityDialogOpen}
        onOpenChange={setIsEditFacilityDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>시설 수정</DialogTitle>
            <DialogDescription>시설 정보를 수정해주세요.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleEditFacilitySubmit)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>시설명</FormLabel>
                    <FormControl>
                      <Input placeholder="수영장" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>시설 설명</FormLabel>
                    <FormControl>
                      <Input placeholder="반드시 수영모를 씁시다" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="openTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>운영 시작 시간</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="closeTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>운영 종료 시간</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsEditFacilityDialogOpen(false)}
                >
                  취소
                </Button>
                <Button type="submit">수정</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 시설 삭제 확인 모달 */}
      <Dialog
        open={isDeleteFacilityDialogOpen}
        onOpenChange={setIsDeleteFacilityDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>시설 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 시설을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteFacilityDialogOpen(false)}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 강사 추가 모달 */}
      <Dialog
        open={isAddInstructorDialogOpen}
        onOpenChange={setIsAddInstructorDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>강사 추가</DialogTitle>
            <DialogDescription>
              새로운 강사 정보를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <Form {...instructorForm}>
            <form
              onSubmit={instructorForm.handleSubmit(handleAddInstructor)}
              className="space-y-4"
            >
              <FormField
                control={instructorForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>강사명</FormLabel>
                    <FormControl>
                      <Input placeholder="홍길동" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={instructorForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>설명</FormLabel>
                    <FormControl>
                      <Input placeholder="수영 전문 강사" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsAddInstructorDialogOpen(false)}
                >
                  취소
                </Button>
                <Button type="submit">추가</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 강사 수정 모달 */}
      <Dialog
        open={isEditInstructorDialogOpen}
        onOpenChange={setIsEditInstructorDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>강사 수정</DialogTitle>
            <DialogDescription>강사 정보를 수정해주세요.</DialogDescription>
          </DialogHeader>
          <Form {...editInstructorForm}>
            <form
              onSubmit={editInstructorForm.handleSubmit(
                handleEditInstructorSubmit
              )}
              className="space-y-4"
            >
              <FormField
                control={editInstructorForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>강사명</FormLabel>
                    <FormControl>
                      <Input placeholder="홍길동" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editInstructorForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>설명</FormLabel>
                    <FormControl>
                      <Input placeholder="수영 전문 강사" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsEditInstructorDialogOpen(false)}
                >
                  취소
                </Button>
                <Button type="submit">수정</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 강사 삭제 확인 모달 */}
      <Dialog
        open={isDeleteInstructorDialogOpen}
        onOpenChange={setIsDeleteInstructorDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>강사 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 강사를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteInstructorDialogOpen(false)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteInstructorConfirm}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 스케줄 추가 모달 */}
      <Dialog
        open={isAddScheduleDialogOpen}
        onOpenChange={setIsAddScheduleDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>스케줄 추가</DialogTitle>
            <DialogDescription>
              {selectedFacility?.facilityName} - {selectedInstructor?.name}{' '}
              강사의 새로운 스케줄을 추가합니다.
            </DialogDescription>
          </DialogHeader>
          <Form {...scheduleForm}>
            <form
              onSubmit={scheduleForm.handleSubmit(handleAddSchedule)}
              className="space-y-4"
            >
              <FormField
                control={scheduleForm.control}
                name="scheduleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>프로그램명</FormLabel>
                    <FormControl>
                      <Input placeholder="초보반" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={scheduleForm.control}
                name="dayOfWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>근무 요일</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">요일 선택</option>
                        <option value="MONDAY">월요일</option>
                        <option value="TUESDAY">화요일</option>
                        <option value="WEDNESDAY">수요일</option>
                        <option value="THURSDAY">목요일</option>
                        <option value="FRIDAY">금요일</option>
                        <option value="SATURDAY">토요일</option>
                        <option value="SUNDAY">일요일</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={scheduleForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>시작 시간</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            const endTime = scheduleForm.getValues('endTime');
                            if (endTime && selectedFacility) {
                              const isValid = isTimeInRange(
                                e.target.value,
                                endTime,
                                selectedFacility.openTime,
                                selectedFacility.closeTime
                              );
                              if (!isValid) {
                                scheduleForm.setError('startTime', {
                                  type: 'manual',
                                  message: `운영시간(${selectedFacility.openTime}~${selectedFacility.closeTime}) 내에서만 설정 가능합니다.`,
                                });
                              } else {
                                scheduleForm.clearErrors('startTime');
                                // 시간 중복 체크
                                const hasOverlap = checkTimeOverlap(
                                  e.target.value,
                                  endTime,
                                  scheduleForm.getValues('dayOfWeek'),
                                  instructorSchedules
                                );
                                if (hasOverlap) {
                                  scheduleForm.setError('startTime', {
                                    type: 'manual',
                                    message:
                                      '해당 요일 시간대가 겹치는 스케줄이 이미 존재합니다.',
                                  });
                                }
                              }
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={scheduleForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>종료 시간</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            const startTime =
                              scheduleForm.getValues('startTime');
                            if (startTime && selectedFacility) {
                              const isValid = isTimeInRange(
                                startTime,
                                e.target.value,
                                selectedFacility.openTime,
                                selectedFacility.closeTime
                              );
                              if (!isValid) {
                                scheduleForm.setError('endTime', {
                                  type: 'manual',
                                  message: `운영시간(${selectedFacility.openTime}~${selectedFacility.closeTime}) 내에서만 설정 가능합니다.`,
                                });
                              } else {
                                scheduleForm.clearErrors('endTime');
                                // 시간 중복 체크
                                const hasOverlap = checkTimeOverlap(
                                  startTime,
                                  e.target.value,
                                  scheduleForm.getValues('dayOfWeek'),
                                  instructorSchedules
                                );
                                if (hasOverlap) {
                                  scheduleForm.setError('endTime', {
                                    type: 'manual',
                                    message:
                                      '해당 요일 시간대가 겹치는 스케줄이 이미 존재합니다.',
                                  });
                                }
                              }
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={scheduleForm.control}
                  name="slotMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>예약 단위 (분)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={scheduleForm.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>수용 인원</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={scheduleForm.control}
                  name="periodStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>적용 시작일</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date() ||
                              (scheduleForm.getValues('periodEnd') &&
                                date > scheduleForm.getValues('periodEnd'))
                            }
                            initialFocus
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={scheduleForm.control}
                  name="periodEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>적용 종료일</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < scheduleForm.getValues('periodStart')
                            }
                            initialFocus
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit">추가</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 타임슬롯 삭제 확인 다이얼로그 */}
      <Dialog
        open={isDeleteTimeSlotDialogOpen}
        onOpenChange={setIsDeleteTimeSlotDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>타임슬롯 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 타임슬롯을 삭제하시겠습니까? 이 작업은 되돌릴 수
              없습니다.
              {timeSlotToDelete && (
                <div className="mt-2 text-sm">
                  <div>프로그램명: {timeSlotToDelete.scheduleName}</div>
                  <div>날짜: {formatDateSafely(timeSlotToDelete.date)}</div>
                  <div>
                    시간: {formatTime(timeSlotToDelete.startTime)} -{' '}
                    {formatTime(timeSlotToDelete.endTime)}
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteTimeSlotDialogOpen(false)}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteTimeSlotConfirm}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
