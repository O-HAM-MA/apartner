'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  MoreHorizontal,
  Plus,
  Trash,
  ChevronLeft,
  Calendar as CalendarIcon,
  Table as TableIcon,
  Edit,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import client from '@/lib/backend/client';
import { components } from '@/lib/backend/apiV1/schema';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type InstructorSimpleResponseDto =
  components['schemas']['InstructorSimpleResponseDto'];

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

type Instructor = {
  id: number;
  name: string;
  description: string;
};

type FacilityOperatingHours = {
  startTime: string;
  endTime: string;
};

type CreateTimeSlotForm = {
  scheduleName: string;
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
};

export default function InstructorSchedulePage() {
  const router = useRouter();
  const { facilityId, instructorId } = useParams();
  const { toast } = useToast();
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [operatingHours, setOperatingHours] = useState<FacilityOperatingHours>({
    startTime: '09:00:00',
    endTime: '18:00:00',
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
      .toISOString()
      .split('T')[0],
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTimeSlotForm>({
    scheduleName: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    maxCapacity: 1,
  });

  // 타임슬롯을 캘린더 이벤트로 변환
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

  // 강사 정보 조회
  const fetchInstructorDetail = async () => {
    try {
      const response = await client.GET(
        '/api/v1/admin/facilities/{facilityId}/instructors/{instructorId}',
        {
          params: {
            path: {
              facilityId: Number(facilityId),
              instructorId: Number(instructorId),
            },
          },
        }
      );

      if (response.data) {
        const instructorData = response.data as InstructorSimpleResponseDto;
        if (instructorData.instructorId && instructorData.name) {
          setInstructor({
            id: instructorData.instructorId,
            name: instructorData.name,
            description: instructorData.description || '',
          });
        }
      }
    } catch (error) {
      console.error('강사 정보 조회 실패:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '강사 정보를 불러오는데 실패했습니다.',
      });
    }
  };

  // 타임슬롯 목록 조회
  const fetchTimeSlots = async () => {
    try {
      const response = await client.GET(
        '/api/v1/admin/facilities/{facilityId}/instructors/{instructorId}/schedules/timeslots',
        {
          params: {
            path: {
              facilityId: Number(facilityId),
              instructorId: Number(instructorId),
            },
            query: {
              startDate: dateRange.startDate,
              endDate: dateRange.endDate,
            },
          },
        }
      );

      if (response.data && Array.isArray(response.data)) {
        setTimeSlots(response.data as TimeSlot[]);
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

  // 시설 영업시간 조회
  const fetchFacilityOperatingHours = async () => {
    try {
      const response = await client.GET(
        '/api/v1/admin/facilities/{facilityId}',
        {
          params: {
            path: {
              facilityId: Number(facilityId),
            },
          },
        }
      );

      if (response.data) {
        const facilityData = response.data;
        if (facilityData.openTime && facilityData.closeTime) {
          setOperatingHours({
            startTime: facilityData.openTime,
            endTime: facilityData.closeTime,
          });
        }
      }
    } catch (error) {
      console.error('시설 영업시간 조회 실패:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '시설 영업시간을 불러오는데 실패했습니다.',
      });
    }
  };

  // 타임슬롯 삭제
  const handleDeleteSlot = async () => {
    if (!selectedSlot) return;

    try {
      await client.DELETE(
        '/api/v1/admin/facilities/{facilityId}/instructors/{instructorId}/schedules/timeslots/{timeSlotId}',
        {
          params: {
            path: {
              facilityId: Number(facilityId),
              instructorId: Number(instructorId),
              timeSlotId: selectedSlot.timeSlotId,
            },
          },
        }
      );

      toast({
        title: '성공',
        description: '타임슬롯이 삭제되었습니다.',
      });
      setIsDeleteDialogOpen(false);
      fetchTimeSlots();
    } catch (error) {
      console.error('타임슬롯 삭제 실패:', error);
      toast({
        variant: 'destructive',
        title: '삭제 실패',
        description: '타임슬롯 삭제에 실패했습니다.',
      });
    }
  };

  // 강사 정보 수정
  const handleEditInstructor = async () => {
    try {
      await client.PUT(
        '/api/v1/admin/facilities/{facilityId}/instructors/{instructorId}',
        {
          params: {
            path: {
              facilityId: Number(facilityId),
              instructorId: Number(instructorId),
            },
          },
          body: {
            name: editForm.name,
            description: editForm.description,
          },
        }
      );

      toast({
        title: '성공',
        description: '강사 정보가 수정되었습니다.',
      });
      setIsEditDialogOpen(false);
      fetchInstructorDetail();
    } catch (error) {
      console.error('강사 정보 수정 실패:', error);
      toast({
        variant: 'destructive',
        title: '수정 실패',
        description: '강사 정보 수정에 실패했습니다.',
      });
    }
  };

  // 수정 다이얼로그 열기
  const handleOpenEditDialog = () => {
    if (instructor) {
      setEditForm({
        name: instructor.name,
        description: instructor.description,
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  // 타임슬롯 생성
  const handleCreateTimeSlot = async () => {
    try {
      await client.POST(
        '/api/v1/admin/facilities/{facilityId}/instructors/{instructorId}/schedules/timeslots',
        {
          params: {
            path: {
              facilityId: Number(facilityId),
              instructorId: Number(instructorId),
            },
          },
          body: {
            scheduleName: createForm.scheduleName,
            date: createForm.date,
            startTime: createForm.startTime + ':00',
            endTime: createForm.endTime + ':00',
            maxCapacity: createForm.maxCapacity,
          },
        }
      );

      toast({
        title: '성공',
        description: '타임슬롯이 등록되었습니다.',
      });
      setIsCreateDialogOpen(false);
      fetchTimeSlots();
    } catch (error) {
      console.error('타임슬롯 등록 실패:', error);
      toast({
        variant: 'destructive',
        title: '등록 실패',
        description: '타임슬롯 등록에 실패했습니다.',
      });
    }
  };

  useEffect(() => {
    fetchFacilityOperatingHours();
    fetchInstructorDetail();
    fetchTimeSlots();
  }, [dateRange]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleGoBack} size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">공용시설 관리</h2>
            <p className="text-muted-foreground">
              아파트 공용시설을 등록하고 관리하세요
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>강사 정보</CardTitle>
              <CardDescription>강사의 상세 정보를 확인합니다</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenEditDialog}
              className="hover:bg-red-100 active:bg-red-200"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium">이름</h4>
              <p className="text-lg">{instructor?.name}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium">소개</h4>
              <p className="text-muted-foreground">{instructor?.description}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>타임슬롯 관리</CardTitle>
                <CardDescription>
                  강사의 수업 타임슬롯을 관리합니다
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  등록
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setViewMode('calendar')}
                  className={`hover:bg-red-100 active:bg-red-200 ${
                    viewMode === 'calendar' ? 'bg-red-50' : ''
                  }`}
                >
                  <CalendarIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setViewMode('table')}
                  className={`hover:bg-red-100 active:bg-red-200 ${
                    viewMode === 'table' ? 'bg-red-50' : ''
                  }`}
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-4">
              <div className="flex items-center space-x-2">
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, startDate: e.target.value })
                  }
                  className="hover:bg-red-100 active:bg-red-200"
                />
                <span>~</span>
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, endDate: e.target.value })
                  }
                  className="hover:bg-red-100 active:bg-red-200"
                />
              </div>
            </div>
            {viewMode === 'calendar' ? (
              <div className="h-[800px] fc-custom-theme">
                <style jsx global>{`
                  .fc-custom-theme .fc-button {
                    background-color: white !important;
                    border-color: #e5e7eb !important;
                    color: black !important;
                  }

                  .fc-custom-theme .fc-button:hover {
                    background-color: #fee2e2 !important;
                  }

                  .fc-custom-theme .fc-button:active {
                    background-color: #fecaca !important;
                  }

                  .fc-custom-theme .fc-button-active {
                    background-color: #fef2f2 !important;
                  }

                  .fc-custom-theme .fc-button-active:hover {
                    background-color: #fee2e2 !important;
                  }
                `}</style>
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay',
                  }}
                  events={calendarEvents}
                  locale={koLocale}
                  allDaySlot={false}
                  slotMinTime={operatingHours.startTime}
                  slotMaxTime={operatingHours.endTime}
                  height="100%"
                  buttonText={{
                    today: '오늘',
                    month: '월간',
                    week: '주간',
                    day: '일간',
                  }}
                  eventClick={(info) => {
                    const slot = info.event.extendedProps as TimeSlot;
                    if (slot && !slot.isFull && slot.reservedCount === 0) {
                      setSelectedSlot(slot);
                      setIsDeleteDialogOpen(true);
                    }
                  }}
                  buttonIcons={{
                    prev: 'chevron-left',
                    next: 'chevron-right',
                  }}
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>날짜</TableHead>
                    <TableHead>프로그램명</TableHead>
                    <TableHead>시간</TableHead>
                    <TableHead>정원</TableHead>
                    <TableHead>예약</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeSlots.map((slot) => (
                    <TableRow key={slot.timeSlotId}>
                      <TableCell>{slot.date}</TableCell>
                      <TableCell>{slot.scheduleName}</TableCell>
                      <TableCell>
                        {slot.startTime} ~ {slot.endTime}
                      </TableCell>
                      <TableCell>{slot.maxCapacity}</TableCell>
                      <TableCell>{slot.reservedCount}</TableCell>
                      <TableCell>
                        {slot.isFull ? (
                          <Badge
                            variant="default"
                            className="bg-red-200 hover:bg-red-200 text-red-800"
                          >
                            마감
                          </Badge>
                        ) : (
                          <Badge variant="secondary">예약가능</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedSlot(slot);
                            setIsDeleteDialogOpen(true);
                          }}
                          disabled={slot.reservedCount > 0}
                          className="hover:bg-red-100 active:bg-red-200"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 강사 정보 수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>강사 정보 수정</DialogTitle>
            <DialogDescription>강사의 정보를 수정합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                이름
              </Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                소개
              </Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="hover:bg-red-100 active:bg-red-200"
            >
              취소
            </Button>
            <Button
              onClick={handleEditInstructor}
              className="hover:bg-red-100 active:bg-red-200"
            >
              수정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 타임슬롯 삭제 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>타임슬롯 삭제</DialogTitle>
            <DialogDescription>
              {selectedSlot?.date} {selectedSlot?.startTime}~
              {selectedSlot?.endTime} 수업을 삭제하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="hover:bg-red-100 active:bg-red-200"
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSlot}
              className="hover:bg-red-100 active:bg-red-200"
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 타임슬롯 등록 다이얼로그 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>타임슬롯 등록</DialogTitle>
            <DialogDescription>새로운 타임슬롯을 등록합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="scheduleName" className="text-right">
                프로그램명
              </Label>
              <Input
                id="scheduleName"
                value={createForm.scheduleName}
                onChange={(e) =>
                  setCreateForm({ ...createForm, scheduleName: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                날짜
              </Label>
              <Input
                id="date"
                type="date"
                value={createForm.date}
                onChange={(e) =>
                  setCreateForm({ ...createForm, date: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">
                시작 시간
              </Label>
              <Input
                id="startTime"
                type="time"
                value={createForm.startTime}
                onChange={(e) =>
                  setCreateForm({ ...createForm, startTime: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endTime" className="text-right">
                종료 시간
              </Label>
              <Input
                id="endTime"
                type="time"
                value={createForm.endTime}
                onChange={(e) =>
                  setCreateForm({ ...createForm, endTime: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxCapacity" className="text-right">
                정원
              </Label>
              <Input
                id="maxCapacity"
                type="number"
                min="1"
                value={createForm.maxCapacity}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    maxCapacity: parseInt(e.target.value) || 1,
                  })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              className="hover:bg-red-100 active:bg-red-200"
            >
              취소
            </Button>
            <Button
              onClick={handleCreateTimeSlot}
              className="hover:bg-red-100 active:bg-red-200"
            >
              등록
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
