import React, { useState } from 'react';
import { Select, Button, message, Space, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { UserDetail, RoleUpdateRequest } from '@/types/user';
import { updateUserRoles } from '@/utils/userApi';

const { Option } = Select;
const { confirm } = Modal;

interface UserRoleEditorProps {
  user: UserDetail;
  onRoleUpdated: () => void;
}

const UserRoleEditor: React.FC<UserRoleEditorProps> = ({ user, onRoleUpdated }) => {
  const [selectedRole, setSelectedRole] = useState<string>(user.roles[0] || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
  };

  const showConfirm = () => {
    confirm({
      title: '사용자 권한 변경',
      icon: <ExclamationCircleOutlined />,
      content: '정말 사용자의 권한을 변경하시겠습니까?',
      onOk: handleSubmit,
      okText: '변경',
      cancelText: '취소',
    });
  };

  const handleSubmit = async () => {
    if (!selectedRole) {
      message.error('권한을 선택해야 합니다.');
      return;
    }

    // 권한이 변경되지 않은 경우 처리하지 않음
    if (user.roles[0] === selectedRole) {
      message.info('권한이 변경되지 않았습니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      const request: RoleUpdateRequest = {
        roles: [selectedRole],
      };
      
      await updateUserRoles(user.id, request);
      message.success('사용자 권한이 성공적으로 변경되었습니다.');
      onRoleUpdated();
    } catch (error) {
      console.error('역할 업데이트 오류:', error);
      message.error('권한 변경 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-4">
      <div className="font-semibold mb-2">사용자 권한</div>
      <Space>
        <Select
          placeholder="권한 선택"
          style={{ width: 300 }}
          value={selectedRole}
          onChange={handleRoleChange}
          optionLabelProp="label"
        >
          <Option value="ADMIN" label="관리자">
            관리자 (ADMIN)
          </Option>
          <Option value="USER" label="일반 사용자">
            일반 사용자 (USER)
          </Option>
          <Option value="MANAGER" label="매니저">
            매니저 (MANAGER)
          </Option>
        </Select>
        <Button 
          type="primary" 
          onClick={showConfirm}
          loading={isSubmitting}
          disabled={!selectedRole}
        >
          권한 변경
        </Button>
      </Space>
    </div>
  );
};

export default UserRoleEditor;