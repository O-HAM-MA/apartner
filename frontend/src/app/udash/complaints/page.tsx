'use client';

import { useState, useEffect } from 'react';
import { FiEye, FiEdit, FiMessageSquare } from 'react-icons/fi';
import client from '@/lib/backend/client';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Feedback {
  feedbackId: number;
  userName: string;
  content: string;
  createAt: string;
}

interface Complaint {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  complaintStatus: 'pending' | 'in_progress' | 'completed' | 'rejected';
  category: string;
  user: string;
  feedbacks?: {
    feedbackId: number;
    userName: string;
    content: string;
    createAt: string;
  }[];
}

const statusOptions = [
  { value: 'pending', label: '대기중', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'in_progress', label: '처리중', color: 'bg-blue-100 text-blue-800' },
  { value: 'completed', label: '완료', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: '반려', color: 'bg-red-100 text-red-800' },
];

const categoryOptions = [
  { value: 'general', label: '일반' },
  { value: 'maintenance', label: '시설관리' },
  { value: 'security', label: '보안' },
  { value: 'other', label: '기타' },
];

// 카테고리 한글 라벨을 영문 값으로 변환하는 함수
const getCategoryValue = (label: string): string => {
  const option = categoryOptions.find((opt) => opt.label === label);
  return option ? option.value : 'other';
};

// 민원 상태 값을 한글 라벨로 매핑하는 함수
const getStatusLabel = (
  status: Complaint['complaintStatus'] | string
): string => {
  const option = statusOptions.find((opt) => opt.value === status);
  return option ? option.label : status;
};

// 상태에 따른 스타일을 반환하는 함수
const getStatusStyle = (
  status: Complaint['complaintStatus'] | string
): string => {
  const option = statusOptions.find((opt) => opt.value === status);
  return option ? option.color : 'bg-gray-100 text-gray-800';
};

export default function ComplaintsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('title');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedComplaint, setEditedComplaint] = useState<Complaint | null>(
    null
  );
  const [newFeedback, setNewFeedback] = useState('');

  // 모든 민원 불러오기
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const { data } = await client.GET('/api/v1/complaints', {});

        const normalized = data.map((item: any) => ({
          ...item,
          complaintStatus: item.complaintStatus.toLowerCase(),
          user: item.userName,
        }));

        setComplaints(normalized);
      } catch (error) {
        console.error('민원 데이터를 불러오는 데 실패했습니다:', error);
      }
    };

    fetchComplaints();
  }, []);

  // 상세보기 클릭시 모달 띄우기
  const handleViewDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setEditedComplaint(complaint);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  // 수정 버튼 클릭시
  const handleEdit = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setEditedComplaint(complaint);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // 수정 내용 저장
  const handleSaveEdit = async () => {
    if (!editedComplaint) return;

    try {
      await client.PUT(`/api/v1/complaints/${editedComplaint.id}`, {
        body: {
          title: editedComplaint.title,
          content: editedComplaint.content,
          category: editedComplaint.category,
        },
      });

      // 목록 업데이트
      setComplaints(
        complaints.map((complaint) =>
          complaint.id === editedComplaint.id ? editedComplaint : complaint
        )
      );

      setIsEditing(false);
      setIsModalOpen(false);
    } catch (error) {
      console.error('민원 수정에 실패했습니다:', error);
    }
  };

  const handleCreate = async () => {
    if (!editedComplaint) return;

    try {
      const { data } = await client.POST('/api/v1/complaints', {
        body: {
          title: editedComplaint.title,
          content: editedComplaint.content,
          category: editedComplaint.category,
        },
      });

      // 목록 업데이트
      if (data) {
        setComplaints([...complaints, data as Complaint]);
      }
      setIsCreateModalOpen(false);
      setEditedComplaint(null);
    } catch (error) {
      console.error('민원 작성에 실패했습니다:', error);
    }
  };

  const handleViewFeedback = async (complaint: Complaint) => {
    try {
      const { data } = await client.GET(
        `/api/v1/complaint-feedbacks/${complaint.id}`
      );
      setSelectedComplaint({
        ...complaint,
        feedbacks: data,
      });
      setIsFeedbackModalOpen(true);
      console.log('피드백 : ' + data);
    } catch (error) {
      console.error('피드백 조회 실패:', error);
      alert('피드백 조회에 실패했습니다.');
    }
  };

  const handleSubmitFeedback = async () => {
    if (!selectedComplaint || !newFeedback.trim()) return;

    try {
      await client.POST(`/api/v1/complaint-feedbacks`, {
        body: {
          complaintId: selectedComplaint.id,
          content: newFeedback,
        },
      });

      // Refresh feedbacks after submission
      const { data } = await client.GET(
        `/api/v1/complaint-feedbacks/${selectedComplaint.id}`,
        {}
      );

      setSelectedComplaint({
        ...selectedComplaint,
        feedbacks: data,
      });

      setNewFeedback(''); // Clear the input
    } catch (error) {
      console.error('피드백 작성 실패:', error);
      alert('피드백 작성에 실패했습니다.');
    }
  };

  const searchCategories = [
    { value: 'title', label: '제목' },
    { value: 'status', label: '상태' },
  ];

  const filteredComplaints = complaints
    .filter((complaint) => complaint.status !== 'inactive')
    .filter((complaint) => {
      const searchValue = searchQuery.toLowerCase();
      switch (searchCategory) {
        case 'title':
          return complaint.title.toLowerCase().includes(searchValue);
        case 'status':
          return complaint.complaintStatus.toLowerCase().includes(searchValue);
        default:
          return true;
      }
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">내 민원 관리</h1>
        <p className="text-muted-foreground">
          민원 신청 및 처리 현황을 확인할 수 있습니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>내 민원 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <div className="flex items-center gap-2">
              <Select value={searchCategory} onValueChange={setSearchCategory}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {searchCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="검색어를 입력하세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-pink-500 hover:bg-pink-600 text-white"
            >
              민원 작성
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>카테고리</TableHead>
                <TableHead>제목</TableHead>
                <TableHead>작성일</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComplaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell>{complaint.category}</TableCell>
                  <TableCell>{complaint.title}</TableCell>
                  <TableCell>
                    {format(
                      new Date(complaint.createdAt),
                      'yyyy년 MM월 dd일 HH:mm',
                      { locale: ko }
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${getStatusStyle(
                        complaint.complaintStatus
                      )}`}
                    >
                      {getStatusLabel(complaint.complaintStatus)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleViewDetails(complaint)}
                      >
                        <FiEye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(complaint)}
                      >
                        <FiEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleViewFeedback(complaint)}
                      >
                        <FiMessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? '민원 수정' : '민원 상세 내용'}
            </DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">카테고리</h3>
                {isEditing ? (
                  <Select
                    value={editedComplaint?.category}
                    onValueChange={(value) =>
                      setEditedComplaint((prev) =>
                        prev ? { ...prev, category: value } : null
                      )
                    }
                  >
                    <SelectTrigger className="focus:ring-pink-500 focus:border-pink-500 hover:border-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((category) => (
                        <SelectItem key={category.value} value={category.label}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p>{selectedComplaint.category}</p>
                )}
              </div>
              <div>
                <h3 className="font-semibold">제목</h3>
                {isEditing ? (
                  <Input
                    value={editedComplaint?.title}
                    onChange={(e) =>
                      setEditedComplaint((prev) =>
                        prev ? { ...prev, title: e.target.value } : null
                      )
                    }
                    className="focus:ring-pink-500 focus:border-pink-500 hover:border-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-0"
                  />
                ) : (
                  <p>{selectedComplaint.title}</p>
                )}
              </div>
              <div>
                <h3 className="font-semibold">작성일</h3>
                <p>
                  {format(
                    new Date(selectedComplaint.createdAt),
                    'yyyy년 MM월 dd일 HH:mm',
                    { locale: ko }
                  )}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">상태</h3>
                <p>{getStatusLabel(selectedComplaint.complaintStatus)}</p>
              </div>
              <div>
                <h3 className="font-semibold">내용</h3>
                {isEditing ? (
                  <textarea
                    className="w-full min-h-[200px] p-2 border rounded-md focus:ring-pink-500 focus:border-pink-500 hover:border-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-0"
                    value={editedComplaint?.content}
                    onChange={(e) =>
                      setEditedComplaint((prev) =>
                        prev ? { ...prev, content: e.target.value } : null
                      )
                    }
                  />
                ) : (
                  <p className="whitespace-pre-wrap">
                    {selectedComplaint.content}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-pink-500 hover:bg-pink-600 text-white"
                  >
                    수정
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="hover:bg-pink-50 hover:text-pink-600"
                    >
                      취소
                    </Button>
                    <Button
                      onClick={handleSaveEdit}
                      className="bg-pink-500 hover:bg-pink-600 text-white"
                    >
                      저장
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>새 민원 작성</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">카테고리</h3>
              <Select
                value={editedComplaint?.category || ''}
                onValueChange={(value) =>
                  setEditedComplaint((prev) =>
                    prev
                      ? { ...prev, category: value }
                      : {
                          id: 0,
                          title: '',
                          content: '',
                          createdAt: '',
                          complaintStatus: 'pending',
                          category: value,
                          user: '',
                        }
                  )
                }
              >
                <SelectTrigger className="focus:ring-pink-500 hover:border-pink-500">
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem
                      key={category.value}
                      value={category.label}
                      className="hover:bg-pink-50 focus:bg-pink-50"
                    >
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <h3 className="font-semibold">제목</h3>
              <Input
                placeholder="제목을 입력하세요"
                value={editedComplaint?.title || ''}
                onChange={(e) =>
                  setEditedComplaint((prev) =>
                    prev
                      ? { ...prev, title: e.target.value }
                      : {
                          id: 0,
                          title: e.target.value,
                          content: '',
                          createdAt: '',
                          complaintStatus: 'pending',
                          category: '',
                          user: '',
                        }
                  )
                }
                className="focus:ring-pink-500 focus:border-pink-500 hover:border-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-0"
              />
            </div>
            <div>
              <h3 className="font-semibold">내용</h3>
              <textarea
                className="w-full min-h-[200px] p-2 border rounded-md focus:ring-pink-500 focus:border-pink-500 hover:border-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-0"
                placeholder="내용을 입력하세요"
                value={editedComplaint?.content || ''}
                onChange={(e) =>
                  setEditedComplaint((prev) =>
                    prev
                      ? { ...prev, content: e.target.value }
                      : {
                          id: 0,
                          title: '',
                          content: e.target.value,
                          createdAt: '',
                          complaintStatus: 'pending',
                          category: '',
                          user: '',
                        }
                  )
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="hover:bg-pink-50 hover:text-pink-600"
              >
                취소
              </Button>
              <Button
                onClick={handleCreate}
                className="bg-pink-500 hover:bg-pink-600 text-white"
              >
                저장
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isFeedbackModalOpen} onOpenChange={setIsFeedbackModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>피드백</DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">민원 내용</h3>
                <p className="text-sm text-gray-500">
                  {selectedComplaint.content}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">피드백 목록</h3>
                <div className="space-y-4">
                  {selectedComplaint.feedbacks?.map((feedback) => (
                    <div
                      key={`${feedback.feedbackId}-${feedback.createAt}`}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">{feedback.userName}</span>
                        <span className="text-sm text-gray-500">
                          {feedback.createAt
                            ? format(
                                new Date(feedback.createAt),
                                'yyyy년 MM월 dd일 HH:mm',
                                {
                                  locale: ko,
                                }
                              )
                            : '날짜 없음'}
                        </span>
                      </div>
                      <p className="text-sm">{feedback.content}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">새 피드백 작성</h3>
                <textarea
                  className="w-full min-h-[100px] p-2 border rounded-md focus:ring-pink-500 focus:border-pink-500 hover:border-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-0"
                  value={newFeedback}
                  onChange={(e) => setNewFeedback(e.target.value)}
                  placeholder="피드백을 입력하세요"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsFeedbackModalOpen(false)}
                    className="hover:bg-pink-50 hover:text-pink-600"
                  >
                    닫기
                  </Button>
                  <Button
                    onClick={handleSubmitFeedback}
                    className="bg-pink-500 hover:bg-pink-600 text-white"
                  >
                    작성
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
