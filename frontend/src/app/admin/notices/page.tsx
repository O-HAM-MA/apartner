'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { components } from '@/lib/backend/apiV1/schema';
import client from '@/lib/backend/client';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faFileAlt } from '@fortawesome/free-solid-svg-icons';

type NoticeSummary = components['schemas']['NoticeSummaryResponseDto'] & {
  hasImage?: boolean;
  hasFile?: boolean;
};

type Building = components['schemas']['BuildingResponseDto'];

export default function NoticeListPage() {
  const [notices, setNotices] = useState<NoticeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  // 건물 정보 조회
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const response = await fetch(
          `/api/v1/admin/apartments/1/buildings?page=0&size=100&sort=buildingNumber,asc`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        const data = await response.json();
        if (data && data.content) {
          setBuildings(data.content as Building[]);
        }
      } catch (error) {
        console.error('동 정보를 불러오는데 실패했습니다:', error);
      }
    };

    fetchBuildings();
  }, []);

  // 게시글 목록 조회
  useEffect(() => {
    const fetchNotices = async () => {
      setIsLoading(true);
      try {
        const response = await client.GET('/api/v1/admin/notices', {
          params: {
            query: {
              page: currentPage,
              size: 10,
              sort: 'createdAt,desc',
              buildingId:
                selectedTarget === 'all' ? undefined : Number(selectedTarget),
            },
          },
        });
        if (response.data?.content) {
          const mappedNotices = response.data.content.map((notice: any) => ({
            ...notice,
            buildingNumber: notice.building?.buildingNumber || null,
          }));
          setNotices(mappedNotices);
          setTotalPages(response.data.totalPages || 1);
        } else {
          setNotices([]);
          setTotalPages(1);
        }
      } catch (err) {
        setError('공지사항 목록을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotices();
  }, [currentPage, selectedTarget]);

  const handleSearch = () => {
    setCurrentPage(0);
    // fetchNotices(); // useEffect로 자동 호출됨
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">공지사항</h1>
        <Link href="/admin/notices/new">
          <button className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors">
            글 작성
          </button>
        </Link>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="검색어를 입력하세요"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 flex-1"
        />
        <button
          onClick={handleSearch}
          className="bg-gray-100 border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-200"
        >
          검색
        </button>
        <select
          value={selectedTarget}
          onChange={(e) => {
            setSelectedTarget(e.target.value);
            setCurrentPage(0);
          }}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="all">전체 대상</option>
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.buildingNumber}동
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-center">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 w-20">번호</th>
              <th className="px-6 py-3 w-[400px]">제목</th>
              <th className="px-6 py-3 w-36">작성자</th>
              <th className="px-6 py-3 w-28">대상</th>
              <th className="px-6 py-3 w-36">작성일</th>
              <th className="px-6 py-3 w-28">조회수</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-8">
                  로딩 중...
                </td>
              </tr>
            ) : notices.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8">
                  등록된 공지사항이 없습니다.
                </td>
              </tr>
            ) : (
              notices.map((notice, idx) => (
                <tr key={notice.noticeId} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{currentPage * 10 + idx + 1}</td>
                  <td className="px-6 py-4 text-left truncate">
                    <Link
                      href={`/admin/notices/${notice.noticeId}`}
                      className="text-blue-600 hover:underline cursor-pointer inline-flex items-center gap-2"
                    >
                      {notice.title}
                      <span className="flex gap-1 text-gray-500">
                        {notice.hasImage && (
                          <FontAwesomeIcon
                            icon={faImage}
                            className="w-4 h-4"
                            title="이미지 첨부"
                          />
                        )}
                        {notice.hasFile && (
                          <FontAwesomeIcon
                            icon={faFileAlt}
                            className="w-4 h-4"
                            title="파일 첨부"
                          />
                        )}
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4">{notice.authorName}</td>
                  <td className="px-6 py-4">
                    {notice.buildingId
                      ? `${
                          buildings.find((b) => b.id === notice.buildingId)
                            ?.buildingNumber
                        }동`
                      : '전체 공지'}
                  </td>
                  <td className="px-6 py-4">
                    {notice.createdAt
                      ? new Date(notice.createdAt).toISOString().slice(0, 10)
                      : ''}
                  </td>
                  <td className="px-6 py-4">{notice.viewCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* 페이지네이션 */}
      <div className="flex justify-center items-center gap-2 mt-6">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
          disabled={currentPage === 0}
          className="px-3 py-1 rounded bg-gray-100 border border-gray-300 disabled:opacity-50"
        >
          이전
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`px-3 py-1 rounded border ${
              currentPage === i
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 border-gray-300'
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))
          }
          disabled={currentPage === totalPages - 1}
          className="px-3 py-1 rounded bg-gray-100 border border-gray-300 disabled:opacity-50"
        >
          다음
        </button>
      </div>
    </div>
  );
}
