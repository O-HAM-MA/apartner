import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "@/lib/backend/client"; // 백엔드 클라이언트 임포트
import { Tag, Plus, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface InspectionType {
  id: number;
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
  const { toast } = useToast();
  const [newTypeName, setNewTypeName] = useState("");

  // 점검 분류 목록 조회
  const { data: types, isLoading, error, refetch } = useQuery<InspectionType[]>(
    { queryKey: ["inspectionTypes"],
      queryFn: async () => {
        const { data, error } = await client.GET("/api/v1/inspection/type");
        if (error) throw error;
        return data as InspectionType[];
      },
    }
  );

  // 점검 분류 추가 mutation
  const addTypeMutation = useMutation({
    mutationFn: (typeName: string) => {
      return client.POST("/api/v1/inspection/type/create", {
        body: { name: typeName },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspectionTypes"] });
      setNewTypeName("");
      toast({
        title: "분류 추가 완료",
        description: "새로운 분류가 추가되었습니다.",
        duration: 2000,
        className: "bg-green-50 border-green-200",
      });
    },
    onError: (err: any) => {
      console.error("분류 추가 실패:", err);
      toast({
        title: "분류 추가 실패",
        description: "분류 추가 중 오류가 발생했습니다.",
        variant: "destructive",
        duration: 2000,
      });
    },
  });

  const handleAddType = () => {
    if (newTypeName.trim() === "") {
      toast({
        title: "입력 오류",
        description: "분류명을 입력해주세요.",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }
    addTypeMutation.mutate(newTypeName.trim());
  };

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setNewTypeName("");
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Tag className="h-5 w-5 text-pink-500" />
            점검 분류 관리
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* 새로운 분류 추가 폼 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="newType" className="text-sm font-medium">새 분류 추가</Label>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="flex gap-2">
              <Input
                id="newType"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="새로운 분류명을 입력하세요"
                className="flex-1"
              />
              <Button 
                onClick={handleAddType} 
                disabled={addTypeMutation.isPending}
                className="bg-pink-500 hover:bg-pink-600 text-white"
              >
                {addTypeMutation.isPending ? (
                  "추가 중..."
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    추가
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 분류 목록 표시 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">분류 목록</Label>
              <div className="h-px flex-1 bg-border" />
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500" />
              </div>
            ) : error ? (
              <div className="text-red-500 bg-red-50 p-4 rounded-lg text-sm">
                에러: {(error as any).message}
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {types?.map((type) => (
                  <div 
                    key={type.id} 
                    className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:border-pink-200 transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4 text-pink-500 flex-shrink-0" />
                    <span className="text-sm">{type.typeName}</span>
                  </div>
                ))}
                {types?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    등록된 분류가 없습니다
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="hover:bg-pink-50 hover:text-pink-500 hover:border-pink-200"
          >
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InspectionTypeManagementModal; 