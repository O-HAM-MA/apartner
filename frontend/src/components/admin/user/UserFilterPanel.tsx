import React, { useState } from "react";
import { Button, Input, Space, Select } from "antd";
import {
  SearchOutlined,
  // FilterOutlined,
  DownloadOutlined,
  ClearOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import UserFilterModal from "./UserFilterModal";

const { Option } = Select;

interface FilterValues {
  searchTerm: string;
  searchField: string;
}

interface UserFilterPanelProps {
  onSearch: (searchTerm: string, searchField: string) => void;
  onExport: (format: "csv" | "excel") => void;
  onFilterApply: (values: FilterValues) => void;
  onReset?: () => void; // 초기화 핸들러 추가
}

const UserFilterPanel: React.FC<UserFilterPanelProps> = ({
  onSearch,
  onExport,
  onFilterApply,
  onReset,
}) => {
  const [quickSearchTerm, setQuickSearchTerm] = useState<string>("");
  const [quickSearchField, setQuickSearchField] = useState<string>("all");
  const [filterModalVisible, setFilterModalVisible] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<FilterValues>({
    searchTerm: "",
    searchField: "all",
  });

  // 빠른 검색
  const handleQuickSearch = () => {
    // 현재 선택된 필드와 검색어로 activeFilters 업데이트
    const newFilters = {
      searchTerm: quickSearchTerm,
      searchField: quickSearchField,
    };

    setActiveFilters(newFilters);

    // 상위 컴포넌트에 필터 적용 전달
    onFilterApply(newFilters);

    // 검색 이벤트도 발생시켜 검색 가능하도록 함
    onSearch(quickSearchTerm, quickSearchField);
  };

  // 검색어 초기화
  const handleClearSearch = () => {
    setQuickSearchTerm("");

    if (activeFilters.searchTerm) {
      const newFilters = {
        searchTerm: "",
        searchField: activeFilters.searchField,
      };

      setActiveFilters(newFilters);
      onFilterApply(newFilters);
    }
  };

  // 모든 필터 초기화
  const handleResetFilters = () => {
    const initialFilters = {
      searchTerm: "",
      searchField: "all",
    };

    // 상태 초기화
    setQuickSearchTerm("");
    setQuickSearchField("all");
    setActiveFilters(initialFilters);

    // 상위 컴포넌트에 초기화된 필터 전달
    onFilterApply(initialFilters);

    // 상위 컴포넌트의 초기화 핸들러 호출 (존재하는 경우)
    if (onReset) {
      onReset();
    }
  };

  // 필터 모달 열기
  const showFilterModal = () => {
    setFilterModalVisible(true);
  };

  // 필터 적용
  const handleApplyFilter = (values: FilterValues) => {
    setActiveFilters(values);
    setQuickSearchTerm(values.searchTerm || "");
    setQuickSearchField(values.searchField || "all");

    // 상위 컴포넌트에 필터 값 전달
    onFilterApply(values);
  };

  // 활성화된 필터 개수 표시
  const getActiveFiltersCount = (): number => {
    let count = 0;
    if (activeFilters.searchTerm) count++;
    return count;
  };

  const activeFilterCount = getActiveFiltersCount();

  return (
    <div className="bg-white p-4 mb-4 rounded shadow">
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <div className="flex flex-wrap items-center gap-4">
          {/* 검색 필드 선택 */}
          <Select
            value={quickSearchField}
            onChange={setQuickSearchField}
            style={{ width: 140 }}
            className="flex-shrink-0"
          >
            <Option value="all">전체 검색</Option>
            <Option value="userName">이름</Option>
            <Option value="email">이메일</Option>
            <Option value="apartmentName">아파트</Option>
          </Select>

          {/* 검색어 입력 */}
          <div className="flex-grow min-w-[200px] relative">
            <Input
              placeholder="검색어 입력"
              value={quickSearchTerm}
              onChange={(e) => setQuickSearchTerm(e.target.value)}
              prefix={<SearchOutlined />}
              onPressEnter={(e) => {
                e.preventDefault(); // 기본 동작 방지
                handleQuickSearch(); // 검색 실행
              }}
              suffix={
                quickSearchTerm && (
                  <Button
                    type="text"
                    size="small"
                    icon={<ClearOutlined />}
                    onClick={handleClearSearch}
                  />
                )
              }
            />
          </div>

          <Button
            onClick={handleQuickSearch}
            icon={<SearchOutlined />}
            type="primary"
          >
            검색
          </Button>

          {/* <Button 
            onClick={showFilterModal} 
            icon={<FilterOutlined />}
          >
            상세 필터
            {activeFilterCount > 0 && (
              <span className="ml-2 bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs font-medium">
                {activeFilterCount}
              </span>
            )}
          </Button> */}

          {/* 필터 초기화 버튼 추가 */}
          <Button
            onClick={handleResetFilters}
            icon={<ReloadOutlined />}
            disabled={activeFilterCount === 0 && quickSearchTerm === ""}
          >
            초기화
          </Button>
        </div>

        <div className="flex justify-end">
          <Space>
            <Button onClick={() => onExport("csv")} icon={<DownloadOutlined />}>
              CSV 내보내기
            </Button>
            <Button
              onClick={() => onExport("excel")}
              icon={<DownloadOutlined />}
            >
              Excel 내보내기
            </Button>
          </Space>
        </div>
      </Space>

      {/* 필터 모달 */}
      <UserFilterModal
        open={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApplyFilter={handleApplyFilter}
        initialValues={activeFilters}
      />
    </div>
  );
};

export default UserFilterPanel;
