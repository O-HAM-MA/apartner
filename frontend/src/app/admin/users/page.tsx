"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Table, Typography, Tag, Badge, Pagination, message } from "antd";
import { getAdminUserList, exportUsers } from "@/utils/userApi";
import { UserListItem, UserStatus, UserStatusDisplay } from "@/types/user";
import dayjs from "dayjs";
import UserDetailModal from "@/components/admin/user/UserDetailModal";
import UserFilterPanel from "@/components/admin/user/UserFilterPanel";
import { SorterResult } from "antd/lib/table/interface";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  MinusCircleFilled,
} from "@ant-design/icons";

const { Title } = Typography;
const { useMessage } = message;

interface FilterParams {
  searchTerm: string;
  searchField: string;
}

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterParams, setFilterParams] = useState<FilterParams>({
    searchTerm: "",
    searchField: "all",
  });
  const [sortField, setSortField] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [messageApi, contextHolder] = useMessage();
  const pageSize = 20;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { searchTerm, searchField } = filterParams;
      const sortParam = `${sortField},${sortOrder}`;

      console.log("필터 요청: ", { searchTerm, searchField });

      const response = await getAdminUserList(
        searchTerm,
        searchField,
        currentPage,
        pageSize,
        sortParam
      );

      // key 속성 추가 부분
      const processedUsers = response.content.map((user) => ({
        ...user,
        key: user.id.toString(), // 고유 key 생성
      }));

      setUsers(processedUsers);
      setTotal(response.totalElements);
    } catch (error) {
      console.error("사용자 목록 불러오기 중 오류 발생:", error);
      messageApi.error("사용자 목록을 불러오는 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortField, sortOrder, filterParams, messageApi]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (searchTerm: string, searchField: string) => {
    const newFilters = {
      ...filterParams,
      searchTerm,
      searchField,
    };
    setFilterParams(newFilters);
    setCurrentPage(0);
  };

  const handleFilterApply = (values: FilterParams) => {
    console.log("필터 적용:", values);

    setFilterParams({
      searchTerm: values.searchTerm || "",
      searchField: values.searchField || "all",
    });

    setCurrentPage(0);
  };

  const handleReset = () => {
    // 필터 파라미터 초기화
    setFilterParams({
      searchTerm: "",
      searchField: "all",
    });

    // 정렬 초기화
    setSortField("id");
    setSortOrder("desc");

    // 페이지 초기화
    setCurrentPage(0);
  };

  const handleExport = (format: "csv" | "excel") => {
    const { searchTerm, searchField } = filterParams;
    const exportUrl = exportUsers(searchTerm, searchField, format);

    window.open(exportUrl, "_blank");
  };

  const handleTableChange = (
    pagination: any,
    filters: any,
    sorter: SorterResult<UserListItem> | SorterResult<UserListItem>[]
  ) => {
    if (sorter && "field" in sorter && sorter.field && sorter.order) {
      const field = sorter.field as string;
      const order = sorter.order === "ascend" ? "asc" : "desc";

      setSortField(field);
      setSortOrder(order);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page - 1);
  };

  const handleUserRowClick = (user: UserListItem) => {
    setSelectedUserId(user.id);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedUserId(null);
  };

  const handleUserUpdated = () => {
    fetchUsers();
  };

  const getStatusText = (status: UserStatus): string => {
    return UserStatusDisplay[status] || status;
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return (
          <div style={{ display: "flex", alignItems: "center" }}>
            <CheckCircleFilled style={{ color: "green", fontSize: "16px" }} />
            <span style={{ marginLeft: "5px" }}>{getStatusText(status)}</span>
          </div>
        );
      case UserStatus.INACTIVE:
        return (
          <div style={{ display: "flex", alignItems: "center" }}>
            <MinusCircleFilled style={{ color: "gray", fontSize: "16px" }} />
            <span style={{ marginLeft: "5px" }}>{getStatusText(status)}</span>
          </div>
        );
      case UserStatus.PENDING:
        return (
          <div style={{ display: "flex", alignItems: "center" }}>
            <CloseCircleFilled style={{ color: "orange", fontSize: "16px" }} />
            <span style={{ marginLeft: "5px" }}>{getStatusText(status)}</span>
          </div>
        );
      case UserStatus.WITHDRAWN:
        return (
          <div style={{ display: "flex", alignItems: "center" }}>
            <ExclamationCircleFilled
              style={{ color: "red", fontSize: "16px" }}
            />
            <span style={{ marginLeft: "5px" }}>{getStatusText(status)}</span>
          </div>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const getRoleTags = (roles: string[]) => {
    const roleColorMap: Record<string, string> = {
      ADMIN: "red",
      MANAGER: "orange",
      USER: "blue",
    };

    return (
      <>
        {roles.map((role) => (
          <Tag
            key={role}
            color={roleColorMap[role] || "default"}
            style={{ marginRight: 4 }}
          >
            {role}
          </Tag>
        ))}
      </>
    );
  };

  const columns = [
    {
      title: "번호",
      key: "index",
      width: 80,
      render: (_: any, __: any, index: number) =>
        total - currentPage * pageSize - index, // 내림차순 번호 구현
    },
    {
      title: "이름",
      dataIndex: "userName",
      key: "userName",
      sorter: true,
    },
    {
      title: "이메일",
      dataIndex: "email",
      key: "email",
      sorter: true,
    },
    {
      title: "핸드폰 번호",
      dataIndex: "phoneNum",
      key: "phoneNum",
    },
    {
      title: "가입 방식",
      dataIndex: "socialProvider",
      key: "socialProvider",
      render: (provider: string | null) =>
        provider ? `소셜 (${provider})` : "일반",
    },
    {
      title: "아파트",
      dataIndex: "apartmentName",
      key: "apartmentName",
      render: (name: string | null) => name || "-",
    },
    {
      title: "동/호수",
      key: "building",
      render: (_: unknown, record: UserListItem) => {
        if (record.buildingName && record.unitNumber) {
          return `${record.buildingName}동 ${record.unitNumber}호`;
        } else if (record.buildingName) {
          return `${record.buildingName}동`;
        } else {
          return "-";
        }
      },
    },
    {
      title: "권한",
      dataIndex: "roles",
      key: "roles",
      render: (roles: string[]) => getRoleTags(roles),
    },
    {
      title: "상태",
      dataIndex: "status",
      key: "status",
      render: (status: UserStatus) => getStatusBadge(status),
      sorter: true,
    },
    {
      title: "탈퇴 일시",
      dataIndex: "deletedAt",
      key: "deletedAt",
      render: (date: string | null) =>
        date ? dayjs(date).format("YYYY-MM-DD") : "-",
    },
    {
      title: "최근 로그인",
      dataIndex: "lastLoginAt",
      key: "lastLoginAt",
      render: (date: string | null) =>
        date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "-",
      sorter: true,
    },
    {
      title: "수정 일시",
      dataIndex: "modifiedAt",
      key: "modifiedAt",
      render: (date: string | null) =>
        date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "-",
      sorter: true,
    },
  ];

  return (
    <div className="p-6">
      {contextHolder}
      <Title level={2}>사용자 관리</Title>

      <UserFilterPanel
        onSearch={handleSearch}
        onExport={handleExport}
        onFilterApply={handleFilterApply}
        onReset={handleReset}
      />

      <Table
        dataSource={users}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
        onRow={(record) => ({
          onClick: () => {
            handleUserRowClick(record);
          },
          style: { cursor: "pointer" },
        })}
      />

      <div className="mt-4 flex justify-center">
        <Pagination
          current={currentPage + 1}
          total={total}
          pageSize={pageSize}
          onChange={handlePageChange}
          showSizeChanger={false}
          showTotal={(total) => `총 ${total}명`}
        />
      </div>

      <UserDetailModal
        userId={selectedUserId}
        open={modalVisible}
        onClose={handleModalClose}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
}
