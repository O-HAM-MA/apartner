'use client';

import React, { useState, useEffect } from 'react';
import { Table, Typography, Tag, Badge, Pagination, message } from 'antd';
import { getAdminUserList, exportUsers } from '@/utils/userApi';
import { UserListItem, UserStatus } from '@/types/user';
import dayjs from 'dayjs';
import UserDetailModal from '@/components/admin/user/UserDetailModal';
import UserFilterPanel from '@/components/admin/user/UserFilterPanel';
import { SorterResult } from 'antd/lib/table/interface';
import { CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled, MinusCircleFilled } from '@ant-design/icons';

const { Title } = Typography;

interface FilterParams {
  searchTerm: string;
  searchField: string;
  role: string | undefined;
  status: UserStatus | undefined;
}

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterParams, setFilterParams] = useState<FilterParams>({
    searchTerm: '',
    searchField: 'all',
    role: undefined,
    status: undefined
  });
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<string>('desc'); // 기본값을 desc로 변경
  const pageSize = 20;

  useEffect(() => {
    fetchUsers();
  }, [currentPage, sortField, sortOrder]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { searchTerm, searchField, role, status } = filterParams;
      const sortParam = `${sortField},${sortOrder}`;
      
      console.log('필터 요청: ', { searchTerm, searchField, role, status });
      
      const response = await getAdminUserList(
        searchTerm,
        searchField, 
        role, 
        status, 
        currentPage, 
        pageSize, 
        sortParam
      );
      
      setUsers(response.content);
      setTotal(response.totalElements);
    } catch (error) {
      console.error('사용자 목록 불러오기 중 오류 발생:', error);
      message.error('사용자 목록을 불러오는 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm: string, role?: string, status?: UserStatus) => {
    console.log('검색 요청:', searchTerm, role, status);
  };

  const handleFilterApply = (values: FilterParams) => {
    console.log('필터 적용:', values);
    
    setFilterParams({
      searchTerm: values.searchTerm || '',
      searchField: values.searchField || 'all',
      role: values.role,
      status: values.status
    });
    
    setCurrentPage(0);
    
    setTimeout(() => {
      fetchUsers();
    }, 100);
  };

  const handleReset = () => {
    setSortField('id');
    setSortOrder('desc'); // 기본값을 desc로 변경
    setCurrentPage(0);
    
    setTimeout(() => {
      fetchUsers();
    }, 100);
  };

  const handleExport = (format: 'csv' | 'excel') => {
    const { searchTerm, searchField, role, status } = filterParams;
    const exportUrl = exportUsers(searchTerm, searchField, role, status, format);
    
    window.open(exportUrl, '_blank');
  };

  const handleTableChange = (
    pagination: any, 
    filters: any, 
    sorter: SorterResult<UserListItem>
  ) => {
    if (sorter && sorter.field && sorter.order) {
      const field = sorter.field as string;
      const order = sorter.order === 'ascend' ? 'asc' : 'desc';
      
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
    switch(status) {
      case UserStatus.ACTIVE: return '활성';
      case UserStatus.INACTIVE: return '비활성';
      case UserStatus.SUSPENDED: return '정지';
      case UserStatus.DELETED: return '탈퇴';
      default: return status;
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch(status) {
      case UserStatus.ACTIVE:
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircleFilled style={{ color: 'green', fontSize: '16px' }} />
            <span style={{ marginLeft: '5px' }}>{getStatusText(status)}</span>
          </div>
        );
      case UserStatus.INACTIVE:
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <MinusCircleFilled style={{ color: 'gray', fontSize: '16px' }} />
            <span style={{ marginLeft: '5px' }}>{getStatusText(status)}</span>
          </div>
        );
      case UserStatus.SUSPENDED:
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CloseCircleFilled style={{ color: 'red', fontSize: '16px' }} />
            <span style={{ marginLeft: '5px' }}>{getStatusText(status)}</span>
          </div>
        );
      case UserStatus.DELETED:
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ExclamationCircleFilled style={{ color: 'orange', fontSize: '16px' }} />
            <span style={{ marginLeft: '5px' }}>{getStatusText(status)}</span>
          </div>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const getRoleTags = (roles: string[]) => {
    const roleColorMap: Record<string, string> = {
      'ADMIN': 'red',
      'MANAGER': 'orange',
      'USER': 'blue'
    };
    
    return (
      <>
        {roles.map(role => (
          <Tag key={role} color={roleColorMap[role] || 'default'} style={{ marginRight: 4 }}>
            {role}
          </Tag>
        ))}
      </>
    );
  };

  const columns = [
    {
      title: '번호',
      key: 'index',
      width: 80,
      render: (_: any, __: any, index: number) => total - (currentPage * pageSize) - index, // 내림차순 번호 구현
    },
    {
      title: '이름',
      dataIndex: 'userName',
      key: 'userName',
      sorter: true,
    },
    {
      title: '이메일',
      dataIndex: 'email',
      key: 'email',
      sorter: true,
    },
    {
      title: '핸드폰 번호',
      dataIndex: 'phoneNum',
      key: 'phoneNum',
    },
    {
      title: '가입 방식',
      dataIndex: 'socialProvider',
      key: 'socialProvider',
      render: (provider: string | null) => (provider ? `소셜 (${provider})` : '일반'),
    },
    {
      title: '아파트',
      dataIndex: 'apartmentName',
      key: 'apartmentName',
      render: (name: string | null) => name || '-',
    },
    {
      title: '동/호수',
      key: 'building',
      render: (_, record: UserListItem) => {
        if (record.buildingName && record.unitNumber) {
          return `${record.buildingName}동 ${record.unitNumber}호`;
        } else if (record.buildingName) {
          return `${record.buildingName}동`;
        } else {
          return '-';
        }
      },
    },
    {
      title: '권한',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: string[]) => getRoleTags(roles),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: UserStatus) => getStatusBadge(status),
      sorter: true,
    },
    {
      title: '탈퇴 일시',
      dataIndex: 'deletedAt',
      key: 'deletedAt',
      render: (date: string | null) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '최근 로그인',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (date: string | null) => (date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'),
      sorter: true,
    },
  ];

  return (
    <div className="p-6">
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
          onClick: () => handleUserRowClick(record),
          style: { cursor: 'pointer' }
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
