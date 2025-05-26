'use client';

import { useEffect, useState } from 'react';
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
import { Search, MoreHorizontal, Plus, Edit, Trash } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { components } from '@/lib/backend/apiV1/schema';
import client from '@/lib/backend/client';

type FacilityCreateRequestDto =
  components['schemas']['FacilityCreateRequestDto'];
type FacilityUpdateRequestDto =
  components['schemas']['FacilityUpdateRequestDto'];
type FacilityManagerSimpleResponseDto =
  components['schemas']['FacilityManagerSimpleResponseDto'];
type Facility = {
  id: number;
  name: string;
  description: string;
  openTime: string;
  closeTime: string;
  status: string;
};

export default function FacilitiesPage() {
  const { toast } = useToast();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(
    null
  );
  const [newFacility, setNewFacility] = useState<FacilityCreateRequestDto>({
    name: '',
    description: '',
    openTime: '09:00',
    closeTime: '18:00',
  });

  // 시간 형식 변환 (HH:mm:ss -> H:mm)
  const formatTimeDisplay = (time: string | undefined | null) => {
    if (!time) return '9:00';
    const [hours, minutes] = time.split(':');
    return `${parseInt(hours)}:${minutes}`;
  };

  // 운영 시간 표시 형식 (자정 이후 시간은 '익일' 표시)
  const formatOperatingHours = (openTime: string, closeTime: string) => {
    const openHour = parseInt(openTime.split(':')[0]);
    const closeHour = parseInt(closeTime.split(':')[0]);

    if (closeHour < openHour || closeHour === 0) {
      return `${openTime} - 익일 ${closeTime}`;
    }
    return `${openTime} - ${closeTime}`;
  };

  // 시설 목록 조회
  const fetchFacilities = async () => {
    try {
      const response = await client.GET('/api/v1/admin/facilities', {
        params: {
          query: {
            page: 0,
            size: 100,
            sort: 'desc',
          },
        },
      });

      if (response.data) {
        const facilityList = response.data || [];
        setFacilities(
          facilityList.map((item: FacilityManagerSimpleResponseDto) => ({
            id: item.facilityId || 0,
            name: item.facilityName || '',
            description: item.description || '',
            openTime: formatTimeDisplay(item.openTime),
            closeTime: formatTimeDisplay(item.closeTime),
            status: 'AVAILABLE',
          }))
        );
      } else {
        setFacilities([]);
        toast({
          variant: 'destructive',
          title: '오류',
          description: '시설 목록을 불러오는데 실패했습니다.',
        });
      }
    } catch (error) {
      console.error('시설 목록 조회 실패:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '시설 목록을 불러오는데 실패했습니다.',
      });
      setFacilities([]);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  // 시설 등록
  const handleAddFacility = async () => {
    try {
      // 시간 형식을 HH:mm:ss 형식으로 변환
      const formatTimeForBackend = (time: string) => {
        const [hours, minutes] = time.split(':');
        return `${hours.padStart(2, '0')}:${minutes}:00`;
      };

      await client.POST('/api/v1/admin/facilities', {
        body: {
          name: newFacility.name,
          description: newFacility.description,
          openTime: formatTimeForBackend(newFacility.openTime),
          closeTime: formatTimeForBackend(newFacility.closeTime),
        },
      });

      toast({
        title: '성공',
        description: '시설이 등록되었습니다.',
      });
      setIsAddDialogOpen(false);
      setNewFacility({
        name: '',
        description: '',
        openTime: '09:00',
        closeTime: '18:00',
      });
      fetchFacilities();
    } catch (error) {
      console.error('시설 등록 실패:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '시설 등록에 실패했습니다.',
      });
    }
  };

  // 시설 수정
  const handleEditClick = (facility: Facility) => {
    // 시간 형식을 HH:mm 형식으로 변환
    const formatTimeForInput = (time: string) => {
      const [hours, minutes] = time.split(':');
      return `${hours.padStart(2, '0')}:${minutes}`;
    };

    setSelectedFacility({
      ...facility,
      openTime: formatTimeForInput(facility.openTime),
      closeTime: formatTimeForInput(facility.closeTime),
    });
    setIsEditDialogOpen(true);
  };

  // 시설 수정
  const handleEditFacility = async () => {
    if (!selectedFacility) return;

    try {
      const updateData = {
        name: selectedFacility.name,
        description: selectedFacility.description,
        openTime: `${selectedFacility.openTime}:00`,
        closeTime: `${selectedFacility.closeTime}:00`,
      };

      await client.PUT(`/api/v1/admin/facilities/${selectedFacility.id}`, {
        body: updateData,
      });

      toast({
        title: '성공',
        description: '시설 정보가 수정되었습니다.',
      });
      setIsEditDialogOpen(false);
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

  // 시설 삭제
  const handleDeleteFacility = async () => {
    if (!selectedFacility) return;

    try {
      await client.DELETE(`/api/v1/admin/facilities/${selectedFacility.id}`);
      toast({
        title: '성공',
        description: '시설이 삭제되었습니다.',
      });
      setIsDeleteDialogOpen(false);
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
            <CardTitle>시설 목록</CardTitle>
            <CardDescription>등록된 공용시설 목록을 관리합니다</CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            시설 등록
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="시설 검색..."
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
                  <TableHead>시설명</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead>운영시간</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facilities
                  .filter(
                    (facility) =>
                      facility?.name
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ?? false
                  )
                  .map((facility) => (
                    <TableRow key={facility.id}>
                      <TableCell className="font-medium">
                        {facility.name}
                      </TableCell>
                      <TableCell>{facility.description}</TableCell>
                      <TableCell>
                        {formatOperatingHours(
                          facility.openTime,
                          facility.closeTime
                        )}
                      </TableCell>
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
                                handleEditClick(facility);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              수정
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setSelectedFacility(facility);
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

      {/* 시설 등록 모달 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>시설 등록</DialogTitle>
            <DialogDescription>새로운 공용시설을 등록합니다.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="font-medium">
                시설명
              </label>
              <Input
                id="name"
                placeholder="시설명을 입력하세요"
                value={newFacility.name}
                onChange={(e) =>
                  setNewFacility({ ...newFacility, name: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="description" className="font-medium">
                설명
              </label>
              <Input
                id="description"
                placeholder="시설 설명을 입력하세요"
                value={newFacility.description}
                onChange={(e) =>
                  setNewFacility({
                    ...newFacility,
                    description: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="openTime" className="font-medium">
                  운영 시작 시간
                </label>
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
                <label htmlFor="closeTime" className="font-medium">
                  운영 종료 시간
                </label>
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
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleAddFacility}>등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 시설 수정 모달 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
              onClick={() => setIsEditDialogOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleEditFacility}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 시설 삭제 모달 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteFacility}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
