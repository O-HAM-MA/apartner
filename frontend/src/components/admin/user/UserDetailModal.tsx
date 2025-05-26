import React, { useState, useEffect } from "react";
import {
  Modal,
  Tabs,
  Descriptions,
  Badge,
  Spin,
  message,
  Select,
  Tag,
  Button,
  Space,
} from "antd";
import { UserDetail, UserStatus, UserStatusDisplay } from "@/types/user";
import { getAdminUserDetail, updateUserStatus } from "@/utils/userApi";
import dayjs from "dayjs";
import UserLogs from "./UserLogs";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  MinusCircleFilled,
  QuestionCircleOutlined,
} from "@ant-design/icons";

const { Option } = Select;
const { useMessage } = message;

interface UserDetailModalProps {
  userId: number | null;
  open: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  userId,
  open,
  onClose,
  onUserUpdated,
}) => {
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | null>(null);
  const [activeTab, setActiveTab] = useState("1");
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [messageApi, contextHolder] = useMessage();

  useEffect(() => {
    if (open && userId) {
      fetchUserDetail();
    } else {
      setUserDetail(null);
      setSelectedStatus(null);
    }
  }, [open, userId]);

  useEffect(() => {
    setActiveTab("1");
  }, [userId]);

  const fetchUserDetail = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await getAdminUserDetail(userId);
      setUserDetail(response);
      setSelectedStatus(response.status);
    } catch (error) {
      console.error("사용자 상세 정보 조회 중 오류 발생:", error);
      messageApi.error("사용자 정보를 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status: UserStatus) => {
    setSelectedStatus(status);
  };

  const showConfirmModal = () => {
    if (
      !userId ||
      !userDetail ||
      !selectedStatus ||
      selectedStatus === userDetail.status
    )
      return;

    setConfirmModalVisible(true);
  };

  const handleConfirmCancel = () => {
    setConfirmModalVisible(false);
  };

  const handleConfirmOk = async () => {
    if (!userId || !selectedStatus) return;

    try {
      setStatusUpdating(true);
      await updateUserStatus(userId, { status: selectedStatus });

      messageApi.success("사용자 상태가 변경되었습니다");
      setConfirmModalVisible(false);
      fetchUserDetail();
      onUserUpdated();
    } catch (error) {
      console.error("사용자 상태 업데이트 중 오류 발생:", error);
      messageApi.error("상태 변경 중 오류가 발생했습니다");
    } finally {
      setStatusUpdating(false);
    }
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

  const getRoleTag = (role: string) => {
    const roleColorMap: Record<string, string> = {
      ADMIN: "red",
      MANAGER: "orange",
      USER: "blue",
    };

    return <Tag color={roleColorMap[role] || "default"}>{role}</Tag>;
  };

  const tabItems = [
    {
      key: "1",
      label: "기본 정보",
      children: userDetail ? (
        <>
          <Descriptions bordered column={2} size="small" className="mb-6">
            <Descriptions.Item label="이름" span={2}>
              {userDetail.userName}
            </Descriptions.Item>
            <Descriptions.Item label="이메일" span={2}>
              {userDetail.email}
            </Descriptions.Item>
            <Descriptions.Item label="핸드폰 번호">
              {userDetail.phoneNum}
            </Descriptions.Item>
            <Descriptions.Item label="가입 방식">
              {userDetail.socialProvider
                ? `소셜 로그인 (${userDetail.socialProvider})`
                : "일반 가입"}
            </Descriptions.Item>
            <Descriptions.Item label="아파트">
              {userDetail.apartmentName || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="동/호수">
              {userDetail.buildingNumber && userDetail.unitNumber
                ? `${userDetail.buildingNumber}동 ${userDetail.unitNumber}호`
                : userDetail.buildingNumber
                ? `${userDetail.buildingNumber}동`
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="권한" span={2}>
              {userDetail.roles.map((role) => (
                <span key={role} style={{ marginRight: 5 }}>
                  {getRoleTag(role)}
                </span>
              ))}
            </Descriptions.Item>
            <Descriptions.Item label="상태" span={2}>
              <div className="flex items-center">
                {getStatusBadge(userDetail.status)}
                <span className="mx-2">→</span>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Select
                    value={selectedStatus}
                    style={{ width: 120 }}
                    onChange={handleStatusChange}
                    disabled={statusUpdating}
                  >
                    <Option value={UserStatus.ACTIVE}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <CheckCircleFilled style={{ color: "green" }} />
                        <span style={{ marginLeft: 5 }}>
                          {getStatusText(UserStatus.ACTIVE)}
                        </span>
                      </div>
                    </Option>
                    <Option value={UserStatus.INACTIVE}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <MinusCircleFilled style={{ color: "gray" }} />
                        <span style={{ marginLeft: 5 }}>
                          {getStatusText(UserStatus.INACTIVE)}
                        </span>
                      </div>
                    </Option>
                    <Option value={UserStatus.PENDING}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <CloseCircleFilled style={{ color: "orange" }} />
                        <span style={{ marginLeft: 5 }}>
                          {getStatusText(UserStatus.PENDING)}
                        </span>
                      </div>
                    </Option>
                    {userDetail.status === UserStatus.WITHDRAWN && (
                      <Option value={UserStatus.WITHDRAWN}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <ExclamationCircleFilled style={{ color: "red" }} />
                          <span style={{ marginLeft: 5 }}>
                            {getStatusText(UserStatus.WITHDRAWN)}
                          </span>
                        </div>
                      </Option>
                    )}
                  </Select>
                  <Button
                    type="primary"
                    size="small"
                    onClick={showConfirmModal}
                    loading={statusUpdating}
                    disabled={selectedStatus === userDetail.status}
                    style={{ marginLeft: "8px" }}
                  >
                    변경
                  </Button>
                </div>
              </div>
            </Descriptions.Item>
            {userDetail.status === UserStatus.WITHDRAWN && (
              <Descriptions.Item label="탈퇴 사유" span={2}>
                {userDetail.leaveReason || "(입력된 사유 없음)"}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="가입 일시">
              {userDetail.createdAt
                ? dayjs(userDetail.createdAt).format("YYYY-MM-DD HH:mm:ss")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="수정 일시">
              {userDetail.modifiedAt
                ? dayjs(userDetail.modifiedAt).format("YYYY-MM-DD HH:mm:ss")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="최근 로그인">
              {userDetail.lastLoginAt
                ? dayjs(userDetail.lastLoginAt).format("YYYY-MM-DD HH:mm:ss")
                : "-"}
            </Descriptions.Item>
            {userDetail.status === UserStatus.WITHDRAWN && (
              <Descriptions.Item label="탈퇴 일시" span={2}>
                {userDetail.deletedAt
                  ? dayjs(userDetail.deletedAt).format("YYYY-MM-DD HH:mm:ss")
                  : "-"}
              </Descriptions.Item>
            )}
          </Descriptions>
        </>
      ) : null,
    },
    {
      key: "2",
      label: "활동 로그",
      children: userDetail ? <UserLogs userId={userDetail.id} /> : null,
    },
  ];

  return (
    <>
      {contextHolder}
      <Modal
        title="사용자 상세 정보"
        open={open}
        onCancel={onClose}
        width={800}
        footer={null}
        destroyOnHidden={true}
        maskClosable={true}
      >
        <Spin spinning={loading}>
          {userDetail ? (
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
            />
          ) : (
            <div className="py-8 text-center text-gray-500">
              {loading
                ? "사용자 정보를 불러오는 중..."
                : "사용자 정보가 없습니다"}
            </div>
          )}
        </Spin>
      </Modal>

      {/* 상태 변경 확인 모달 */}
      <Modal
        title="사용자 상태 변경"
        open={confirmModalVisible}
        onCancel={handleConfirmCancel}
        footer={[
          <Button key="cancel" onClick={handleConfirmCancel}>
            취소
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={statusUpdating}
            onClick={handleConfirmOk}
          >
            변경
          </Button>,
        ]}
        destroyOnHidden={true}
      >
        <div className="flex items-center mb-4">
          <QuestionCircleOutlined
            style={{ color: "#faad14", fontSize: "22px", marginRight: "8px" }}
          />
          <span>
            사용자 상태를 {userDetail && getStatusText(userDetail.status)}에서{" "}
            {selectedStatus && getStatusText(selectedStatus)}로
            변경하시겠습니까?
          </span>
        </div>
      </Modal>
    </>
  );
};

export default UserDetailModal;
