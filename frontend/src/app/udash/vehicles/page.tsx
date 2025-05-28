"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Car,
  Moon,
  Plus,
  X,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "@/lib/backend/client";
import { components } from "@/lib/backend/apiV1/schema";
import { useGlobalLoginMember } from "@/auth/loginMember"; // useGlobalLoginMember 훅 import
import { Switch } from "@/components/ui/switch"; // shadcn/ui의 Switch 컴포넌트
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type VehicleRegistrationInfoDto =
  components["schemas"]["VehicleRegistrationInfoDto"];

type VehicleUpdateRequestDto = components["schemas"]["VehicleUpdateRequestDto"];
type ResidentVehicleRequestDto =
  components["schemas"]["ResidentVehicleRequestDto"];
// Add this after the imports and before the component

type EntryRecordStatusUpdateRequestDto =
  components["schemas"]["EntryRecordStatusUpdateRequestDto"];

// ParkingStatusDto 타입 추가 (이미 schema.d.ts에 정의되어 있음)
type ParkingStatusDto = components["schemas"]["ParkingStatusDto"];

const globalStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
  }
`;

// Badge 컴포넌트
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

// Dialog 컴포넌트
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

// Select 컴포넌트
const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// currentVehicle 타입 정의 추가
type EditingVehicle = {
  id: number;
  vehicleNum: string;
  type: string;
};

type EditingEntryRecordStatus = {
  id: number;
  status: "AGREE" | "INAGREE" | "PENDING" | "INVITER_AGREE";
};

// 페이징 관련 타입 추가
type PagingState = {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
};

// 메인 페이지 컴포넌트
export default function VehicleManagement() {
  const { isLogin } = useGlobalLoginMember();
  const queryClient = useQueryClient();

  // 상태 관리 수정
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    vehicleNum: "",
    type: "",
  });
  const [currentVehicle, setCurrentVehicle] = useState<EditingVehicle | null>(
    null
  );
  const [currentEntryRecord, setCurrentEntryRecord] =
    useState<EditingEntryRecordStatus | null>(null);

  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    null
  ); // 입차할 차량 ID 상태 추가

  // 페이징 상태 추가
  const [residentPaging, setResidentPaging] = useState<PagingState>({
    currentPage: 1,
    itemsPerPage: 5,
    totalPages: 1,
  });

  const [visitorPaging, setVisitorPaging] = useState<PagingState>({
    currentPage: 1,
    itemsPerPage: 5,
    totalPages: 1,
  });

  const {
    data: vehicles, // 여기서 data를 vehicles로 구조분해할당
    isLoading,
    error,
  } = useQuery<VehicleRegistrationInfoDto[]>({
    queryKey: ["vehicles", "mine"],
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/vehicles/mine");
      if (error) throw error;
      return data;
    },
    enabled: isLogin,
  });

  // 주차장 현황 조회 쿼리 추가

  // 차량 등록 mutation 수정
  const addVehicleMutation = useMutation({
    mutationFn: (newVehicle: ResidentVehicleRequestDto) => {
      console.log("등록 요청 데이터:", newVehicle);
      return client.POST("/api/v1/vehicles/residents", {
        body: newVehicle,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles", "mine"] });
      setIsAddDialogOpen(false);
      setNewVehicle({ vehicleNum: "", type: "" });
      alert("차량이 등록되었습니다.");
    },
    onError: (error) => {
      console.error("등록 실패:", error);
      alert("차량 등록에 실패했습니다.");
    },
  });

  // 차량 수정 mutation 수정
  const updateVehicleMutation = useMutation({
    mutationFn: (data: EditingVehicle) => {
      return client.PATCH(`/api/v1/vehicles/update/${data.id}`, {
        body: {
          vehicleNum: data.vehicleNum,
          type: data.type,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles", "mine"] });
      setIsEditDialogOpen(false);
      setCurrentVehicle(null);
      alert("차량 정보가 수정되었습니다.");
      window.location.reload();
    },
    onError: (error) => {
      console.error("수정 실패:", error);
      alert("차량 정보 수정에 실패했습니다.");
    },
  });

  // 승인 상태 표시를 위한 컴포넌트
  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusInfo = (status: string) => {
      switch (status) {
        case "INVITER_AGREE":
          return {
            label: "내가 승인함",
            className: "bg-blue-100 text-blue-800",
          };
        case "AGREE":
          return {
            label: "최종 승인됨",
            className: "bg-green-100 text-green-800",
          };
        case "INAGREE":
          return { label: "미승인", className: "bg-gray-100 text-gray-800" };
        default:
          return {
            label: "대기중",
            className: "bg-yellow-100 text-yellow-800",
          };
      }
    };

    const statusInfo = getStatusInfo(status);
    return (
      <Badge
        className={`${statusInfo.className} hover:${statusInfo.className}`}
      >
        {statusInfo.label}
      </Badge>
    );
  };

  // 상태 변경 mutation 수정
  const updateVehicleStatusMutation = useMutation({
    mutationFn: ({
      entryRecordId,
      status,
    }: {
      entryRecordId: number;
      status: "AGREE" | "INAGREE" | "PENDING" | "INVITER_AGREE";
    }) => {
      return client.PATCH(`/api/v1/entry-records/${entryRecordId}/status`, {
        body: { status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles", "mine"] });
    },
    onError: (error) => {
      console.error("승인 상태 변경 실패:", error);
      alert("승인 상태 변경에 실패했습니다.");
    },
  });

  // 입차 mutation 수정
  const enterVehicleMutation = useMutation({
    mutationFn: (vehicleId: number) => {
      return client.POST("/api/v1/entry-records/enter", {
        body: { vehicleId },
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles", "mine"] });
      alert("입차가 완료되었습니다.");
      window.location.reload();
    },
    onError: (error) => {
      console.error("입차 실패:", error);
      alert("입차 처리에 실패했습니다.");
    },
  });

  // 출차 mutation 추가
  const exitVehicleMutation = useMutation({
    mutationFn: (vehicleId: number) => {
      return client.POST("/api/v1/entry-records/exit", {
        body: { vehicleId },
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles", "mine"] });
      alert("출차가 완료되었습니다.");
      window.location.reload();
    },
    onError: (error) => {
      console.error("출차 실패:", error);
      alert("출차 처리에 실패했습니다.");
    },
  });

  // 입차 핸들러 추가
  const handleEntry = () => {
    if (!selectedVehicleId) {
      alert("입차할 차량을 선택해주세요.");
      return;
    }
    enterVehicleMutation.mutate(selectedVehicleId);
  };

  // 차량 선택 핸들러
  const handleVehicleSelect = (vehicleId: number) => {
    setSelectedVehicleId(vehicleId === selectedVehicleId ? null : vehicleId);
  };

  // 상태 변경 핸들러도 수정
  const handleStatusChange = (
    entryRecordId: number | undefined,
    status: EntryRecordStatusUpdateRequestDto["status"]
  ) => {
    if (!entryRecordId) {
      console.error("출입 기록 ID 누락");
      return;
    }

    console.log("상태 변경 시도:", { entryRecordId, status });
    updateVehicleStatusMutation.mutate({ entryRecordId, status });
  };

  // 차량 삭제 mutation
  const deleteVehicleMutation = useMutation({
    mutationFn: (vehicleId: number) =>
      client.DELETE(`/api/v1/vehicles/delete/${vehicleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles", "mine"] });
    },
  });

  // mutation 추가
  const requestParkingMutation = useMutation({
    mutationFn: () => {
      return client.POST(`/api/v1/entry-records/request/{vehicleId}`, {
        body: {}, // 빈 객체를 보내도 됩니다. 백엔드에서 자동으로 처리
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles", "mine"] });
      alert("주차 재신청이 완료되었습니다.");
      window.location.reload();
    },
    onError: (error) => {
      console.error("주차 재신청 실패:", error);
      if (error.message.includes("현재 주차 중")) {
        alert("현재 주차 중이므로 새 출입 신청이 불가합니다.");
      } else {
        alert("주차 재신청에 실패했습니다.");
      }
    },
  });

  const handleAddVehicle = () => {
    if (!newVehicle.vehicleNum || !newVehicle.type) {
      alert("차량 번호와 종류를 모두 입력해주세요.");
      return;
    }

    const vehicleData = {
      vehicleNum: newVehicle.vehicleNum.trim(),
      type: newVehicle.type.trim(),
    };

    console.log("등록 시도:", vehicleData);
    addVehicleMutation.mutate(vehicleData);
  };

  const handleDeleteVehicle = (id: number) => {
    if (window.confirm("차량을 삭제하시겠습니까?")) {
      deleteVehicleMutation.mutate(id);
    }
  };

  // 수정 핸들러 함수 수정
  const handleEditVehicle = () => {
    if (!currentVehicle) return;

    updateVehicleMutation.mutate(currentVehicle);
  };

  // handleEditClick 함수 추가
  const handleEditClick = (vehicle: VehicleRegistrationInfoDto) => {
    if (!vehicle.id) return;

    console.log("수정할 차량 정보:", vehicle);

    setCurrentVehicle({
      id: vehicle.id,
      vehicleNum: vehicle.vehicleNum || "",
      type: vehicle.type || "",
    });

    setIsEditDialogOpen(true);
  };

  // 페이징된 데이터를 얻기 위한 함수 수정
  const getPaginatedData = (
    data: VehicleRegistrationInfoDto[],
    paging: PagingState
  ) => {
    // 전체 데이터를 먼저 역순으로 정렬 (최신순)
    const sortedData = [...data].reverse();
    const start = (paging.currentPage - 1) * paging.itemsPerPage;
    const end = start + paging.itemsPerPage;
    return sortedData.slice(start, end);
  };

  // 총 페이지 수 계산 함수
  const calculateTotalPages = (totalItems: number, itemsPerPage: number) => {
    return Math.ceil(totalItems / itemsPerPage);
  };

  // Add this useEffect to inject the styles
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = globalStyles;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (!isLogin) {
    return <div>로그인이 필요합니다.</div>;
  }

  if (isLoading) return <div>차량 정보를 불러오는 중...</div>;
  if (error) return <div>에러가 발생했습니다.</div>;

  // vehicles 테이블 내부에 상태 변경 컴포넌트 추가
  const StatusSelector = ({
    entryRecordId,
    currentStatus,
  }: {
    entryRecordId: number;
    currentStatus: "AGREE" | "INAGREE" | "PENDING" | "INVITER_AGREE";
  }) => {
    const queryClient = useQueryClient();

    const updateStatusMutation = useMutation({
      mutationFn: async ({
        entryRecordId,
        status,
      }: {
        entryRecordId: number;
        status: "AGREE" | "INAGREE" | "PENDING" | "INVITER_AGREE";
      }) => {
        const { data, error } = await client.PATCH(
          `/api/v1/entry-records/${entryRecordId}/status`,
          {
            body: { status },
          }
        );
        if (error) throw error;
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["vehicles"] });
        alert("차량 승인 상태가 변경되었습니다.");
      },
      onError: (error) => {
        console.error("상태 변경 실패:", error);
        alert("상태 변경에 실패했습니다.");
      },
    });

    return (
      <Select
        defaultValue={currentStatus}
        onValueChange={(
          value: "AGREE" | "INAGREE" | "PENDING" | "INVITER_AGREE"
        ) => {
          updateStatusMutation.mutate({ entryRecordId, status: value });
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="승인 상태 선택" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="INVITER_AGREE">입주민 승인</SelectItem>
          <SelectItem value="INAGREE">미승인</SelectItem>
        </SelectContent>
      </Select>
    );
  };

  return (
    <div
      className="min-h-screen bg-white m-0 p-0"
      style={{ margin: 0, padding: 0 }}
    >
      {/* 헤더 */}
      <Header />

      {/* 사용자 정보 배너 */}
      <div className="bg-[#FFE6EE] py-4 w-full m-0">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center">
              <span className="text-gray-500 text-xl">백</span>
            </div>
            <div>
              <h2 className="font-bold text-lg text-[#FF4081]">
                백선영 입주민
              </h2>
              <p className="text-sm text-gray-600">삼성아파트 101동 102호</p>
            </div>
          </div>
          <Link href="/dashboard">
            <Button className="bg-black text-white hover:bg-gray-800">
              대시보드 가기
            </Button>
          </Link>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* 주차장 현황 섹션과 차량 관리 제목 부분 수정 */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold">차량 관리</h1>
                <p className="text-gray-500 text-sm mt-1">
                  내 차량 정보를 관리할 수 있습니다.
                </p>
              </div>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#FF4081] hover:bg-[#E91E63]">
                    <Plus size={18} className="mr-1" /> 차량 등록하기
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>차량 등록</DialogTitle>
                    <DialogDescription>
                      등록할 차량 정보를 입력해주세요.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="vehicle-number">차량 번호</Label>
                      <Input
                        id="vehicle-number"
                        value={newVehicle.vehicleNum}
                        onChange={(e) =>
                          setNewVehicle({
                            ...newVehicle,
                            vehicleNum: e.target.value,
                          })
                        }
                        placeholder="예: 12가 3456"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="vehicle-type">차량 종류</Label>
                      <Input
                        id="vehicle-type"
                        value={newVehicle.type}
                        onChange={(e) =>
                          setNewVehicle({
                            ...newVehicle,
                            type: e.target.value,
                          })
                        }
                        placeholder="예: 승용차"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      취소
                    </Button>
                    <Button
                      className="bg-[#FF4081] hover:bg-[#E91E63]"
                      onClick={handleAddVehicle}
                      disabled={addVehicleMutation.isPending}
                    >
                      {addVehicleMutation.isPending ? "등록 중..." : "등록"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* 수정 다이얼로그 */}
              <Dialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>차량 정보 수정</DialogTitle>
                    <DialogDescription>
                      수정할 차량 정보를 입력해주세요.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-vehicle-number">차량 번호</Label>
                      <Input
                        id="edit-vehicle-number"
                        value={currentVehicle?.vehicleNum || ""}
                        onChange={(e) =>
                          setCurrentVehicle((prev) =>
                            prev
                              ? { ...prev, vehicleNum: e.target.value }
                              : null
                          )
                        }
                        placeholder="예: 12가 3456"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-vehicle-type">차량 종류</Label>
                      <Input
                        id="edit-vehicle-type"
                        value={currentVehicle?.type || ""}
                        onChange={(e) =>
                          setCurrentVehicle((prev) =>
                            prev ? { ...prev, type: e.target.value } : null
                          )
                        }
                        placeholder="예: 승용차"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      취소
                    </Button>
                    <Button
                      className="bg-[#FF4081] hover:bg-[#E91E63]"
                      onClick={handleEditVehicle}
                      disabled={updateVehicleMutation.isPending}
                    >
                      {updateVehicleMutation.isPending ? "수정 중..." : "수정"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* 차량 목록 */}
          <div className="space-y-8">
            {/* 거주자 차량 목록 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">거주자 차량</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 py-3 text-sm font-medium text-gray-500">
                        차량 번호
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500">
                        차량 종류
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500">
                        상태
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500">
                        관리
                      </th>
                    </tr>
                  </thead>
                  {/* 거주자 차량 테이블 */}
                  <tbody className="divide-y divide-gray-200">
                    {getPaginatedData(
                      vehicles?.filter((v) => v.registerType === "거주자") ||
                        [],
                      residentPaging
                    ).map((vehicle) => (
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        {/* 차량 번호 열 */}
                        <td
                          className="px-4 py-4 cursor-pointer"
                          onClick={() => {
                            window.location.href = `/udash/vehicles/${vehicle.id}`;
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Car size={18} className="text-[#FF4081]" />
                            <span>{vehicle.vehicleNum}</span>
                          </div>
                        </td>

                        {/* 차량 종류 열 */}
                        <td
                          className="px-4 py-4 cursor-pointer"
                          onClick={() => {
                            window.location.href = `/udash/vehicles/${vehicle.id}`;
                          }}
                        >
                          <span className="text-gray-600">{vehicle.type}</span>
                        </td>

                        {/* 상태 열 */}
                        <td
                          className="px-4 py-4 cursor-pointer"
                          onClick={() => {
                            window.location.href = `/udash/vehicles/${vehicle.id}`;
                          }}
                        >
                          <Badge
                            className={
                              vehicle.vehicleStatus === "ACTIVE"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                            }
                          >
                            {vehicle.vehicleStatus === "ACTIVE"
                              ? "주차됨"
                              : "외부"}
                          </Badge>
                        </td>

                        {/* 관리 버튼 열 */}
                        <td className="px-4 py-4 border-l">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(vehicle);
                              }}
                            >
                              수정
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteVehicle(vehicle.id);
                              }}
                            >
                              삭제
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {vehicles?.filter((v) => v.registerType === "거주자")
                      .length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          등록된 거주자 차량이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <Pagination
                  currentPage={residentPaging.currentPage}
                  totalPages={calculateTotalPages(
                    vehicles?.filter((v) => v.registerType === "거주자")
                      .length || 0,
                    residentPaging.itemsPerPage
                  )}
                  onPageChange={(page) =>
                    setResidentPaging((prev) => ({
                      ...prev,
                      currentPage: page,
                    }))
                  }
                />
              </div>
            </div>

            {/* 입/출차 버튼 추가 */}
            <div className="flex justify-center gap-4 my-8">
              <Button
                size="lg"
                className="bg-[#FF4081] hover:bg-[#E91E63] px-12 py-6 text-lg"
                onClick={() => enterVehicleMutation.mutate()}
              >
                <Car className="mr-2 h-6 w-6" />
                입차하기
              </Button>
              <Button
                size="lg"
                className="bg-gray-500 hover:bg-gray-600 px-12 py-6 text-lg"
                onClick={() => exitVehicleMutation.mutate()}
              >
                <Car className="mr-2 h-6 w-6" />
                출차하기
              </Button>
              <Button
                size="lg"
                className="bg-blue-500 hover:bg-blue-600 px-12 py-6 text-lg"
                onClick={() => requestParkingMutation.mutate()}
              >
                <Car className="mr-2 h-6 w-4" />
                주차 재신청
              </Button>
            </div>

            {/* 방문자 차량 목록 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">방문자 차량</h3>
              <p className="text-gray-500 text-sm mt-1">
                나에게 방문하러 온 차량 정보를 관리할 수 있습니다.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 py-3 text-sm font-medium text-gray-500">
                        차량 번호
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500">
                        차량 종류
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500">
                        승인 여부
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500">
                        방문 정보
                      </th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-500">
                        관리
                      </th>
                    </tr>
                  </thead>
                  {/* 방문자 차량 테이블 */}
                  <tbody className="divide-y divide-gray-200">
                    {getPaginatedData(
                      vehicles?.filter((v) => v.registerType === "방문자") ||
                        [],
                      visitorPaging
                    ).map((vehicle) => (
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 flex items-center gap-2">
                          <Car size={18} className="text-[#FF4081]" />
                          <span>{vehicle.vehicleNum}</span>
                        </td>
                        <td className="px-4 py-4">{vehicle.type}</td>
                        <td className="px-4 py-4">
                          <StatusBadge status={vehicle.status} />
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="space-y-1">
                            <p className="text-gray-600">
                              <span className="font-medium">방문 사유:</span>{" "}
                              {vehicle.reason || "-"}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">연락처:</span>{" "}
                              {vehicle.userPhone || "-"}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-start gap-2">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={vehicle.status !== "INAGREE"}
                                  className={
                                    vehicle.status === "AGREE"
                                      ? "bg-green-500"
                                      : vehicle.status === "INVITER_AGREE"
                                      ? "bg-blue-500"
                                      : ""
                                  }
                                  onCheckedChange={(checked) => {
                                    if (!vehicle.entryRecordId) {
                                      alert("출입 기록 ID가 없습니다.");
                                      return;
                                    }
                                    updateVehicleStatusMutation.mutate({
                                      entryRecordId: vehicle.entryRecordId,
                                      status: checked
                                        ? "INVITER_AGREE"
                                        : "INAGREE",
                                    });
                                  }}
                                />
                                <span className="text-sm">
                                  {vehicle.status === "AGREE"
                                    ? "최종 승인됨"
                                    : vehicle.status === "INVITER_AGREE"
                                    ? "내가 승인함"
                                    : "미승인"}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {vehicle.status === "AGREE"
                                  ? "관리자가 최종 승인했습니다"
                                  : vehicle.status === "INVITER_AGREE"
                                  ? "관리자 승인 대기중입니다"
                                  : "방문자 출입을 승인하려면 켜세요"}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {vehicles?.filter((v) => v.registerType === "방문자")
                      .length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          등록된 방문자 차량이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <Pagination
                  currentPage={visitorPaging.currentPage}
                  totalPages={calculateTotalPages(
                    vehicles?.filter((v) => v.registerType === "방문자")
                      .length || 0,
                    visitorPaging.itemsPerPage
                  )}
                  onPageChange={(page) =>
                    setVisitorPaging((prev) => ({ ...prev, currentPage: page }))
                  }
                />
              </div>
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-md text-sm text-gray-600">
            <p>• 차량 등록 후 입차 버튼을 클릭하면 주차 상태로 변경됩니다.</p>
            <p>• 주차장 이용 시 반드시 등록된 차량으로 이용해 주세요.</p>
            <p>• 문의사항은 관리사무소(☎ 02-123-4567)로 연락 바랍니다.</p>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <Footer />
    </div>
  );
}

// Pagination 컴포넌트 생성
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex justify-center gap-2 mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        이전
      </Button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(page)}
        >
          {page}
        </Button>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        다음
      </Button>
    </div>
  );
}
