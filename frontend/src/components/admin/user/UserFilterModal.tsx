import React, { useState } from "react";
import { Modal, Form, Input, Select, Button, Space } from "antd";
import { SearchOutlined, FilterOutlined } from "@ant-design/icons";

const { Option } = Select;

interface FilterValues {
  searchTerm: string;
  searchField: string;
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
    searchTerm: "",
    searchField: "all",
  },
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
      styles={{ body: { padding: "20px" } }}
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
            rules={[{ required: true, message: "검색 필드를 선택해주세요" }]}
          >
            <Select placeholder="검색할 필드 선택">
              <Option value="all">전체 (이름, 이메일, 아파트)</Option>
              <Option value="userName">이름</Option>
              <Option value="email">이메일</Option>
              <Option value="apartmentName">아파트</Option>
            </Select>
          </Form.Item>

          <Form.Item name="searchTerm" label="검색어">
            <Input
              placeholder="검색어를 입력하세요"
              prefix={<SearchOutlined />}
            />
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
