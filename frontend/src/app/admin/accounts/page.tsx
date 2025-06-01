"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MoreHorizontal,
  UserPlus,
  Edit,
  Trash,
  Key,
  Building as BuildingIcon,
  Home,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { PaginationControl } from "@/components/ui/pagination";

// 관리자 계정 서비스 import
import adminAccountService, {
  AdminAccount,
  AdminGrade,
  Apartment,
  AdminBuilding,
  AccountRequest,
  PasswordChangeRequest,
} from "@/utils/adminAccountService";

const adminRoles = ["ADMIN", "MANAGER"];

export default function AdminAccountsPage() {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [grades, setGrades] = useState<AdminGrade[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [buildings, setBuildings] = useState<AdminBuilding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] =
    useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminAccount | null>(null);
  const [newAdmin, setNewAdmin] = useState<AccountRequest>({
    name: "",
    email: "",
    role: "",
    password: "",
    active: true,
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetPasswordData, setResetPasswordData] =
    useState<PasswordChangeRequest>({
      password: "",
      confirmPassword: "",
    });

  // State to track if apartment and building selection UI should be shown
  const [showApartmentSelect, setShowApartmentSelect] = useState(false);
  const [showBuildingSelect, setShowBuildingSelect] = useState(false);

  const fetchAdminAccounts = async () => {
    try {
      setLoading(true);
      setError(null);

      const accountsResponse = await adminAccountService.getAccountsByPage(
        currentPage,
        pageSize,
        "id",
        "DESC"
      );

      setAdmins(accountsResponse.content);
      setTotalPages(accountsResponse.totalPages);
      setTotalElements(accountsResponse.totalElements);
    } catch (err) {
      console.error("Failed to load accounts", err);
      setError("계정 정보를 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        await fetchAdminAccounts();

        const [gradesResult, apartmentsResult] = await Promise.allSettled([
          adminAccountService.getAdminGrades(),
          adminAccountService.getAllApartments(),
        ]);

        if (gradesResult.status === "fulfilled") {
          setGrades(gradesResult.value);
        } else {
          console.error("Failed to load grades", gradesResult.reason);
        }

        if (apartmentsResult.status === "fulfilled") {
          setApartments(apartmentsResult.value);
        } else {
          console.error("Failed to load apartments", apartmentsResult.reason);
        }
      } catch (err) {
        console.error("Failed to load initial data", err);
        setError("데이터를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchAdminAccounts();
  }, [currentPage, pageSize]);

  // Role 선택에 따라 필드 활성화/비활성화 처리
  useEffect(() => {
    // ADMIN 역할 선택 시 등급, 아파트, 동 필드 초기화
    if (newAdmin.role === "ADMIN") {
      setNewAdmin((prev) => ({
        ...prev,
        gradeId: undefined,
        apartmentId: undefined,
        buildingId: undefined,
      }));
      setBuildings([]);
      // ADMIN 선택 시 아파트/건물 선택 UI 숨기기
      setShowApartmentSelect(false);
      setShowBuildingSelect(false);
    }
  }, [newAdmin.role]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleApartmentChange = async (apartmentId: number) => {
    if (!apartmentId) return;

    // 건물 목록 초기화 및 상태 업데이트
    setBuildings([]);
    setNewAdmin((prev: AccountRequest) => ({
      ...prev,
      apartmentId,
      buildingId: undefined,
    }));

    try {
      // 로딩 상태 설정
      const loadingToast = toast({
        title: "건물 목록 로드 중",
        description: "건물 정보를 불러오는 중입니다...",
      });

      // 건물 목록 가져오기 - 오류 방지를 위해 try-catch로 래핑
      try {
        const buildingsData =
          await adminAccountService.getBuildingsByApartmentId(apartmentId);

        if (buildingsData && buildingsData.length > 0) {
          // 건물 데이터가 있는 경우
          setBuildings(buildingsData);
          // 건물 선택 UI는 표시하지 않고 데이터만 로드
          toast({
            title: "건물 목록 로드 완료",
            description: `${buildingsData.length}개의 건물 정보를 불러왔습니다.`,
          });
        } else {
          // 건물 데이터가 없는 경우
          toast({
            title: "건물 정보 없음",
            description: "해당 아파트에 등록된 건물이 없습니다.",
          });
        }
      } catch (error) {
        console.error("API 오류:", error);
        toast({
          title: "건물 목록 로드 실패",
          description: "서버 내부 오류가 발생했습니다. 관리자에게 문의하세요.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Failed to load buildings", err);
      toast({
        title: "건물 목록 로드 실패",
        description: "건물 정보를 가져오는데 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const handleEditApartmentChange = async (apartmentId: number) => {
    if (!selectedAdmin) return;

    // 아파트 선택 해제 처리
    if (!apartmentId) {
      setSelectedAdmin({
        ...selectedAdmin,
        apartmentId: undefined,
        buildingId: undefined,
      });
      setBuildings([]);
      return;
    }

    // 건물 목록 초기화 및 아파트 ID 업데이트
    setBuildings([]);
    setSelectedAdmin({
      ...selectedAdmin,
      apartmentId,
      buildingId: undefined,
    });

    try {
      // 로딩 상태 설정
      const loadingToast = toast({
        title: "건물 목록 로드 중",
        description: "건물 정보를 불러오는 중입니다...",
      });

      try {
        // 건물 목록 가져오기
        const buildingsData =
          await adminAccountService.getBuildingsByApartmentId(apartmentId);

        // 건물 목록 설정
        if (buildingsData && Array.isArray(buildingsData)) {
          setBuildings(buildingsData);

          if (buildingsData.length === 0) {
            toast({
              title: "건물 정보 없음",
              description: "해당 아파트에 등록된 건물이 없습니다.",
            });
          }
        } else {
          // 응답이 배열이 아닌 경우 처리
          setBuildings([]);
          toast({
            title: "건물 정보 형식 오류",
            description: "서버에서 올바른 형식의 데이터를 받지 못했습니다.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("API 오류:", error);
        toast({
          title: "건물 목록 로드 실패",
          description: "서버 내부 오류가 발생했습니다. 관리자에게 문의하세요.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Failed to load buildings during edit", err);
      toast({
        title: "건물 목록 로드 실패",
        description: "건물 정보를 가져오는데 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  // 수정 모달에서 사용할 건물 목록 로드 함수 추가
  const loadBuildingsForEdit = async (apartmentId: number) => {
    try {
      const buildingsData = await adminAccountService.getBuildingsByApartmentId(
        apartmentId
      );
      setBuildings(buildingsData);
    } catch (err) {
      console.error("Failed to load buildings for edit", err);
      toast({
        title: "건물 목록 로드 실패",
        description: "건물 정보를 가져오는데 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.apartmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.buildingNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 관리자 추가 다이얼로그 열기 처리
  const handleOpenAddDialog = () => {
    // 모든 필드 초기화
    setNewAdmin({
      name: "",
      email: "",
      role: "",
      password: "",
      active: true,
    });
    setConfirmPassword("");
    setBuildings([]);
    setShowApartmentSelect(false);
    setShowBuildingSelect(false);
    setIsAddDialogOpen(true);
  };

  const handleAddAdmin = async () => {
    if (newAdmin.password !== confirmPassword) {
      toast({
        title: "비밀번호 불일치",
        description: "비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      // 이메일에 @apartner.site 도메인 자동 추가
      const adminRequest = {
        ...newAdmin,
        email: newAdmin.email.includes("@")
          ? newAdmin.email
          : `${newAdmin.email}@apartner.site`,
      };

      const result = await adminAccountService.createAccount(adminRequest);

      // 새로운 계정이 현재 페이지에 포함되도록 현재 페이지의 데이터 다시 불러오기
      await fetchAdminAccounts();

      setNewAdmin({
        name: "",
        email: "",
        role: "",
        password: "",
        active: true,
      });
      setConfirmPassword("");
      setIsAddDialogOpen(false);

      toast({
        title: "계정 생성 완료",
        description: "관리자 계정이 성공적으로 생성되었습니다.",
      });
    } catch (err: any) {
      console.error("Failed to create admin account", err);
      toast({
        title: "계정 생성 실패",
        description:
          err.response?.data?.error || "관리자 계정 생성에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleEditAdmin = async () => {
    if (!selectedAdmin) return;

    try {
      const updateRequest: AccountRequest = {
        name: selectedAdmin.name,
        email: selectedAdmin.email,
        role: selectedAdmin.role,
        apartmentId: selectedAdmin.apartmentId,
        buildingId: selectedAdmin.buildingId,
        gradeId: selectedAdmin.gradeId,
        active: selectedAdmin.status === "ACTIVE",
      };

      await adminAccountService.updateAccount(selectedAdmin.id, updateRequest);

      // 수정 후 현재 페이지 데이터 다시 불러오기
      await fetchAdminAccounts();

      setIsEditDialogOpen(false);

      toast({
        title: "계정 수정 완료",
        description: "관리자 계정이 성공적으로 수정되었습니다.",
      });
    } catch (err: any) {
      console.error("Failed to update admin account", err);
      toast({
        title: "계정 수정 실패",
        description:
          err.response?.data?.error || "관리자 계정 수정에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;

    try {
      await adminAccountService.deleteAccount(selectedAdmin.id);

      // 삭제 후 현재 페이지 데이터 다시 불러오기
      await fetchAdminAccounts();

      setIsDeleteDialogOpen(false);

      toast({
        title: "계정 삭제 완료",
        description: "관리자 계정이 성공적으로 삭제되었습니다.",
      });
    } catch (err: any) {
      console.error("Failed to delete admin account", err);
      toast({
        title: "계정 삭제 실패",
        description:
          err.response?.data?.error || "관리자 계정 삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (adminId: number, newStatus: boolean) => {
    try {
      await adminAccountService.changeAccountStatus(adminId, newStatus);

      // 상태 변경 후 현재 페이지 데이터 다시 불러오기
      await fetchAdminAccounts();

      toast({
        title: "상태 변경 완료",
        description: `관리자 계정이 ${
          newStatus ? "활성화" : "비활성화"
        } 되었습니다.`,
      });
    } catch (err: any) {
      console.error("Failed to change account status", err);
      toast({
        title: "상태 변경 실패",
        description:
          err.response?.data?.error || "관리자 계정 상태 변경에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedAdmin) return;

    if (resetPasswordData.password !== resetPasswordData.confirmPassword) {
      toast({
        title: "비밀번호 불일치",
        description: "비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      await adminAccountService.resetPassword(
        selectedAdmin.id,
        resetPasswordData
      );

      setIsResetPasswordDialogOpen(false);

      setResetPasswordData({
        password: "",
        confirmPassword: "",
      });

      toast({
        title: "비밀번호 재설정 완료",
        description: "비밀번호가 성공적으로 변경되었습니다.",
      });
    } catch (err: any) {
      console.error("Failed to reset password", err);
      toast({
        title: "비밀번호 재설정 실패",
        description:
          err.response?.data?.error || "비밀번호 재설정에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "없음";
    try {
      return format(new Date(dateStr), "yyyy-MM-dd HH:mm");
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">관리자 계정</h2>
          <p className="text-muted-foreground">관리자 계정 및 접근 권한 관리</p>
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={handleOpenAddDialog}
        >
          <UserPlus className="h-4 w-4" />
          관리자 추가
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>관리자 목록</CardTitle>
          <CardDescription>
            시스템 접근 권한이 있는 관리자 계정을 조회하고 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="검색어 입력 (이름, 이메일, 역할, 아파트, 동)"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* 페이지 크기 선택 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">표시 개수:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(0); // 페이지 크기 변경 시 첫 페이지로
                }}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">이름</TableHead>
                  <TableHead className="text-center">이메일</TableHead>
                  <TableHead className="text-center">역할</TableHead>
                  <TableHead className="text-center">아파트/동</TableHead>
                  <TableHead className="text-center">등급</TableHead>
                  <TableHead className="text-center">마지막 로그인</TableHead>
                  <TableHead className="text-center">상태</TableHead>
                  <TableHead className="text-center">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      데이터 로딩 중...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-red-500"
                    >
                      {error}
                    </TableCell>
                  </TableRow>
                ) : filteredAdmins.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      관리자 계정이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium text-center">
                        {admin.name}
                      </TableCell>
                      <TableCell className="text-center">
                        {admin.email}
                      </TableCell>
                      <TableCell className="text-center">
                        {admin.role}
                      </TableCell>
                      <TableCell className="text-center">
                        {admin.apartmentName ? (
                          <div className="flex items-center justify-center gap-2">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            {admin.apartmentName}
                            {admin.buildingNumber && (
                              <>
                                <span>/</span>
                                <BuildingIcon className="h-4 w-4 text-muted-foreground" />
                                {admin.buildingNumber}동
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            지정 없음
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {admin.gradeName
                          ? `${admin.gradeName}${
                              admin.gradeLevel
                                ? ` (Lv.${admin.gradeLevel})`
                                : ""
                            }`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatDate(admin.lastLogin)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              admin.status === "ACTIVE"
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          />
                          <span>
                            {admin.status === "ACTIVE" ? "활성" : "비활성"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
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
                                setSelectedAdmin(admin);
                                // 수정 모달을 열기 전에 해당 아파트의 건물 목록을 가져옴
                                if (admin.apartmentId) {
                                  loadBuildingsForEdit(admin.apartmentId);
                                }
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              수정
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAdmin(admin);
                                setResetPasswordData({
                                  password: "",
                                  confirmPassword: "",
                                });
                                setIsResetPasswordDialogOpen(true);
                              }}
                            >
                              <Key className="mr-2 h-4 w-4" />
                              비밀번호 변경
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {admin.status === "ACTIVE" ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(admin.id, false)
                                }
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                비활성화
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(admin.id, true)
                                }
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                활성화
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setSelectedAdmin(admin);
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Component */}
          {!loading && !error && totalPages > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  총 <span className="font-medium">{totalElements}</span>개 항목
                  중{" "}
                  <span className="font-medium">
                    {currentPage * pageSize + 1}-
                    {Math.min((currentPage + 1) * pageSize, totalElements)}
                  </span>
                  개 표시
                </div>

                <PaginationControl
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>관리자 추가</DialogTitle>
            <DialogDescription>
              시스템 접근 권한이 있는 새 관리자 계정을 생성합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="font-medium">
                이름
              </label>
              <Input
                id="name"
                placeholder="이름 입력"
                value={newAdmin.name}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, name: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="email" className="font-medium">
                이메일
              </label>
              <div className="flex items-center">
                <Input
                  id="email"
                  placeholder="아이디 입력"
                  value={newAdmin.email}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, email: e.target.value })
                  }
                  className="rounded-r-none"
                />
                <div className="bg-muted px-3 py-2 text-sm border border-l-0 border-input rounded-r-md">
                  @apartner.site
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="role" className="font-medium">
                역할
              </label>
              <Select
                value={newAdmin.role}
                onValueChange={(value) =>
                  setNewAdmin({ ...newAdmin, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="역할 선택" />
                </SelectTrigger>
                <SelectContent>
                  {adminRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ADMIN 역할이 아닐 때만 표시 */}
            {newAdmin.role && newAdmin.role !== "ADMIN" && (
              <div className="grid gap-2">
                <label htmlFor="grade" className="font-medium">
                  등급
                </label>
                <Select
                  value={newAdmin.gradeId?.toString() || ""}
                  onValueChange={(value) =>
                    setNewAdmin({ ...newAdmin, gradeId: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="등급 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id.toString()}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* ADMIN 역할이 아닐 때만 아파트/건물 관련 UI 표시 */}
            {newAdmin.role && newAdmin.role !== "ADMIN" && (
              <>
                {!showApartmentSelect ? (
                  <div className="grid gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowApartmentSelect(true)}
                    >
                      <Home className="mr-2 h-4 w-4" />
                      아파트 추가
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <label htmlFor="apartment" className="font-medium">
                      아파트
                    </label>
                    <Select
                      value={newAdmin.apartmentId?.toString() || ""}
                      onValueChange={(value) => {
                        setNewAdmin({
                          ...newAdmin,
                          apartmentId: Number(value),
                          buildingId: undefined,
                        });
                        handleApartmentChange(Number(value));
                        // 아파트 선택 시 동 선택 UI는 자동으로 표시하지 않음
                        setShowBuildingSelect(false);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="아파트 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {apartments.map((apt) => (
                          <SelectItem key={apt.id} value={apt.id.toString()}>
                            {apt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* 아파트 선택 후 동 추가 버튼 표시 */}
                {newAdmin.apartmentId && !showBuildingSelect ? (
                  <div className="grid gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowBuildingSelect(true)}
                    >
                      <BuildingIcon className="mr-2 h-4 w-4" />동 추가
                    </Button>
                  </div>
                ) : null}

                {/* 동 선택 UI - 동 추가 버튼 클릭 후 표시 */}
                {newAdmin.apartmentId && showBuildingSelect && (
                  <div className="grid gap-2">
                    <label htmlFor="building" className="font-medium">
                      동
                    </label>
                    <Select
                      value={newAdmin.buildingId?.toString() || ""}
                      onValueChange={(value) =>
                        setNewAdmin({ ...newAdmin, buildingId: Number(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            buildings.length ? "동 선택" : "로드 중..."
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {buildings.length > 0 ? (
                          buildings.map((building) => (
                            <SelectItem
                              key={`${newAdmin.apartmentId}-${building.id}`}
                              value={building.id.toString()}
                            >
                              {building.buildingNumber}동
                            </SelectItem>
                          ))
                        ) : (
                          <div className="text-muted-foreground p-2 text-sm">
                            {buildings.length === 0 && "건물 정보가 없습니다"}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            <div className="grid gap-2">
              <label htmlFor="password" className="font-medium">
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호 입력"
                value={newAdmin.password}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, password: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="confirmPassword" className="font-medium">
                비밀번호 확인
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="비밀번호 확인"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleAddAdmin}
              disabled={
                !newAdmin.name ||
                !newAdmin.email ||
                !newAdmin.role ||
                !newAdmin.password ||
                !confirmPassword
              }
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>관리자 수정</DialogTitle>
            <DialogDescription>
              관리자 계정 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>

          {selectedAdmin && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="edit-name" className="font-medium">
                  이름
                </label>
                <Input
                  id="edit-name"
                  value={selectedAdmin.name}
                  onChange={(e) =>
                    setSelectedAdmin({ ...selectedAdmin, name: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="edit-email" className="font-medium">
                  이메일
                </label>
                <Input
                  id="edit-email"
                  type="email"
                  value={selectedAdmin.email}
                  onChange={(e) =>
                    setSelectedAdmin({
                      ...selectedAdmin,
                      email: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="edit-role" className="font-medium">
                  역할
                </label>
                <Select
                  value={selectedAdmin.role}
                  onValueChange={(value) => {
                    setSelectedAdmin((prev) => {
                      if (!prev) return prev;
                      if (value === "ADMIN") {
                        return {
                          ...prev,
                          role: value,
                          gradeId: undefined,
                          apartmentId: undefined,
                          buildingId: undefined,
                        };
                      }
                      return { ...prev, role: value };
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="역할 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {adminRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ADMIN이 아닐 때만 등급/아파트/동 UI 노출 */}
              {selectedAdmin.role !== "ADMIN" && (
                <>
                  <div className="grid gap-2">
                    <label htmlFor="edit-grade" className="font-medium">
                      등급
                    </label>
                    <Select
                      value={selectedAdmin.gradeId?.toString() || ""}
                      onValueChange={(value) =>
                        setSelectedAdmin({
                          ...selectedAdmin,
                          gradeId: Number(value),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="등급 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((grade) => (
                          <SelectItem
                            key={grade.id}
                            value={grade.id.toString()}
                          >
                            {grade.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="edit-apartment" className="font-medium">
                      아파트
                    </label>
                    <Select
                      value={selectedAdmin.apartmentId?.toString() || "none"}
                      onValueChange={(value) =>
                        handleEditApartmentChange(
                          value === "none" ? 0 : Number(value)
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="아파트 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">선택 안함</SelectItem>
                        {apartments.map((apt) => (
                          <SelectItem key={apt.id} value={apt.id.toString()}>
                            {apt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedAdmin.apartmentId && (
                    <div className="grid gap-2">
                      <label htmlFor="edit-building" className="font-medium">
                        동
                      </label>
                      <Select
                        value={selectedAdmin.buildingId?.toString() || "none"}
                        onValueChange={(value) =>
                          setSelectedAdmin({
                            ...selectedAdmin,
                            buildingId:
                              value === "none" ? undefined : Number(value),
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="동 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">선택 안함</SelectItem>
                          {buildings.map((building) => (
                            <SelectItem
                              key={`${selectedAdmin.apartmentId}-${building.id}`}
                              value={building.id.toString()}
                            >
                              {building.buildingNumber}동
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}

              <div className="grid gap-2">
                <label htmlFor="edit-status" className="font-medium">
                  상태
                </label>
                <Select
                  value={selectedAdmin.status}
                  onValueChange={(value) =>
                    setSelectedAdmin({ ...selectedAdmin, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">활성</SelectItem>
                    <SelectItem value="INACTIVE">비활성</SelectItem>
                  </SelectContent>
                </Select>
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
            <Button
              onClick={handleEditAdmin}
              disabled={
                !selectedAdmin?.name ||
                !selectedAdmin?.email ||
                !selectedAdmin?.role
              }
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>삭제 확인</DialogTitle>
            <DialogDescription>
              {selectedAdmin?.name}({selectedAdmin?.email}) 관리자 계정을
              삭제하시겠습니까? 이 작업은 취소할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteAdmin}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isResetPasswordDialogOpen}
        onOpenChange={setIsResetPasswordDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>비밀번호 변경</DialogTitle>
            <DialogDescription>
              {selectedAdmin?.name}({selectedAdmin?.email})의 비밀번호를
              변경합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="new-password" className="font-medium">
                새 비밀번호
              </label>
              <Input
                id="new-password"
                type="password"
                placeholder="새 비밀번호 입력"
                value={resetPasswordData.password}
                onChange={(e) =>
                  setResetPasswordData({
                    ...resetPasswordData,
                    password: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="confirm-new-password" className="font-medium">
                새 비밀번호 확인
              </label>
              <Input
                id="confirm-new-password"
                type="password"
                placeholder="새 비밀번호 확인"
                value={resetPasswordData.confirmPassword}
                onChange={(e) =>
                  setResetPasswordData({
                    ...resetPasswordData,
                    confirmPassword: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsResetPasswordDialogOpen(false)}
            >
              취소
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={
                !resetPasswordData.password ||
                !resetPasswordData.confirmPassword
              }
            >
              비밀번호 변경
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
