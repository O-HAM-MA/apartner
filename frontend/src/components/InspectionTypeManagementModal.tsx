import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "@/lib/backend/client"; // 백엔드 클라이언트 임포트

interface InspectionType {
  type_id: number; // 또는 id, 백엔드 엔티티 확인 필요
  typeName: string;
}

interface InspectionTypeManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InspectionTypeManagementModal: React.FC<InspectionTypeManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [newTypeName, setNewTypeName] = useState("");
  const [editingType, setEditingType] = useState<InspectionType | null>(null);
  const [editedTypeName, setEditedTypeName] = useState("");

  // 점검 분류 목록 조회
  const { data: types, isLoading, error, refetch } = useQuery<InspectionType[]>(
    { queryKey: ["inspectionTypes"],
      queryFn: async () => {
        const { data, error } = await client.GET("/api/v1/inspection/type"/*, { // 주석 처리된 부분은 제거 또는 수정 필요할 수 있습니다.
        //   credentials: "include", // 쿠키 포함 설정 추가
        // }*/);
        if (error) throw error;
        return data as InspectionType[];
      },
    }
  );

  // 점검 분류 추가 mutation
  const addTypeMutation = useMutation({
    mutationFn: (typeName: string) => {
      return client.POST("/api/v1/inspection/type", {
        body: { name: typeName },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspectionTypes"] });
      setNewTypeName("");
      alert("분류가 추가되었습니다.");
    },
    onError: (err: any) => {
      console.error("분류 추가 실패:", err);
      alert("분류 추가에 실패했습니다.");
    },
  });

  // 점검 분류 수정 mutation
  const updateTypeMutation = useMutation({
    mutationFn: (type: InspectionType) => {
      return client.PUT("/api/v1/inspection/type/{typeId}", {
        params: { path: { typeId: type.type_id } },
        body: { name: type.typeName },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspectionTypes"] });
      setEditingType(null);
      setEditedTypeName("");
      alert("분류가 수정되었습니다.");
    },
    onError: (err: any) => {
      console.error("분류 수정 실패:", err);
      alert("분류 수정에 실패했습니다.");
    },
  });

  // 점검 분류 삭제 mutation
  const deleteTypeMutation = useMutation({
    mutationFn: (typeId: number) => {
      return client.DELETE("/api/v1/inspection/type/{typeId}", {
        params: { path: { typeId: typeId } },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspectionTypes"] });
      alert("분류가 삭제되었습니다.");
    },
    onError: (err: any) => {
      console.error("분류 삭제 실패:", err);
      alert("분류 삭제에 실패했습니다.");
    },
  });

  const handleAddType = () => {
    if (newTypeName.trim() === "") {
      alert("분류명을 입력해주세요.");
      return;
    }
    addTypeMutation.mutate(newTypeName.trim());
  };

  const handleEditClick = (type: InspectionType) => {
    setEditingType(type);
    setEditedTypeName(type.typeName);
  };

  const handleUpdateType = () => {
    if (!editingType || editedTypeName.trim() === "") {
      alert("수정할 분류명를 입력해주세요.");
      return;
    }
    updateTypeMutation.mutate({ ...editingType, typeName: editedTypeName.trim() });
  };

  const handleDeleteClick = (typeId: number) => {
    if (window.confirm("정말로 이 분류를 삭제하시겠습니까?")) {
      deleteTypeMutation.mutate(typeId);
    }
  };

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setNewTypeName("");
      setEditingType(null);
      setEditedTypeName("");
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>점검 분류 관리</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* 새로운 분류 추가 폼 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="newType" className="text-right">새 분류명</Label>
            <Input
              id="newType"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <Button onClick={handleAddType} disabled={addTypeMutation.isPending}>
            {addTypeMutation.isPending ? "추가 중..." : "추가"}
          </Button>

          {/* 분류 목록 표시 */}
          <div className="mt-4">
            <h4 className="mb-2 text-lg font-semibold">분류 목록</h4>
            {isLoading ? (
              <div>로딩 중...</div>
            ) : error ? (
              <div className="text-red-500">에러: {(error as any).message}</div>
            ) : (
              <ul className="space-y-2">
                {types?.map((type) => (
                  <li key={type.type_id} className="flex justify-between items-center p-2 border rounded">
                    {editingType?.type_id === type.type_id ? (
                      // 수정 폼
                      <div className="flex-1 flex items-center gap-2">
                        <Input
                          value={editedTypeName}
                          onChange={(e) => setEditedTypeName(e.target.value)}
                          className="flex-1"
                        />
                        <Button size="sm" onClick={handleUpdateType} disabled={updateTypeMutation.isPending}>저장</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingType(null)}>취소</Button>
                      </div>
                    ) : (
                      // 분류 이름 표시
                      <span className="flex-1">{type.typeName}</span>
                    )}
                    
                    {editingType?.type_id !== type.type_id && (
                      // 수정/삭제 버튼
                      <div className="flex gap-2">
                         <Button size="sm" variant="outline" onClick={() => handleEditClick(type)}>수정</Button>
                         <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(type.type_id)} disabled={deleteTypeMutation.isPending}>삭제</Button>
                      </div>
                    )}
                  </li>
                ))}
                 {types?.length === 0 && <div>등록된 분류가 없습니다.</div> }
              </ul>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InspectionTypeManagementModal; 