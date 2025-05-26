'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import {
  Search,
  MoreHorizontal,
  Plus,
  Edit,
  Trash,
  ChevronLeft,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import client from '@/lib/backend/client';
import { components } from '@/lib/backend/apiV1/schema';

type FacilityDetailResponseDto =
  components['schemas']['FacilityDetailResponseDto'];
type InstructorListResponseDto =
  components['schemas']['InstructorListResponseDto'];

type Instructor = {
  id: number;
  name: string;
  description: string;
};
type Facility = {
  id: number;
  name: string;
  description: string;
  openTime: string;
  closeTime: string;
  status: string;
};

export default function FacilityDetailPage() {
  const router = useRouter();
  const { facilityId } = useParams();
  const { toast } = useToast();
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(
    null
  );
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] =
    useState<Instructor | null>(null);
  const [newInstructor, setNewInstructor] = useState<{
    name: string;
    description: string;
  }>({
    name: '',
    description: '',
  });
  const [isEditFacilityOpen, setIsEditFacilityOpen] = useState(false);

  // 시간 형식을 HH:mm:ss -> H:mm 형식으로 변환
  const formatTimeDisplay = (time: string | undefined | null) => {
    if (!time) return '9:00';
    const [hours, minutes] = time.split(':');
    return `${parseInt(hours)}:${minutes || '00'}`;
  };

  // 시간 형식을 HH:mm:ss 형식으로 변환
  const formatTimeForBackend = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes || '00'}`;
  };

  // 시간 형식을 HH:mm 형식으로 변환
  const formatTimeForInput = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours.padStart(2, '0')}:${minutes || '00'}`;
  };

  // 강사 목록 조회
  const fetchInstructors = async () => {
    try {
      const response = await client.GET(
        '/api/v1/admin/facilities/{facilityId}/instructors',
        {
          params: {
            path: {
              facilityId: Number(facilityId),
            },
          },
        }
      );

      if (response.data) {
        const instructorList = response.data as InstructorListResponseDto[];
        setInstructors(
          instructorList.map((instructor) => ({
            id: instructor.instructorId,
            name: instructor.name,
            description: instructor.description || '',
          }))
        );
      } else {
        setInstructors([]);
        toast({
          variant: 'destructive',
          title: '오류',
          description: '강사 목록을 불러오는데 실패했습니다.',
        });
      }
    } catch (error) {
      console.error('강사 목록 조회 실패:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '강사 목록을 불러오는데 실패했습니다.',
      });
      setInstructors([]);
    }
  };

  // 시설 정보 조회
  const fetchFacilityDetail = async () => {
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
        const facilityData = response.data as FacilityDetailResponseDto;
        setSelectedFacility({
          id: facilityData.facilityId,
          name: facilityData.facilityName,
          description: facilityData.description || '',
          openTime: formatTimeForInput(facilityData.openTime),
          closeTime: formatTimeForInput(facilityData.closeTime),
          status: facilityData.status || 'ACTIVE',
        });
      }
    } catch (error) {
      console.error('시설 정보 조회 실패:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '시설 정보를 불러오는데 실패했습니다.',
      });
    }
  };

  // 시설 수정
  const handleEditFacility = async () => {
    if (!selectedFacility) return;

    try {
      const response = await client.PUT(
        '/api/v1/admin/facilities/{facilityId}',
        {
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
        }
      );

      toast({
        title: '성공',
        description: '시설 정보가 수정되었습니다.',
      });
      setIsEditFacilityOpen(false);
      fetchFacilityDetail();
    } catch (error: any) {
      console.error('시설 수정 실패:', error);

      // 백엔드 에러 메시지 처리
      let errorMessage = '시설 수정에 실패했습니다.';

      // error.response.data가 문자열인 경우 (서버에서 직접 에러 메시지를 보내는 경우)
      if (typeof error?.response?.data === 'string') {
        errorMessage = error.response.data;
      }
      // error.response.data가 객체인 경우
      else if (error?.response?.data) {
        errorMessage =
          error.response.data.message ||
          error.response.data.error ||
          errorMessage;
      }

      // 특정 에러 메시지에 대한 사용자 친화적인 메시지 매핑
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('찾을 수 없습니다')) {
        userFriendlyMessage = '해당 공용시설을 찾을 수 없습니다.';
      } else if (errorMessage.includes('이미 운영 중인 시설 이름입니다')) {
        userFriendlyMessage =
          '이미 사용 중인 시설 이름입니다. 다른 이름을 입력해주세요.';
      } else if (
        errorMessage.includes('시작 시간과 종료 시간이 같을 수 없습니다')
      ) {
        userFriendlyMessage = '운영 시작 시간과 종료 시간이 같을 수 없습니다.';
      }

      toast({
        variant: 'destructive',
        title: '수정 실패',
        description: userFriendlyMessage,
      });
    }
  };

  useEffect(() => {
    fetchFacilityDetail();
    fetchInstructors();
  }, [facilityId]);

  // 강사 등록
  const handleAddInstructor = async () => {
    try {
      await client.POST('/api/v1/admin/facilities/{facilityId}/instructors', {
        params: {
          path: {
            facilityId: Number(facilityId),
          },
        },
        body: newInstructor,
      });

      toast({
        title: '성공',
        description: '강사가 등록되었습니다.',
      });
      setIsAddDialogOpen(false);
      setNewInstructor({
        name: '',
        description: '',
      });
      fetchInstructors();
    } catch (error: any) {
      console.error('강사 등록 실패:', error);

      // 백엔드 에러 메시지 처리
      let errorMessage = error?.response?.data;

      // 에러 메시지가 문자열이 아닌 경우 기본 메시지 사용
      if (typeof errorMessage !== 'string') {
        errorMessage = '강사 등록에 실패했습니다.';
      }

      toast({
        variant: 'destructive',
        title: '등록 실패',
        description: errorMessage,
      });
    }
  };

  // 강사 수정
  const handleEditInstructor = async () => {
    if (!selectedInstructor) return;

    try {
      await client.PUT(
        '/api/v1/admin/facilities/{facilityId}/instructors/{instructorId}',
        {
          params: {
            path: {
              facilityId: Number(facilityId),
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
      setIsEditDialogOpen(false);
      fetchInstructors();
    } catch (error: any) {
      console.error('강사 수정 실패:', error);

      // 백엔드 에러 메시지 처리
      let errorMessage = error?.response?.data;

      // 에러 메시지가 문자열이 아닌 경우 기본 메시지 사용
      if (typeof errorMessage !== 'string') {
        errorMessage = '강사 수정에 실패했습니다.';
      }

      toast({
        variant: 'destructive',
        title: '수정 실패',
        description: errorMessage,
      });
    }
  };

  // 강사 삭제
  const handleDeleteInstructor = async () => {
    if (!selectedInstructor) return;

    try {
      await client.DELETE(
        '/api/v1/admin/facilities/{facilityId}/instructors/{instructorId}',
        {
          params: {
            path: {
              facilityId: Number(facilityId),
              instructorId: selectedInstructor.id,
            },
          },
        }
      );
      toast({
        title: '성공',
        description: '강사가 삭제되었습니다.',
      });
      setIsDeleteDialogOpen(false);
      fetchInstructors();
    } catch (error: any) {
      console.error('강사 삭제 실패:', error);

      // 백엔드 에러 메시지 처리
      let errorMessage = error?.response?.data;

      // 에러 메시지가 문자열이 아닌 경우 기본 메시지 사용
      if (typeof errorMessage !== 'string') {
        errorMessage = '강사 삭제에 실패했습니다.';
      }

      toast({
        variant: 'destructive',
        title: '삭제 실패',
        description: errorMessage,
      });
    }
  };

  // 뒤로 가기
  const handleGoBack = () => {
    router.push('/admin/facilities');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">공용시설 관리</h2>
          <p className="text-muted-foreground">
            아파트 공용시설을 등록하고 관리하세요
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>시설 정보</CardTitle>
            <CardDescription>시설의 상세 정보를 확인합니다</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">메뉴 열기</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>작업</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsEditFacilityOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                수정
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium">시설명</h4>
            <p className="text-lg">{selectedFacility?.name}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium">설명</h4>
            <p className="text-muted-foreground">
              {selectedFacility?.description}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium">이용시간</h4>
            <p className="text-muted-foreground">
              {selectedFacility
                ? `${formatTimeDisplay(
                    selectedFacility.openTime
                  )} - ${formatTimeDisplay(selectedFacility.closeTime)}`
                : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>강사 목록</CardTitle>
            <CardDescription>등록된 강사 목록을 관리합니다</CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            강사 등록
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="강사 검색..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">번호</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>소개</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instructors
                  .filter((instructor) =>
                    instructor.name
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  )
                  .map((instructor, index) => (
                    <TableRow key={instructor.id}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {instructor.name}
                      </TableCell>
                      <TableCell>{instructor.description}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">메뉴 열기</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>작업</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedInstructor(instructor);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              수정
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setSelectedInstructor(instructor);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash className="mr-2 h-4 w-4" />
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
        </CardContent>
      </Card>

      <div className="flex justify-start">
        <Button variant="ghost" onClick={handleGoBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          시설 목록으로 돌아가기
        </Button>
      </div>

      {/* 강사 등록 모달 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>강사 등록</DialogTitle>
            <DialogDescription>새로운 강사를 등록합니다.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="font-medium">
                이름
              </label>
              <Input
                id="name"
                placeholder="이름을 입력하세요"
                value={newInstructor.name}
                onChange={(e) =>
                  setNewInstructor({ ...newInstructor, name: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="description" className="font-medium">
                소개
              </label>
              <Input
                id="description"
                placeholder="강사 소개를 입력하세요"
                value={newInstructor.description}
                onChange={(e) =>
                  setNewInstructor({
                    ...newInstructor,
                    description: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleAddInstructor}>등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 강사 수정 모달 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>강사 수정</DialogTitle>
            <DialogDescription>강사 정보를 수정합니다.</DialogDescription>
          </DialogHeader>

          {selectedInstructor && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="edit-name" className="font-medium">
                  이름
                </label>
                <Input
                  id="edit-name"
                  value={selectedInstructor.name}
                  onChange={(e) =>
                    setSelectedInstructor({
                      ...selectedInstructor,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="edit-description" className="font-medium">
                  소개
                </label>
                <Input
                  id="edit-description"
                  value={selectedInstructor.description}
                  onChange={(e) =>
                    setSelectedInstructor({
                      ...selectedInstructor,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleEditInstructor}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 강사 삭제 모달 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>강사 삭제</DialogTitle>
            <DialogDescription>
              {selectedInstructor?.name} 강사를 삭제하시겠습니까? 이 작업은
              되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteInstructor}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 시설 수정 모달 */}
      <Dialog open={isEditFacilityOpen} onOpenChange={setIsEditFacilityOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>시설 수정</DialogTitle>
            <DialogDescription>공용시설 정보를 수정합니다.</DialogDescription>
          </DialogHeader>

          {selectedFacility && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="edit-name" className="font-medium">
                  시설명
                </label>
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
                <label htmlFor="edit-description" className="font-medium">
                  설명
                </label>
                <Input
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
                  <label htmlFor="edit-openTime" className="font-medium">
                    운영 시작 시간
                  </label>
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
                  <label htmlFor="edit-closeTime" className="font-medium">
                    운영 종료 시간
                  </label>
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
              onClick={() => setIsEditFacilityOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleEditFacility}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
