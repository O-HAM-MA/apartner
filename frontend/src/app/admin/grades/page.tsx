"use client";

import { useState, useEffect } from "react";
import { get, post, put, del } from "@/utils/api"; // axios 대신 api 유틸리티 함수 import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Shield,
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  LayoutDashboard,
  Users,
  MessageSquare,
  BarChart3,
  Bell,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";

// API 기본 URL
const API_BASE_URL = "/api/v1/admin/menu";

// Define types
interface Grade {
  id: string;
  name: string;
  description: string;
  grade: string;
  usersCount: number;
  menuIds: string[]; // 선택된 메뉴 ID 배열
}

interface Menu {
  id: string;
  name: string;
  url: string;
  description: string;
  icon?: string; // 아이콘 필드 추가
}

// API 응답 타입 정의
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// 페이지네이션 응답 타입
interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// 아이콘 매핑
const iconMap: Record<string, any> = {
  LayoutDashboard: LayoutDashboard,
  Users: Users,
  Shield: Shield,
  Settings: Settings,
  MessageSquare: MessageSquare,
  BarChart3: BarChart3,
  Bell: Bell,
  FileText: FileText,
};

export default function GradesPage() {
  // State for grades and menus
  const [grades, setGrades] = useState<Grade[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);

  // 로딩 상태
  const [loading, setLoading] = useState({
    grades: false,
    menus: false,
    action: false,
  });

  // 페이지네이션 관련 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMenus, setTotalMenus] = useState(0);
  const itemsPerPage = 5; // 페이지당 표시할 아이템 수
  const totalPages = Math.ceil(totalMenus / itemsPerPage);

  // Dialog states
  const [isAddGradeDialogOpen, setIsAddGradeDialogOpen] = useState(false);
  const [isMenuSettingDialogOpen, setIsMenuSettingDialogOpen] = useState(false);
  const [isAddMenuDialogOpen, setIsAddMenuDialogOpen] = useState(false);
  const [isEditMenuDialogOpen, setIsEditMenuDialogOpen] = useState(false);
  const [isDeleteMenuDialogOpen, setIsDeleteMenuDialogOpen] = useState(false);

  // Selected items
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);

  // New grade and menu states
  const [newGrade, setNewGrade] = useState<Partial<Grade>>({
    name: "",
    description: "",
    grade: "",
    menuIds: [],
  });

  const [newMenu, setNewMenu] = useState<Partial<Menu>>({
    name: "",
    url: "",
    description: "",
  });

  // 데이터 불러오기
  useEffect(() => {
    fetchGrades();
    fetchAllMenus();
  }, []);

  // 페이지 변경시 메뉴 데이터 불러오기
  useEffect(() => {
    fetchPagedMenus(currentPage);
  }, [currentPage]);

  // API 함수들
  const fetchGrades = async () => {
    try {
      setLoading((prev) => ({ ...prev, grades: true }));
      const response = await get<ApiResponse<any[]>>(`${API_BASE_URL}/grades`);
      if (response.success) {
        setGrades(
          response.data.map((grade: any) => ({
            id: grade.id.toString(),
            name: grade.name,
            description: grade.description,
            grade: `${grade.level}등급`,
            usersCount: grade.usersCount || 0,
            menuIds: grade.menuIds?.map((id: number) => id.toString()) || [],
          }))
        );
      }
    } catch (error) {
      console.error("등급 목록을 불러오는데 실패했습니다:", error);
      toast({
        title: "오류",
        description:
          "등급 목록을 불러오는데 실패했습니다. 인증이 필요할 수 있습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, grades: false }));
    }
  };

  const fetchAllMenus = async () => {
    try {
      setLoading((prev) => ({ ...prev, menus: true }));
      const response = await get<ApiResponse<any[]>>(
        `${API_BASE_URL}/menus/list`
      );
      if (response.success) {
        setMenus(
          response.data.map((menu: any) => ({
            id: menu.id.toString(),
            name: menu.name,
            url: menu.url,
            description: menu.description || "",
          }))
        );
        setTotalMenus(response.data.length);
      }
    } catch (error) {
      console.error("메뉴 목록을 불러오는데 실패했습니다:", error);
      toast({
        title: "오류",
        description:
          "메뉴 목록을 불러오는데 실패했습니다. 인증이 필요할 수 있습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, menus: false }));
    }
  };

  const fetchPagedMenus = async (page: number) => {
    try {
      setLoading((prev) => ({ ...prev, menus: true }));
      // URL 쿼리 파라미터로 변환
      const url = `${API_BASE_URL}/menus?page=${page - 1}&size=${itemsPerPage}`;
      const response = await get<ApiResponse<PageResponse<any>>>(url);
      if (response.success) {
        const pageData = response.data;
        const mappedMenus = pageData.content.map((menu: any) => ({
          id: menu.id.toString(),
          name: menu.name,
          url: menu.url,
          description: menu.description || "",
          icon: menu.icon || "", // icon 필드가 null이면 빈 문자열로 처리
        }));

        // 현재 페이지 메뉴만 업데이트
        setMenus(mappedMenus);
        setTotalMenus(pageData.totalElements);
        console.log("메뉴 데이터 로드됨:", mappedMenus); // 디버깅용 로그 추가
      }
    } catch (error) {
      console.error("메뉴 페이지를 불러오는데 실패했습니다:", error);
      toast({
        title: "오류",
        description:
          "메뉴 목록을 불러오는데 실패했습니다. 인증이 필요할 수 있습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, menus: false }));
    }
  };

  // Handle adding a new grade
  const handleAddGrade = async () => {
    try {
      setLoading((prev) => ({ ...prev, action: true }));

      // API 요청 형식에 맞게 데이터 변환
      const gradeToAdd = {
        name: newGrade.name,
        description: newGrade.description || "",
        level: grades.length + 1, // 레벨은 기존 등급 수 + 1로 설정
        menuIds: newGrade.menuIds?.map((id) => parseInt(id)) || [],
      };

      const response = await post<ApiResponse<any>>(
        `${API_BASE_URL}/grades`,
        gradeToAdd
      );

      if (response.success) {
        toast({
          title: "성공",
          description: "새 등급이 추가되었습니다.",
        });

        // 등급 목록 다시 불러오기
        await fetchGrades();

        // 상태 초기화
        setNewGrade({ name: "", description: "", grade: "", menuIds: [] });
        setIsAddGradeDialogOpen(false);
      }
    } catch (error) {
      console.error("등급 추가에 실패했습니다:", error);
      toast({
        title: "오류",
        description: "등급 추가에 실패했습니다. 인증이 필요할 수 있습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  // Handle editing a grade
  const handleEditGrade = async () => {
    if (!selectedGrade) return;

    try {
      setLoading((prev) => ({ ...prev, action: true }));

      // API 요청 형식에 맞게 데이터 변환
      const gradeToUpdate = {
        name: newGrade.name,
        description: newGrade.description || "",
        level: parseInt(selectedGrade.grade.replace("등급", "")), // "N등급"에서 N 추출
        menuIds: newGrade.menuIds?.map((id) => parseInt(id)) || [],
      };

      const response = await put<ApiResponse<any>>(
        `${API_BASE_URL}/grades/${selectedGrade.id}`,
        gradeToUpdate
      );

      if (response.success) {
        // 메뉴 할당 API 호출
        if (newGrade.menuIds && newGrade.menuIds.length > 0) {
          await put<ApiResponse<any>>(
            `${API_BASE_URL}/grades/${selectedGrade.id}/menus`,
            newGrade.menuIds.map((id) => parseInt(id))
          );
        }

        toast({
          title: "성공",
          description: "등급이 수정되었습니다.",
        });

        // 등급 목록 다시 불러오기
        await fetchGrades();

        // 상태 초기화
        setIsAddGradeDialogOpen(false);
      }
    } catch (error) {
      console.error("등급 수정에 실패했습니다:", error);
      toast({
        title: "오류",
        description: "등급 수정에 실패했습니다. 인증이 필요할 수 있습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  // Handle adding a new menu
  const handleAddMenu = async () => {
    try {
      setLoading((prev) => ({ ...prev, action: true }));

      // API 요청 형식에 맞게 데이터 변환
      const menuToAdd = {
        name: newMenu.name,
        url: newMenu.url,
        description: newMenu.description || "",
        icon: newMenu.icon || "", // 아이콘 추가
      };

      const response = await post<ApiResponse<any>>(
        `${API_BASE_URL}/menus`,
        menuToAdd
      );

      if (response.success) {
        toast({
          title: "성공",
          description: "새 메뉴가 추가되었습니다.",
        });

        // 메뉴 목록 다시 불러오기
        await fetchPagedMenus(currentPage);
        await fetchAllMenus(); // 전체 메뉴 목록도 업데이트

        // 상태 초기화
        setNewMenu({ name: "", url: "", description: "", icon: "" });
        setIsAddMenuDialogOpen(false);
      }
    } catch (error) {
      console.error("메뉴 추가에 실패했습니다:", error);
      toast({
        title: "오류",
        description: "메뉴 추가에 실패했습니다. 인증이 필요할 수 있습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  // Handle editing a menu
  const handleEditMenu = async () => {
    if (!selectedMenu) return;

    try {
      setLoading((prev) => ({ ...prev, action: true }));

      // API 요청 형식에 맞게 데이터 변환
      const menuToUpdate = {
        name: newMenu.name,
        url: newMenu.url,
        description: newMenu.description || "",
        icon: newMenu.icon || "", // 빈 문자열 기본값 설정
      };

      console.log("업데이트할 메뉴 데이터:", menuToUpdate); // 디버깅용 로그 추가

      const response = await put<ApiResponse<any>>(
        `${API_BASE_URL}/menus/${selectedMenu.id}`,
        menuToUpdate
      );

      if (response.success) {
        toast({
          title: "성공",
          description: "메뉴가 수정되었습니다.",
        });

        // 메뉴 목록 다시 불러오기
        await fetchPagedMenus(currentPage);
        await fetchAllMenus(); // 전체 메뉴 목록도 업데이트

        // 상태 초기화
        setIsEditMenuDialogOpen(false);
      }
    } catch (error) {
      console.error("메뉴 수정에 실패했습니다:", error);
      toast({
        title: "오류",
        description: "메뉴 수정에 실패했습니다. 인증이 필요할 수 있습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  // Handle deleting a menu
  const handleDeleteMenu = async () => {
    if (!selectedMenu) return;

    try {
      setLoading((prev) => ({ ...prev, action: true }));

      const response = await del<ApiResponse<any>>(
        `${API_BASE_URL}/menus/${selectedMenu.id}`
      );

      if (response.success) {
        toast({
          title: "성공",
          description: "메뉴가 삭제되었습니다.",
        });

        // 메뉴 목록 다시 불러오기
        // 마지막 페이지의 항목을 삭제한 경우 이전 페이지로 이동
        const newTotalPages = Math.ceil((totalMenus - 1) / itemsPerPage);
        if (currentPage > newTotalPages && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          await fetchPagedMenus(currentPage);
        }

        await fetchAllMenus(); // 전체 메뉴 목록도 업데이트

        // 상태 초기화
        setIsDeleteMenuDialogOpen(false);
      }
    } catch (error) {
      console.error("메뉴 삭제에 실패했습니다:", error);

      // 오류 메시지 처리 개선
      let errorMessage = "메뉴 삭제에 실패했습니다.";

      // error 객체에서 실제 메시지 추출 시도
      if (error instanceof Error) {
        const errorText = error.message;

        // 외래 키 제약 조건 오류인 경우 (409 Conflict)
        if (
          errorText.includes("409") &&
          errorText.includes("이 메뉴는 하나 이상의 등급에서 사용 중입니다")
        ) {
          errorMessage =
            "이 메뉴는 하나 이상의 등급에서 사용 중입니다. 삭제하기 전에 모든 등급에서 이 메뉴를 선택 해제해주세요.";
        }
        // API 응답에 메시지가 있는 경우
        else if (errorText.includes("message")) {
          try {
            const errorData = JSON.parse(
              errorText.substring(
                errorText.indexOf("{"),
                errorText.lastIndexOf("}") + 1
              )
            );
            if (errorData.message) {
              errorMessage = errorData.message;
            }
          } catch (e) {
            // JSON 파싱 실패 시 기본 메시지 사용
          }
        }
      }

      toast({
        title: "오류",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 역할에 메뉴 추가/제거 핸들러
  const toggleMenuForGrade = (menuId: string) => {
    if (!newGrade.menuIds) {
      setNewGrade({ ...newGrade, menuIds: [menuId] });
      return;
    }

    if (newGrade.menuIds.includes(menuId)) {
      setNewGrade({
        ...newGrade,
        menuIds: newGrade.menuIds.filter((id) => id !== menuId),
      });
    } else {
      setNewGrade({
        ...newGrade,
        menuIds: [...newGrade.menuIds, menuId],
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">메뉴 등급 관리</h1>
          <p className="text-muted-foreground">
            시스템 사용자의 메뉴 등급과 접근 권한을 관리합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsMenuSettingDialogOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            메뉴 설정
          </Button>
          <Button
            onClick={() => {
              setSelectedGrade(null);
              setNewGrade({
                name: "",
                description: "",
                grade: "",
                menuIds: [],
              });
              setIsAddGradeDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            등급 추가
          </Button>
        </div>
      </div>

      {/* 등급 목록 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>등급 목록</CardTitle>
          <CardDescription>조직의 등급 및 권한을 관리합니다</CardDescription>
        </CardHeader>
        <CardContent>
          {loading.grades ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>설명</TableHead>
                    <TableHead>등급</TableHead>
                    <TableHead>사용자 수</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.length > 0 ? (
                    grades.map((grade) => (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium">
                          {grade.name}
                        </TableCell>
                        <TableCell>{grade.description}</TableCell>
                        <TableCell>{grade.grade}</TableCell>
                        <TableCell>{grade.usersCount}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">메뉴 열기</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* <DropdownMenuLabel>작업</DropdownMenuLabel> */}
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedGrade(grade);
                                  setNewGrade({
                                    id: grade.id,
                                    name: grade.name,
                                    description: grade.description,
                                    grade: grade.grade,
                                    menuIds: [...grade.menuIds],
                                  });
                                  setIsAddGradeDialogOpen(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                수정
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-6 text-muted-foreground"
                      >
                        등록된 등급이 없습니다
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 등급 추가/수정 모달 */}
      <Dialog
        open={isAddGradeDialogOpen}
        onOpenChange={setIsAddGradeDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedGrade ? "등급 수정" : "등급 추가"}
            </DialogTitle>
            <DialogDescription>메뉴 접근 등급을 정의합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                value={newGrade.name}
                onChange={(e) =>
                  setNewGrade({ ...newGrade, name: e.target.value })
                }
                placeholder="예: 관리자"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">설명</Label>
              <Input
                id="description"
                value={newGrade.description}
                onChange={(e) =>
                  setNewGrade({ ...newGrade, description: e.target.value })
                }
                placeholder="이 등급에 대한 간략한 설명"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="grade">등급</Label>
              <Input
                id="grade"
                value={
                  selectedGrade
                    ? selectedGrade.grade
                    : `${grades.length + 1}등급`
                }
                disabled
                readOnly
              />
            </div>

            {/* 메뉴 목록 */}
            <div className="grid gap-2 mt-4">
              <Label>메뉴 권한</Label>
              {loading.menus ? (
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="rounded-md border max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">선택</TableHead>
                        <TableHead>아이콘</TableHead>
                        <TableHead>메뉴 이름</TableHead>
                        <TableHead>메뉴 URL</TableHead>
                        <TableHead>설명</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {menus.length > 0 ? (
                        menus.map((menu) => (
                          <TableRow key={menu.id}>
                            <TableCell>
                              <Checkbox
                                checked={
                                  newGrade.menuIds?.includes(menu.id) || false
                                }
                                onCheckedChange={() =>
                                  toggleMenuForGrade(menu.id)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              {menu.icon && iconMap[menu.icon] ? (
                                React.createElement(iconMap[menu.icon], {
                                  className: "h-4 w-4",
                                })
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {menu.name}
                            </TableCell>
                            <TableCell>{menu.url}</TableCell>
                            <TableCell>{menu.description}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-4 text-muted-foreground"
                          >
                            등록된 메뉴가 없습니다
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddGradeDialogOpen(false)}
              disabled={loading.action}
            >
              취소
            </Button>
            <Button
              onClick={selectedGrade ? handleEditGrade : handleAddGrade}
              disabled={loading.action}
            >
              {loading.action ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                "저장"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 메뉴 설정 모달 */}
      <Dialog
        open={isMenuSettingDialogOpen}
        onOpenChange={setIsMenuSettingDialogOpen}
      >
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>메뉴 설정</DialogTitle>
            <DialogDescription>
              시스템에서 사용할 메뉴를 설정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => {
                setNewMenu({ name: "", url: "", description: "", icon: "" });
                setIsAddMenuDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              메뉴 등록
            </Button>
          </div>
          {loading.menus ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>아이콘</TableHead>
                    <TableHead>메뉴 이름</TableHead>
                    <TableHead>메뉴 URL</TableHead>
                    <TableHead>설명</TableHead>
                    <TableHead className="w-[80px]">수정</TableHead>
                    <TableHead className="w-[80px]">삭제</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {menus.length > 0 ? (
                    menus.map((menu, index) => (
                      <TableRow key={menu.id}>
                        <TableCell>
                          {menu.icon && iconMap[menu.icon] ? (
                            React.createElement(iconMap[menu.icon], {
                              className: "h-4 w-4",
                            })
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {menu.name}
                        </TableCell>
                        <TableCell>{menu.url}</TableCell>
                        <TableCell>{menu.description}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              console.log("선택된 메뉴:", menu); // 디버깅용 로그 추가
                              setSelectedMenu(menu);
                              setNewMenu({
                                id: menu.id,
                                name: menu.name,
                                url: menu.url,
                                description: menu.description || "",
                                icon: menu.icon || "", // 아이콘 정보 명시적으로 설정
                              });
                              setIsEditMenuDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => {
                              setSelectedMenu(menu);
                              setIsDeleteMenuDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-6 text-muted-foreground"
                      >
                        등록된 메뉴가 없습니다
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* 페이지네이션 */}
          {menus.length > 0 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 메뉴 등록 모달 */}
      <Dialog open={isAddMenuDialogOpen} onOpenChange={setIsAddMenuDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>메뉴 등록</DialogTitle>
            <DialogDescription>새로운 메뉴를 등록합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="menu-name">메뉴 이름</Label>
              <Input
                id="menu-name"
                value={newMenu.name}
                onChange={(e) =>
                  setNewMenu({ ...newMenu, name: e.target.value })
                }
                placeholder="예: 대시보드"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="menu-url">메뉴 URL</Label>
              <Input
                id="menu-url"
                value={newMenu.url}
                onChange={(e) =>
                  setNewMenu({ ...newMenu, url: e.target.value })
                }
                placeholder="예: /dashboard"
              />
            </div>
            <div className="grid gap-2">
              <Label>아이콘 선택</Label>
              <div className="flex flex-wrap gap-4 py-2">
                <div
                  className={`flex flex-col items-center gap-1 cursor-pointer rounded-lg border p-3 hover:bg-accent ${
                    newMenu.icon === "LayoutDashboard" ? "bg-accent" : ""
                  }`}
                  onClick={() =>
                    setNewMenu({ ...newMenu, icon: "LayoutDashboard" })
                  }
                >
                  <LayoutDashboard className="h-8 w-8" />
                  <span className="text-xs">대시보드</span>
                </div>
                <div
                  className={`flex flex-col items-center gap-1 cursor-pointer rounded-lg border p-3 hover:bg-accent ${
                    newMenu.icon === "Users" ? "bg-accent" : ""
                  }`}
                  onClick={() => setNewMenu({ ...newMenu, icon: "Users" })}
                >
                  <Users className="h-8 w-8" />
                  <span className="text-xs">사용자</span>
                </div>
                <div
                  className={`flex flex-col items-center gap-1 cursor-pointer rounded-lg border p-3 hover:bg-accent ${
                    newMenu.icon === "Shield" ? "bg-accent" : ""
                  }`}
                  onClick={() => setNewMenu({ ...newMenu, icon: "Shield" })}
                >
                  <Shield className="h-8 w-8" />
                  <span className="text-xs">보안</span>
                </div>
                <div
                  className={`flex flex-col items-center gap-1 cursor-pointer rounded-lg border p-3 hover:bg-accent ${
                    newMenu.icon === "Settings" ? "bg-accent" : ""
                  }`}
                  onClick={() => setNewMenu({ ...newMenu, icon: "Settings" })}
                >
                  <Settings className="h-8 w-8" />
                  <span className="text-xs">설정</span>
                </div>
                <div
                  className={`flex flex-col items-center gap-1 cursor-pointer rounded-lg border p-3 hover:bg-accent ${
                    newMenu.icon === "MessageSquare" ? "bg-accent" : ""
                  }`}
                  onClick={() =>
                    setNewMenu({ ...newMenu, icon: "MessageSquare" })
                  }
                >
                  <MessageSquare className="h-8 w-8" />
                  <span className="text-xs">채팅</span>
                </div>
                <div
                  className={`flex flex-col items-center gap-1 cursor-pointer rounded-lg border p-3 hover:bg-accent ${
                    newMenu.icon === "FileText" ? "bg-accent" : ""
                  }`}
                  onClick={() => setNewMenu({ ...newMenu, icon: "FileText" })}
                >
                  <FileText className="h-8 w-8" />
                  <span className="text-xs">문서</span>
                </div>
                <div
                  className={`flex flex-col items-center gap-1 cursor-pointer rounded-lg border p-3 hover:bg-accent ${
                    newMenu.icon === "BarChart3" ? "bg-accent" : ""
                  }`}
                  onClick={() => setNewMenu({ ...newMenu, icon: "BarChart3" })}
                >
                  <BarChart3 className="h-8 w-8" />
                  <span className="text-xs">차트</span>
                </div>
                <div
                  className={`flex flex-col items-center gap-1 cursor-pointer rounded-lg border p-3 hover:bg-accent ${
                    newMenu.icon === "Bell" ? "bg-accent" : ""
                  }`}
                  onClick={() => setNewMenu({ ...newMenu, icon: "Bell" })}
                >
                  <Bell className="h-8 w-8" />
                  <span className="text-xs">알림</span>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="menu-description">설명</Label>
              <Input
                id="menu-description"
                value={newMenu.description}
                onChange={(e) =>
                  setNewMenu({ ...newMenu, description: e.target.value })
                }
                placeholder="이 메뉴에 대한 간략한 설명"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddMenuDialogOpen(false)}
              disabled={loading.action}
            >
              취소
            </Button>
            <Button onClick={handleAddMenu} disabled={loading.action}>
              {loading.action ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                "등록"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 메뉴 수정 모달 */}
      <Dialog
        open={isEditMenuDialogOpen}
        onOpenChange={setIsEditMenuDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>메뉴 수정</DialogTitle>
            <DialogDescription>메뉴 정보를 수정합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-menu-name">메뉴 이름</Label>
              <Input
                id="edit-menu-name"
                value={newMenu.name}
                onChange={(e) =>
                  setNewMenu({ ...newMenu, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-menu-url">메뉴 URL</Label>
              <Input
                id="edit-menu-url"
                value={newMenu.url}
                onChange={(e) =>
                  setNewMenu({ ...newMenu, url: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>아이콘 선택</Label>
              <div className="flex flex-wrap gap-4 py-2">
                <div
                  className={`flex flex-col items-center gap-1 cursor-pointer rounded-lg border p-3 hover:bg-accent ${
                    newMenu.icon === "LayoutDashboard" ? "bg-accent" : ""
                  }`}
                  onClick={() =>
                    setNewMenu({ ...newMenu, icon: "LayoutDashboard" })
                  }
                >
                  <LayoutDashboard className="h-8 w-8" />
                  <span className="text-xs">대시보드</span>
                </div>
                <div
                  className={`flex flex-col items-center gap-1 cursor-pointer rounded-lg border p-3 hover:bg-accent ${
                    newMenu.icon === "Users" ? "bg-accent" : ""
                  }`}
                  onClick={() => setNewMenu({ ...newMenu, icon: "Users" })}
                >
                  <Users className="h-8 w-8" />
                  <span className="text-xs">사용자</span>
                </div>
                <div
                  className={`flex flex-col items-center gap-1 cursor-pointer rounded-lg border p-3 hover:bg-accent ${
                    newMenu.icon === "Shield" ? "bg-accent" : ""
                  }`}
                  onClick={() => setNewMenu({ ...newMenu, icon: "Shield" })}
                >
                  <Shield className="h-8 w-8" />
                  <span className="text-xs">보안</span>
                </div>
                <div
                  className={`flex flex-col items-center gap-1 cursor-pointer rounded-lg border p-3 hover:bg-accent ${
                    newMenu.icon === "Settings" ? "bg-accent" : ""
                  }`}
                  onClick={() => setNewMenu({ ...newMenu, icon: "Settings" })}
                >
                  <Settings className="h-8 w-8" />
                  <span className="text-xs">설정</span>
                </div>
                <div
                  className={`flex flex-col items-center gap-1 cursor-pointer rounded-lg border p-3 hover:bg-accent ${
                    newMenu.icon === "MessageSquare" ? "bg-accent" : ""
                  }`}
                  onClick={() =>
                    setNewMenu({ ...newMenu, icon: "MessageSquare" })
                  }
                >
                  <MessageSquare className="h-8 w-8" />
                  <span className="text-xs">채팅</span>
                </div>
                <div
                  className={`flex flex-col items-center gap-1 cursor-pointer rounded-lg border p-3 hover:bg-accent ${
                    newMenu.icon === "FileText" ? "bg-accent" : ""
                  }`}
                  onClick={() => setNewMenu({ ...newMenu, icon: "FileText" })}
                >
                  <FileText className="h-8 w-8" />
                  <span className="text-xs">문서</span>
                </div>
                <div
                  className={`flex flex-col items-center gap-1 cursor-pointer rounded-lg border p-3 hover:bg-accent ${
                    newMenu.icon === "BarChart3" ? "bg-accent" : ""
                  }`}
                  onClick={() => setNewMenu({ ...newMenu, icon: "BarChart3" })}
                >
                  <BarChart3 className="h-8 w-8" />
                  <span className="text-xs">차트</span>
                </div>
                <div
                  className={`flex flex-col items-center gap-1 cursor-pointer rounded-lg border p-3 hover:bg-accent ${
                    newMenu.icon === "Bell" ? "bg-accent" : ""
                  }`}
                  onClick={() => setNewMenu({ ...newMenu, icon: "Bell" })}
                >
                  <Bell className="h-8 w-8" />
                  <span className="text-xs">알림</span>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-menu-description">설명</Label>
              <Input
                id="edit-menu-description"
                value={newMenu.description}
                onChange={(e) =>
                  setNewMenu({ ...newMenu, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditMenuDialogOpen(false)}
              disabled={loading.action}
            >
              취소
            </Button>
            <Button onClick={handleEditMenu} disabled={loading.action}>
              {loading.action ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                "저장"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 메뉴 삭제 확인 모달 */}
      <AlertDialog
        open={isDeleteMenuDialogOpen}
        onOpenChange={setIsDeleteMenuDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>메뉴 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 '{selectedMenu?.name}' 메뉴를 삭제하시겠습니까? 이 작업은
              되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading.action}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive"
              onClick={handleDeleteMenu}
              disabled={loading.action}
            >
              {loading.action ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                "삭제"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
