"use client";

import { useState, useEffect } from "react";

interface AddressSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (address: {
    id: number;
    name: string;
    address: string;
    zipcode: string;
  }) => void;
}

export default function AddressSearch({
  isOpen,
  onClose,
  onSelectAddress,
}: AddressSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: number; name: string; address: string; zipcode: string }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(
        `${baseUrl}/api/v1/apartments?name=${encodeURIComponent(
          searchTerm
        )}&address=${encodeURIComponent(searchTerm)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error("주소 검색 실패:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            주소 찾기
          </h3>
        </div>

        <div className="p-4">
          <div className="flex mb-4">
            <input
              type="text"
              className="flex-grow rounded-l-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="도로명 또는 아파트 이름을 입력하세요"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r-md"
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? "검색중..." : "검색"}
            </button>
          </div>

          <div className="h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded">
            {!hasSearched ? (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                도로명 또는 아파트 이름을 검색해주세요
              </div>
            ) : isSearching ? (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                검색 중...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                검색 결과가 없습니다
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {searchResults.map((result) => (
                  <li
                    key={result.id}
                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => {
                      onSelectAddress(result);
                      onClose();
                    }}
                  >
                    <p className="font-bold text-gray-900 dark:text-white">
                      ({result.zipcode}) {result.address}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {result.name}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white rounded-md"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
