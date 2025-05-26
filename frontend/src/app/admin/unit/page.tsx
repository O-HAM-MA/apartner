"use client";

import { useState, useEffect } from "react";
import { get, post, put, del } from "@/utils/api";
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
import { Label } from "@/components/ui/label";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  RotateCcw,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// API 기본 URL (실제 환경에 맞게 수정 필요)
// const API_BASE_URL = "/api/v1/admin/units"; // 예시 URL (주석 처리 또는 삭제)

// 타입 정의
interface Apartment {
  id: number;
  name: string;
  address: string;
  zipcode: string;
}

interface Dong {
  id: number;
  buildingNumber: string;
  apartmentId: number;
}

interface Ho {
  id: number;
  unitNumber: string;
  buildingId: number;
}

// API 응답 타입 (일반적인 형태) -> PageResponse 로 대체
// interface ApiResponse<T> {
//   success: boolean;
//   message: string;
//   data: T;
//   // 페이지네이션 정보가 있다면 추가
//   totalElements?: number;
//   totalPages?: number;
//   currentPage?: number;
// }

// 페이지네이션 응답을 위한 인터페이스 (Spring Data JPA Page 객체 기준)
interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // 현재 페이지 (0-indexed)
  size: number; // 페이지 당 아이템 수
}

export default function UnitPage() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(
    null
  );
  const [dongs, setDongs] = useState<Dong[]>([]);
  const [selectedDong, setSelectedDong] = useState<Dong | null>(null);
  const [hos, setHos] = useState<Ho[]>([]);
  const [selectedHo, setSelectedHo] = useState<Ho | null>(null);

  const [loading, setLoading] = useState({
    apartments: false,
    dongs: false,
    hos: false,
    action: false,
  });

  const [searchTerm, setSearchTerm] = useState("");
  // TODO: 페이지네이션 상태 변수 추가 (각 섹션별로 필요할 수 있음)
  const [apartmentPage, setApartmentPage] = useState(1);
  const [dongPage, setDongPage] = useState(1);
  const [hoPage, setHoPage] = useState(1);
  const ITEMS_PER_PAGE = 10; // 페이지당 항목 수 (공통 또는 개별 설정 가능)

  // 각 목록별 전체 아이템 수 (API 응답으로부터 받아와야 함)
  const [totalApartments, setTotalApartments] = useState(0);
  const [totalDongs, setTotalDongs] = useState(0);
  const [totalHos, setTotalHos] = useState(0);

  // Dialog states
  const [isAddApartmentDialogOpen, setIsAddApartmentDialogOpen] =
    useState(false);
  const [isEditApartmentDialogOpen, setIsEditApartmentDialogOpen] =
    useState(false);
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(
    null
  );

  const [isAddDongDialogOpen, setIsAddDongDialogOpen] = useState(false);
  const [isEditDongDialogOpen, setIsEditDongDialogOpen] = useState(false);
  const [editingDong, setEditingDong] = useState<Dong | null>(null);

  const [isAddHoDialogOpen, setIsAddHoDialogOpen] = useState(false);
  const [isEditHoDialogOpen, setIsEditHoDialogOpen] = useState(false);
  const [editingHo, setEditingHo] = useState<Ho | null>(null);

  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] =
    useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: string;
    id: number;
  } | null>(null);

  // 임시 목업 데이터 (API 연동 전)
  useEffect(() => {
    // 초기 아파트 목록 로드 (첫 페이지)
    fetchApartments(apartmentPage, searchTerm);

    // 목업 데이터 설정 부분 (실제 API 연동 시에는 fetchApartments 내부에서 처리)
    // const mockApartments = [
    //   { id: "1", address: "경기도..", name: "반포자이..", zipCode: "10111" },
    //   { id: "2", address: "서울..", name: "현대..", zipCode: "10112" },
    //   { id: "3", address: "충북..", name: "삼성..", zipCode: "10113" },
    //   // 페이지네이션 테스트를 위한 더미 데이터
    //   { id: "4", address: "강원도..", name: "한라..", zipCode: "10114" },
    //   { id: "5", address: "전라..", name: "엘지..", zipCode: "10115" },
    //   { id: "6", address: "경상..", name: "대우..", zipCode: "10116" },
    //   { id: "7", address: "제주..", name: "푸르지오..", zipCode: "10117" },
    //   { id: "8", address: "인천..", name: "더샵..", zipCode: "10118" },
    //   { id: "9", address: "대전..", name: "아이파크..", zipCode: "10119" },
    //   { id: "10", address: "부산..", name: "롯데캐슬..", zipCode: "10120" },
    //   { id: "11", address: "울산..", name: "힐스테이트..", zipCode: "10121" },
    //   { id: "12", address: "세종..", name: "자이..", zipCode: "10122" },
    // ];
    // setApartments(mockApartments.slice(0, ITEMS_PER_PAGE)); // 초기 렌더링 시 첫페이지만
    // setTotalApartments(mockApartments.length);

    // selectedApartment 또는 selectedDong 변경 시 하위 목록 초기화 및 로드
    if (selectedApartment) {
      fetchDongs(selectedApartment.id, dongPage);
    } else {
      setDongs([]);
      setTotalDongs(0);
    }

    if (selectedDong) {
      fetchHos(selectedDong.id, hoPage);
    } else {
      setHos([]);
      setTotalHos(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedApartment, selectedDong]); // searchTerm 제거, apartmentPage는 fetchApartments 호출 시 관리

  // 페이지 변경 시 데이터 로드
  useEffect(() => {
    fetchApartments(apartmentPage, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apartmentPage]);

  useEffect(() => {
    if (selectedApartment) {
      fetchDongs(selectedApartment.id, dongPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dongPage]);

  useEffect(() => {
    if (selectedDong) {
      fetchHos(selectedDong.id, hoPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoPage]);

  // 데이터 fetching 함수들
  const fetchApartments = async (page = 1, search = "") => {
    setLoading((prev) => ({ ...prev, apartments: true }));
    try {
      // API 호출: GET /api/v1/admin/apartments
      // 백엔드 Repository는 name, address, zipcode 파라미터를 각각 받음.
      // 여기서는 searchTerm을 이름(name)과 주소(address) 검색에 활용하도록 구성
      // 페이지는 0-indexed 이므로 page - 1
      let url = `/api/v1/admin/apartments?page=${
        page - 1
      }&size=${ITEMS_PER_PAGE}`;
      if (search) {
        // 백엔드가 findByCriteriaWithPage에서 name, address, zipcode 중 하나만으로도 검색 가능하도록 되어있음
        // 여기서는 name 또는 address에 포함되는 경우를 검색하도록 가정
        // 실제 API 설계에 따라 쿼리 파라미터 조정 필요
        url += `&name=${encodeURIComponent(
          search
        )}&address=${encodeURIComponent(search)}`;
      }
      const response = await get<PageResponse<Apartment>>(url);
      setApartments(
        response.content.map((apt) => ({
          ...apt,
          zipcode: apt.zipcode || "",
        }))
      );
      setTotalApartments(response.totalElements);
      setApartmentPage(response.number + 1); // API는 0-indexed, UI는 1-indexed
      //   console.log(
      //     `Fetching apartments: page=${page}, search=${search}, limit=${ITEMS_PER_PAGE}`
      //   );
      //   const mockApartmentsAll = [
      //     { id: "1", address: "경기도..", name: "반포자이..", zipCode: "10111" },
      //     { id: "2", address: "서울..", name: "현대..", zipCode: "10112" },
      //     { id: "3", address: "충북..", name: "삼성..", zipCode: "10113" },
      //     { id: "4", address: "강원도..", name: "한라..", zipCode: "10114" },
      //     { id: "5", address: "전라..", name: "엘지..", zipCode: "10115" },
      //     { id: "6", address: "경상..", name: "대우..", zipCode: "10116" },
      //     { id: "7", address: "제주..", name: "푸르지오..", zipCode: "10117" },
      //     { id: "8", address: "인천..", name: "더샵..", zipCode: "10118" },
      //     { id: "9", address: "대전..", name: "아이파크..", zipCode: "10119" },
      //     { id: "10", address: "부산..", name: "롯데캐슬..", zipCode: "10120" },
      //     { id: "11", address: "울산..", name: "힐스테이트..", zipCode: "10121" },
      //     { id: "12", address: "세종..", name: "자이..", zipCode: "10122" },
      //   ];
      //   const filtered = mockApartmentsAll.filter(
      //     (apt) =>
      //       apt.address.toLowerCase().includes(search.toLowerCase()) ||
      //       apt.name.toLowerCase().includes(search.toLowerCase())
      //   );
      //   setApartments(
      //     filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
      //   );
      //   setTotalApartments(filtered.length);
    } catch (error) {
      console.error("아파트 목록을 불러오는데 실패했습니다:", error);
      toast({
        title: "오류",
        description: "아파트 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
      setApartments([]);
      setTotalApartments(0);
    } finally {
      setLoading((prev) => ({ ...prev, apartments: false }));
    }
  };

  const fetchDongs = async (apartmentId: number, page = 1) => {
    if (!apartmentId) {
      setDongs([]);
      setTotalDongs(0);
      return;
    }
    setLoading((prev) => ({ ...prev, dongs: true }));
    try {
      const url = `/api/v1/admin/apartments/${apartmentId}/buildings?page=${
        page - 1
      }&size=${ITEMS_PER_PAGE}`;
      const response = await get<PageResponse<Dong>>(url);
      setDongs(
        response.content.map((dong) => ({
          ...dong,
        }))
      );
      setTotalDongs(response.totalElements);
      setDongPage(response.number + 1);
    } catch (error) {
      console.error("동 목록을 불러오는데 실패했습니다:", error);
      toast({
        title: "오류",
        description: "동 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
      setDongs([]);
      setTotalDongs(0);
    } finally {
      setLoading((prev) => ({ ...prev, dongs: false }));
    }
  };

  const fetchHos = async (dongId: number, page = 1) => {
    if (!dongId) {
      setHos([]);
      setTotalHos(0);
      return;
    }
    setLoading((prev) => ({ ...prev, hos: true }));
    try {
      const url = `/api/v1/admin/apartments/buildings/${dongId}/units?page=${
        page - 1
      }&size=${ITEMS_PER_PAGE}`;
      const response = await get<PageResponse<Ho>>(url);
      setHos(
        response.content.map((ho) => ({
          ...ho,
        }))
      );
      setTotalHos(response.totalElements);
      setHoPage(response.number + 1);
    } catch (error) {
      console.error("호수 목록을 불러오는데 실패했습니다:", error);
      toast({
        title: "오류",
        description: "호수 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
      setHos([]);
      setTotalHos(0);
    } finally {
      setLoading((prev) => ({ ...prev, hos: false }));
    }
  };

  // CRUD 함수들
  const handleAddApartmentSubmit = async (data: {
    name: string;
    address: string;
    zipcode: string;
  }) => {
    if (!data.name || !data.address || !data.zipcode) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!/^\d+$/.test(data.zipcode)) {
      toast({
        title: "입력 오류",
        description: "우편번호는 숫자만 입력 가능합니다.",
        variant: "destructive",
      });
      return;
    }

    setLoading((prev) => ({ ...prev, action: true }));
    try {
      // API 호출: POST /api/v1/admin/apartments
      // 백엔드 Apartment 엔티티는 name, address, zipcode를 필드로 가짐
      const newAptData = {
        name: data.name,
        address: data.address,
        zipcode: data.zipcode,
      };
      await post<Apartment>("/api/v1/admin/apartments", newAptData);

      // 목록 새로고침 (현재 페이지, 현재 검색어 유지)
      fetchApartments(apartmentPage, searchTerm);
      setIsAddApartmentDialogOpen(false);
      toast({ title: "성공", description: "아파트가 추가되었습니다." });
      // console.log("Adding apartment:", data);
      // setApartments((prev) => [
      //   ...prev,
      //   { ...data, id: String(prev.length + 1 + Math.random()) } as Apartment,
      // ]);
    } catch (error) {
      console.error("아파트 추가 실패:", error);
      toast({
        title: "오류",
        description: "아파트 추가에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  const handleEditApartmentSubmit = async (
    id: number,
    data: { name: string; address: string; zipcode: string }
  ) => {
    if (!data.name || !data.address || !data.zipcode) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!/^\d+$/.test(data.zipcode)) {
      toast({
        title: "입력 오류",
        description: "우편번호는 숫자만 입력 가능합니다.",
        variant: "destructive",
      });
      return;
    }

    setLoading((prev) => ({ ...prev, action: true }));
    try {
      // API 호출: PUT /api/v1/admin/apartments/{id}
      const updatedAptData = {
        name: data.name,
        address: data.address,
        zipcode: data.zipcode,
      };
      await put<Apartment>(`/api/v1/admin/apartments/${id}`, updatedAptData);

      // 목록 새로고침
      fetchApartments(apartmentPage, searchTerm);
      setIsEditApartmentDialogOpen(false);
      setEditingApartment(null);
      toast({
        title: "성공",
        description: "아파트 정보가 수정되었습니다.",
      });
      // console.log("Editing apartment:", id, data);
      // setApartments((prev) =>
      //   prev.map((apt) => (apt.id === id ? { ...apt, ...data } : apt))
      // );
    } catch (error) {
      console.error("아파트 수정 실패:", error);
      toast({
        title: "오류",
        description: "아파트 정보 수정에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  const handleAddDongSubmit = async (data: { name: string }) => {
    if (!selectedApartment) return;
    if (!data.name) {
      toast({
        title: "입력 오류",
        description: "동 이름을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    setLoading((prev) => ({ ...prev, action: true }));
    try {
      const newDongData = {
        buildingNumber: data.name,
        apartmentId: selectedApartment.id,
      };
      await post<Dong>(`/api/v1/admin/apartments/buildings`, newDongData);
      toast({ title: "성공", description: "동이 추가되었습니다." });
      fetchDongs(selectedApartment.id, dongPage);
      setIsAddDongDialogOpen(false);
    } catch (error) {
      console.error("동 추가 실패:", error);
      toast({
        title: "오류",
        description: "동 추가에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  const handleEditDongSubmit = async (id: number, data: { name: string }) => {
    if (!selectedApartment) return;
    if (!data.name) {
      toast({
        title: "입력 오류",
        description: "동 이름을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    setLoading((prev) => ({ ...prev, action: true }));
    try {
      const updatedDongData = {
        buildingNumber: data.name,
        apartmentId: selectedApartment.id,
      };
      await put<Dong>(
        `/api/v1/admin/apartments/buildings/${id}`,
        updatedDongData
      );
      toast({ title: "성공", description: "동 정보가 수정되었습니다." });
      fetchDongs(selectedApartment.id, dongPage);
      setIsEditDongDialogOpen(false);
      setEditingDong(null);
    } catch (error: any) {
      console.error("동 수정 실패:", error);
      let description = "동 정보 수정에 실패했습니다.";
      if (error.message && error.message.includes("409")) {
        description = "이미 사용 중인 동 이름이거나 입력 값을 확인해주세요.";
      }
      toast({
        title: "오류",
        description,
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  const handleAddHoSubmit = async (data: { name: string }) => {
    if (!selectedDong) return;
    if (!data.name) {
      toast({
        title: "입력 오류",
        description: "호수 이름을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    setLoading((prev) => ({ ...prev, action: true }));
    try {
      const newHoData = {
        unitNumber: data.name,
        buildingId: selectedDong.id,
      };
      await post<Ho>(`/api/v1/admin/apartments/units`, newHoData);
      toast({ title: "성공", description: "호수가 추가되었습니다." });
      fetchHos(selectedDong.id, hoPage);
      setIsAddHoDialogOpen(false);
    } catch (error) {
      console.error("호수 추가 실패:", error);
      toast({
        title: "오류",
        description: "호수 추가에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  const handleEditHoSubmit = async (id: number, data: { name: string }) => {
    if (!selectedDong) return;
    if (!data.name) {
      toast({
        title: "입력 오류",
        description: "호수 이름을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    setLoading((prev) => ({ ...prev, action: true }));
    try {
      const updatedHoData = {
        unitNumber: data.name,
        buildingId: selectedDong.id,
      };
      await put<Ho>(`/api/v1/admin/apartments/units/${id}`, updatedHoData);
      toast({
        title: "성공",
        description: "호수 정보가 수정되었습니다.",
      });
      fetchHos(selectedDong.id, hoPage);
      setIsEditHoDialogOpen(false);
      setEditingHo(null);
    } catch (error: any) {
      console.error("호수 수정 실패:", error);
      let description = "호수 정보 수정에 실패했습니다.";
      if (error.message && error.message.includes("409")) {
        description = "이미 사용 중인 호수 이름이거나 입력 값을 확인해주세요.";
      }
      toast({
        title: "오류",
        description,
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setLoading((prev) => ({ ...prev, action: true }));
    try {
      let url = "";
      let itemTypeDisplay = "";

      if (itemToDelete.type === "apartments") {
        url = `/api/v1/admin/apartments/${itemToDelete.id}`;
        itemTypeDisplay = "아파트";
      } else if (itemToDelete.type === "dongs") {
        url = `/api/v1/admin/apartments/buildings/${itemToDelete.id}`;
        itemTypeDisplay = "동";
      } else if (itemToDelete.type === "hos") {
        url = `/api/v1/admin/apartments/units/${itemToDelete.id}`;
        itemTypeDisplay = "호수";
      }

      if (url) {
        await del(url);
        toast({
          title: "성공",
          description: `${itemTypeDisplay}가 삭제되었습니다.`,
        });

        if (itemToDelete.type === "apartments") {
          fetchApartments(1, searchTerm); // 삭제 후 첫 페이지로 이동 및 검색어 초기화 또는 유지
          if (selectedApartment?.id === itemToDelete.id) {
            setSelectedApartment(null);
            setDongs([]);
            setSelectedDong(null);
            setHos([]);
            setSelectedHo(null);
          }
        } else if (itemToDelete.type === "dongs") {
          if (selectedApartment) fetchDongs(selectedApartment.id, 1); // 삭제 후 첫 페이지로
          if (selectedDong?.id === itemToDelete.id) {
            setSelectedDong(null);
            setHos([]);
            setSelectedHo(null);
          }
        } else if (itemToDelete.type === "hos") {
          if (selectedDong) fetchHos(selectedDong.id, 1); // 삭제 후 첫 페이지로
          if (selectedHo?.id === itemToDelete.id) {
            setSelectedHo(null);
          }
        }
      }
      setIsDeleteConfirmDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error(`${itemToDelete.type} 삭제 실패:`, error);
      toast({
        title: "오류",
        description: `${itemToDelete.type} 삭제에 실패했습니다.`,
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  // TODO: 페이지네이션 관련 함수들
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    if (newSearchTerm === "") {
      fetchApartments(1, ""); // 검색어가 비워지면 전체 목록 로드
    }
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApartmentPage(1); // 검색 시 첫 페이지로 리셋
    fetchApartments(1, searchTerm);
  };

  // 페이지네이션 핸들러
  const renderPagination = (
    currentPage: number,
    totalPages: number,
    onPageChange: (page: number) => void,
    isLoading: boolean
  ) => {
    if (isLoading || totalPages <= 1) return null;

    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-label="이전 페이지"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage > 1) onPageChange(currentPage - 1);
              }}
              className={`${
                currentPage === 1 ? "pointer-events-none opacity-50" : ""
              } flex items-center`}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">이전</span>
            </PaginationPrevious>
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(page);
                }}
                isActive={currentPage === page}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              href="#"
              aria-label="다음 페이지"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage < totalPages) onPageChange(currentPage + 1);
              }}
              className={`${
                currentPage === totalPages
                  ? "pointer-events-none opacity-50"
                  : ""
              } flex items-center`}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">다음</span>
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  // 호수 상세 조회 함수 추가
  const fetchHoDetail = async (unitId: number) => {
    try {
      const url = `/api/v1/admin/apartments/units/${unitId}`;
      const response = await get<Ho>(url);
      return response;
    } catch (error) {
      toast({
        title: "오류",
        description: "호수 상세 정보를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
      return null;
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">아파트 동·호수 설정</h1>
      <p className="text-sm text-muted-foreground">
        아파트, 동, 호수를 설정하고 관리합니다.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* 아파트 섹션 */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>아파트</CardTitle>
            <Dialog
              open={isAddApartmentDialogOpen}
              onOpenChange={setIsAddApartmentDialogOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" /> 아파트 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>새 아파트 추가</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="add-apt-zipcode" className="text-right">
                      우편번호
                    </Label>
                    <Input
                      id="add-apt-zipcode"
                      placeholder="예: 10111"
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="add-apt-address" className="text-right">
                      주소
                    </Label>
                    <Input
                      id="add-apt-address"
                      placeholder="예: 서울특별시 서초구 신반포로 111"
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="add-apt-name" className="text-right">
                      아파트명
                    </Label>
                    <Input
                      id="add-apt-name"
                      placeholder="예: 래미안 원베일리"
                      className="col-span-3"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddApartmentDialogOpen(false)}
                  >
                    취소
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      const zipcodeInput = document.getElementById(
                        "add-apt-zipcode"
                      ) as HTMLInputElement;
                      const addressInput = document.getElementById(
                        "add-apt-address"
                      ) as HTMLInputElement;
                      const nameInput = document.getElementById(
                        "add-apt-name"
                      ) as HTMLInputElement;
                      if (zipcodeInput && addressInput && nameInput) {
                        handleAddApartmentSubmit({
                          zipcode: zipcodeInput.value,
                          address: addressInput.value,
                          name: nameInput.value,
                        });
                      }
                    }}
                    disabled={loading.action}
                  >
                    {loading.action && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    추가
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSearchSubmit}
              className="mb-4 flex gap-2 items-center"
            >
              {searchTerm && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setSearchTerm("");
                    fetchApartments(1, "");
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
              <Input
                placeholder="주소 또는 아파트명 검색"
                value={searchTerm}
                onChange={handleSearchChange}
                className="flex-1"
              />
              <Button type="submit" size="icon" variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            {loading.apartments ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : apartments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">주소</TableHead>
                    <TableHead className="text-center">아파트</TableHead>
                    <TableHead className="text-center">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apartments.map((apt, index) => (
                    <TableRow
                      key={apt.id}
                      onClick={() => {
                        if (selectedApartment?.id === apt.id) {
                          // 같은 아파트를 다시 클릭하면 선택 해제
                          setSelectedApartment(null);
                          setDongs([]);
                          setTotalDongs(0); // 추가
                          setDongPage(1); // 추가
                          setSelectedDong(null);
                          setHos([]);
                          setTotalHos(0); // 추가
                          setHoPage(1); // 추가
                          setSelectedHo(null);
                        } else {
                          // 다른 아파트를 클릭하면
                          const newSelectedApartment = apt;
                          setSelectedApartment(newSelectedApartment);
                          // 동 목록 초기화 및 새 아파트의 동 목록 로드
                          setDongs([]);
                          setTotalDongs(0);
                          setDongPage(1);
                          setSelectedDong(null);
                          setHos([]);
                          setTotalHos(0);
                          setHoPage(1);
                          setSelectedHo(null);
                          fetchDongs(newSelectedApartment.id, 1);
                        }
                      }}
                      className={`${
                        selectedApartment?.id === apt.id
                          ? "bg-muted"
                          : "hover:bg-muted/50 cursor-pointer"
                      } transition-colors text-center`}
                    >
                      <TableCell className="text-center">
                        ({apt.zipcode}) {apt.address} {/* zipCode -> zipcode */}
                      </TableCell>
                      <TableCell className="text-center">{apt.name}</TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingApartment(apt);
                                setIsEditApartmentDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" /> 수정
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setItemToDelete({
                                  type: "apartments",
                                  id: apt.id,
                                });
                                setIsDeleteConfirmDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4 text-destructive" />{" "}
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {searchTerm
                  ? "검색 결과가 없습니다."
                  : "등록된 아파트가 없습니다."}
              </p>
            )}
            {renderPagination(
              apartmentPage,
              Math.ceil(totalApartments / ITEMS_PER_PAGE),
              (page) => setApartmentPage(page),
              loading.apartments
            )}
          </CardContent>
        </Card>

        {/* 동 섹션 */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>동</CardTitle>
            <Dialog
              open={isAddDongDialogOpen}
              onOpenChange={setIsAddDongDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  disabled={!selectedApartment || loading.action}
                >
                  <Plus className="mr-2 h-4 w-4" /> 동 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    새 동 추가 ({selectedApartment?.name})
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="add-dong-name" className="text-right">
                      동 이름
                    </Label>
                    <Input
                      id="add-dong-name"
                      placeholder="예: 101동"
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDongDialogOpen(false)}
                  >
                    취소
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      const nameInput = document.getElementById(
                        "add-dong-name"
                      ) as HTMLInputElement;
                      if (nameInput) {
                        handleAddDongSubmit({ name: nameInput.value });
                      }
                    }}
                    disabled={loading.action || !selectedApartment}
                  >
                    {loading.action && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}{" "}
                    추가
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading.dongs ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : selectedApartment ? (
              dongs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">동 이름</TableHead>
                      <TableHead className="text-center">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dongs.map((dong) => (
                      <TableRow
                        key={dong.id}
                        onClick={() => {
                          if (selectedDong?.id === dong.id) {
                            // 같은 동을 다시 클릭하면 선택 해제
                            setSelectedDong(null);
                            setHos([]);
                            setTotalHos(0); // 추가
                            setHoPage(1); // 추가
                            setSelectedHo(null);
                          } else {
                            // 다른 동을 클릭하면
                            const newSelectedDong = dong;
                            setSelectedDong(newSelectedDong);
                            // 호수 목록 초기화 및 새 동의 호수 목록 로드
                            setHos([]);
                            setTotalHos(0);
                            setHoPage(1);
                            setSelectedHo(null);
                            fetchHos(newSelectedDong.id, 1);
                          }
                        }}
                        className={`${
                          selectedDong?.id === dong.id
                            ? "bg-muted"
                            : "hover:bg-muted/50 cursor-pointer"
                        } transition-colors text-center`}
                      >
                        <TableCell className="text-center">
                          {dong.buildingNumber /* name -> buildingNumber */}
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingDong(dong);
                                  setIsEditDongDialogOpen(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" /> 수정
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setItemToDelete({
                                    type: "dongs",
                                    id: dong.id,
                                  });
                                  setIsDeleteConfirmDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4 text-destructive" />{" "}
                                삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  등록된 동이 없습니다. '동 추가' 버튼을 눌러 추가해주세요.
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                먼저 아파트를 선택해주세요.
              </p>
            )}
            {renderPagination(
              dongPage,
              Math.ceil(totalDongs / ITEMS_PER_PAGE),
              (page) => setDongPage(page),
              loading.dongs
            )}
          </CardContent>
        </Card>

        {/* 호수 섹션 */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>호수</CardTitle>
            <Dialog
              open={isAddHoDialogOpen}
              onOpenChange={setIsAddHoDialogOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm" disabled={!selectedDong || loading.action}>
                  <Plus className="mr-2 h-4 w-4" /> 호수 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    새 호수 추가 (
                    {selectedDong?.buildingNumber /* name -> buildingNumber */})
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="add-ho-name" className="text-right">
                      호수 이름
                    </Label>
                    <Input
                      id="add-ho-name"
                      placeholder="예: 101호, B01호"
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddHoDialogOpen(false)}
                  >
                    취소
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      const nameInput = document.getElementById(
                        "add-ho-name"
                      ) as HTMLInputElement;
                      if (nameInput) {
                        handleAddHoSubmit({ name: nameInput.value });
                      }
                    }}
                    disabled={loading.action || !selectedDong}
                  >
                    {loading.action && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}{" "}
                    추가
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loading.hos ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : selectedDong ? (
              hos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">호수 이름</TableHead>
                      <TableHead className="text-center">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hos.map((ho, index) => (
                      <TableRow
                        key={ho.id}
                        onClick={async () => {
                          const detail = await fetchHoDetail(ho.id);
                          if (detail) setSelectedHo(detail);
                        }}
                        className={`${
                          selectedHo?.id === ho.id
                            ? "bg-muted"
                            : "hover:bg-muted/50 cursor-pointer"
                        } transition-colors text-center`}
                      >
                        <TableCell className="text-center">
                          {ho.unitNumber /* name -> unitNumber */}
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingHo(ho);
                                  setIsEditHoDialogOpen(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" /> 수정
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setItemToDelete({ type: "hos", id: ho.id });
                                  setIsDeleteConfirmDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4 text-destructive" />{" "}
                                삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  등록된 호수가 없습니다. '호수 추가' 버튼을 눌러 추가해주세요.
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                먼저 동을 선택해주세요.
              </p>
            )}
            {renderPagination(
              hoPage,
              Math.ceil(totalHos / ITEMS_PER_PAGE),
              (page) => setHoPage(page),
              loading.hos
            )}
          </CardContent>
        </Card>
      </div>

      {/* TODO: 아파트 추가/수정 다이얼로그 */}
      {/* TODO: 동 추가/수정 다이얼로그 */}
      {/* TODO: 호수 추가/수정 다이얼로그 */}
      {/* TODO: 삭제 확인 다이얼로그 */}

      {/* 아파트 수정 다이얼로그 */}
      <Dialog
        open={isEditApartmentDialogOpen}
        onOpenChange={(isOpen) => {
          setIsEditApartmentDialogOpen(isOpen);
          if (!isOpen) setEditingApartment(null); // 다이얼로그 닫힐 때 수정 상태 초기화
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>아파트 정보 수정</DialogTitle>
          </DialogHeader>
          {editingApartment && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-apt-zipcode" className="text-right">
                  우편번호
                </Label>
                <Input
                  id="edit-apt-zipcode"
                  defaultValue={editingApartment.zipcode}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-apt-address" className="text-right">
                  주소
                </Label>
                <Input
                  id="edit-apt-address"
                  defaultValue={editingApartment.address}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-apt-name" className="text-right">
                  아파트명
                </Label>
                <Input
                  id="edit-apt-name"
                  defaultValue={editingApartment.name}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditApartmentDialogOpen(false)}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={() => {
                const zipcodeInput = document.getElementById(
                  "edit-apt-zipcode"
                ) as HTMLInputElement;
                const addressInput = document.getElementById(
                  "edit-apt-address"
                ) as HTMLInputElement;
                const nameInput = document.getElementById(
                  "edit-apt-name"
                ) as HTMLInputElement;
                if (
                  editingApartment &&
                  zipcodeInput &&
                  addressInput &&
                  nameInput
                ) {
                  handleEditApartmentSubmit(editingApartment.id, {
                    zipcode: zipcodeInput.value,
                    address: addressInput.value,
                    name: nameInput.value,
                  });
                }
              }}
              disabled={loading.action}
            >
              {loading.action && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 동 수정 다이얼로그 */}
      <Dialog
        open={isEditDongDialogOpen}
        onOpenChange={(isOpen) => {
          setIsEditDongDialogOpen(isOpen);
          if (!isOpen) setEditingDong(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              동 정보 수정 (
              {editingDong?.buildingNumber /* name -> buildingNumber */})
            </DialogTitle>
          </DialogHeader>
          {editingDong && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-dong-name" className="text-right">
                  동 이름
                </Label>
                <Input
                  id="edit-dong-name"
                  defaultValue={
                    editingDong.buildingNumber /* name -> buildingNumber */
                  }
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditDongDialogOpen(false)}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={() => {
                const nameInput = document.getElementById(
                  "edit-dong-name"
                ) as HTMLInputElement;
                if (editingDong && nameInput) {
                  handleEditDongSubmit(editingDong.id, {
                    name: nameInput.value,
                  });
                }
              }}
              disabled={loading.action}
            >
              {loading.action && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}{" "}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 호수 수정 다이얼로그 */}
      <Dialog
        open={isEditHoDialogOpen}
        onOpenChange={(isOpen) => {
          setIsEditHoDialogOpen(isOpen);
          if (!isOpen) setEditingHo(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              호수 정보 수정 ({editingHo?.unitNumber /* name -> unitNumber */})
            </DialogTitle>
          </DialogHeader>
          {editingHo && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-ho-name" className="text-right">
                  호수 이름
                </Label>
                <Input
                  id="edit-ho-name"
                  defaultValue={editingHo.unitNumber /* name -> unitNumber */}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditHoDialogOpen(false)}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={() => {
                const nameInput = document.getElementById(
                  "edit-ho-name"
                ) as HTMLInputElement;
                if (editingHo && nameInput) {
                  handleEditHoSubmit(editingHo.id, { name: nameInput.value });
                }
              }}
              disabled={loading.action}
            >
              {loading.action && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}{" "}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={isDeleteConfirmDialogOpen}
        onOpenChange={setIsDeleteConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 선택한 항목이 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading.action}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading.action && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}{" "}
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 호수 상세 모달 트리거 */}
      <Dialog
        open={!!selectedHo}
        onOpenChange={(open) => {
          if (!open) setSelectedHo(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>호수 상세 정보</DialogTitle>
          </DialogHeader>
          {selectedHo && (
            <div className="space-y-2">
              <div className="text-lg font-medium">
                ({selectedApartment?.zipcode}) {selectedApartment?.address}{" "}
                {/* zipCode -> zipcode */}
                {selectedApartment?.name}{" "}
                {selectedDong?.buildingNumber /* name -> buildingNumber */}{" "}
                {selectedHo.unitNumber /* name -> unitNumber */}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" onClick={() => setSelectedHo(null)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
