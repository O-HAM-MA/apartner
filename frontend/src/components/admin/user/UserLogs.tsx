import React, { useState, useEffect } from "react";
import { Table, Select, Typography, Tag, Pagination } from "antd";
import { getUserLogs } from "@/utils/userApi";
import { UserLog, LogType } from "@/types/user";
import dayjs from "dayjs";

const { Option } = Select;
const { Text } = Typography;

interface UserLogsProps {
  userId: number;
}

const UserLogs: React.FC<UserLogsProps> = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [logType, setLogType] = useState<string | undefined>(undefined);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchLogs();
  }, [userId, logType, page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await getUserLogs(userId, logType, page, pageSize);
      setLogs(response.content);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error("Error fetching user logs:", error);
    } finally {
      setLoading(false);
    }
  };

  // 로그 타입에 따른 색상 표시
  const getLogTypeTag = (type: LogType) => {
    const typeColors: Record<string, string> = {
      [LogType.LOGIN]: "green",
      [LogType.LOGIN_FAILED]: "red",
      [LogType.LOGOUT]: "blue",
      [LogType.STATUS_CHANGE]: "orange",
      [LogType.PASSWORD_CHANGE]: "cyan",
    };
    return (
      <Tag color={typeColors[type] || "default"}>{type.replace("_", " ")}</Tag>
    );
  };

  // 로그 타입 필터 변경 핸들러
  const handleLogTypeChange = (value: string | undefined) => {
    setLogType(value);
    setPage(0); // 필터 변경시 첫 페이지로 이동
  };

  const columns = [
    {
      title: "로그 타입",
      dataIndex: "logType",
      key: "logType",
      render: (type: LogType) => getLogTypeTag(type),
      width: 140,
    },
    {
      title: "설명",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "IP 주소",
      dataIndex: "ipAddress",
      key: "ipAddress",
      width: 130,
    },
    {
      title: "시간",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170,
      render: (date: string) => dayjs(date).format("YYYY-MM-DD HH:mm:ss"),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Typography.Title level={5} className="m-0">
          사용자 활동 기록
        </Typography.Title>
        <Select
          placeholder="로그 타입 필터"
          style={{ width: 180 }}
          allowClear
          value={logType}
          onChange={handleLogTypeChange}
        >
          <Option value={LogType.LOGIN}>로그인</Option>
          <Option value={LogType.LOGIN_FAILED}>로그인 실패</Option>
          <Option value={LogType.LOGOUT}>로그아웃</Option>
          <Option value={LogType.STATUS_CHANGE}>상태 변경</Option>
          <Option value={LogType.PASSWORD_CHANGE}>비밀번호 변경</Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        pagination={false}
        loading={loading}
        size="small"
        expandable={{
          expandedRowRender: (record) => {
            try {
              const details = record.details ? JSON.parse(record.details) : {};
              return (
                <div className="p-3 bg-gray-50">
                  {Object.entries(details).map(([key, value]) => (
                    <div key={key} className="mb-1">
                      <Text strong>{key}: </Text>
                      <Text>{String(value)}</Text>
                    </div>
                  ))}
                </div>
              );
            } catch (e) {
              return <Text type="secondary">상세 정보 없음</Text>;
            }
          },
        }}
      />

      <div className="mt-4 flex justify-center">
        <Pagination
          current={page + 1}
          pageSize={pageSize}
          total={totalElements}
          onChange={(p) => setPage(p - 1)}
          showSizeChanger={false}
        />
      </div>
    </div>
  );
};

export default UserLogs;
