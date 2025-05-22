"use client";

import { useState } from "react";
import { FiEye, FiTrash2, FiEdit2 } from "react-icons/fi";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Complaint {
  id: number;
  title: string;
  content: string;
  status: "pending" | "in_progress" | "completed" | "rejected";
  createdAt: string;
  user: string;
}

const statusOptions = [
  { value: "pending", label: "대기중" },
  { value: "in_progress", label: "처리중" },
  { value: "completed", label: "완료" },
  { value: "rejected", label: "반려" },
];

export default function ComplaintsPage() {
  const [selectedComplaints, setSelectedComplaints] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("title");
  const [complaints, setComplaints] = useState<Complaint[]>([
    {
      id: 1,
      title: "민원 제목 1",
      content: "민원 내용 1",
      status: "pending",
      createdAt: "2024-03-20",
      user: "사용자1",
    },
    {
      id: 2,
      title: "민원 제목 2",
      content: "민원 내용 2",
      status: "in_progress",
      createdAt: "2024-03-19",
      user: "사용자2",
    },
    // 더미 데이터
  ]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedComplaints(complaints.map((complaint) => complaint.id));
    } else {
      setSelectedComplaints([]);
    }
  };

  const handleSelectComplaint = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedComplaints([...selectedComplaints, id]);
    } else {
      setSelectedComplaints(
        selectedComplaints.filter((complaintId) => complaintId !== id)
      );
    }
  };

  const handleStatusChange = (id: number, status: string) => {
    setComplaints(
      complaints.map((complaint) =>
        complaint.id === id
          ? { ...complaint, status: status as Complaint["status"] }
          : complaint
      )
    );
  };

  const handleBulkStatusChange = (status: string) => {
    setComplaints(
      complaints.map((complaint) =>
        selectedComplaints.includes(complaint.id)
          ? { ...complaint, status: status as Complaint["status"] }
          : complaint
      )
    );
  };

  const searchCategories = [
    { value: "title", label: "제목" },
    { value: "status", label: "상태" },
    { value: "user", label: "작성자" },
  ];

  const filteredComplaints = complaints.filter((complaint) => {
    const searchValue = searchQuery.toLowerCase();
    switch (searchCategory) {
      case "title":
        return complaint.title.toLowerCase().includes(searchValue);
      case "status":
        return complaint.status.toLowerCase().includes(searchValue);
      case "user":
        return complaint.user.toLowerCase().includes(searchValue);
      default:
        return true;
    }
  });

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>민원 관리</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedComplaints.length === complaints.length}
                onCheckedChange={handleSelectAll}
              />
              <span>전체 선택</span>
            </div>
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
              <Select onValueChange={handleBulkStatusChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="상태 변경" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline">선택 항목 삭제</Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>제목</TableHead>
                <TableHead>작성자</TableHead>
                <TableHead>작성일</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComplaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedComplaints.includes(complaint.id)}
                      onCheckedChange={(checked) =>
                        handleSelectComplaint(complaint.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>{complaint.title}</TableCell>
                  <TableCell>{complaint.user}</TableCell>
                  <TableCell>{complaint.createdAt}</TableCell>
                  <TableCell>
                    <Select
                      value={complaint.status}
                      onValueChange={(value) =>
                        handleStatusChange(complaint.id, value)
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <FiEye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <FiEdit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <FiTrash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
