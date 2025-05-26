import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, Space } from 'antd';
import { UserStatus } from '@/types/user';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';

const { Option } = Select;

interface FilterValues {
  searchTerm: string;
  searchField: string;
  role: string | undefined;
  status: UserStatus | undefined;
}

interface UserFilterModalProps {
  open: boolean;
  onClose: () => void;
  onApplyFilter: (values: FilterValues) => void;
  initialValues?: FilterValues;
}

const UserFilterModal: React.FC<UserFilterModalProps> = ({ 
  open, 
  onClose, 
  onApplyFilter,
  initialValues = {
    searchTerm: '',
    searchField: 'all',
    role: undefined,
    status: undefined
  }
}) => {
  const [form] = Form.useForm();
  
  const handleFinish = (values: FilterValues) => {
    onApplyFilter(values);
    onClose();
  };
  
  const handleReset = () => {
    form.resetFields();
  };

  return (
    <Modal
      title="사용자 필터"
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      styles={{ body: { padding: '20px' } }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={initialValues}
      >
        <div className="mb-4">
          <Form.Item
            name="searchField"
            label="검색 필드"
            rules={[{ required: true, message: '검색 필드를 선택해주세요' }]}
          >
            <Select placeholder="검색할 필드 선택">
              <Option value="all">전체 (이름, 이메일, 아파트)</Option>
              <Option value="userName">이름</Option>
              <Option value="email">이메일</Option>
              <Option value="apartmentName">아파트</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="searchTerm"
            label="검색어"
          >
            <Input 
              placeholder="검색어를 입력하세요" 
              prefix={<SearchOutlined />}
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="role"
            label="권한"
          >
            <Select placeholder="권한 선택" allowClear>
              <Option value="ADMIN">관리자</Option>
              <Option value="USER">일반 사용자</Option>
              <Option value="MANAGER">매니저</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="상태"
          >
            <Select placeholder="상태 선택" allowClear>
              <Option value={UserStatus.ACTIVE}>활성</Option>
              <Option value={UserStatus.INACTIVE}>비활성</Option>
              <Option value={UserStatus.SUSPENDED}>정지</Option>
              <Option value={UserStatus.DELETED}>탈퇴</Option>
            </Select>
          </Form.Item>
        </div>

        <div className="flex justify-end mt-4">
          <Space>
            <Button onClick={handleReset}>초기화</Button>
            <Button onClick={onClose}>취소</Button>
            <Button type="primary" htmlType="submit" icon={<FilterOutlined />}>
              필터 적용
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default UserFilterModal;