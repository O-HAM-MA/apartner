'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { components } from '@/lib/backend/apiV1/schema';
import client from '@/lib/backend/client';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

type NoticeSummary = components['schemas']['NoticeSummaryResponseDto'] & {
  hasImage?: boolean;
  hasFile?: boolean;
};

type Building = components['schemas']['BuildingResponseDto'];

interface MeDto {
  id: number;
  userName: string;
  email: string;
  phoneNum: string;
  createdAt: string;
  modifiedAt: string;
  profileImageUrl: string | null;
  apartmentName: string;
  buildingName: string;
  unitNumber: string;
  socialProvider: string | null;
  zipcode: string;
  address: string;
  apartmentId: number;
}

export default function NoticeListPage() {
  const [notices, setNotices] = useState<NoticeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuildingsLoading, setIsBuildingsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [apartmentId, setApartmentId] = useState<number | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // 관리자 정보 조회
  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const { data, error } = await client.GET('/api/v1/auth/me');

        if (error) {
          setError('관리자 정보를 불러오는데 실패했습니다.');
          return;
        }

        const adminInfo = data as unknown as MeDto;

        if (adminInfo?.apartmentId) {
          setApartmentId(adminInfo.apartmentId);
        } else {
          setApartmentId(null);
          setError('아파트 정보를 불러오는데 실패했습니다.');
        }
      } catch (error) {
        setError('관리자 정보를 불러오는데 실패했습니다.');
      }
    };

    fetchAdminInfo();
  }, []);

  // 건물 정보 조회
  useEffect(() => {
    if (!apartmentId) {
      return;
    }

    const fetchBuildings = async () => {
      setIsBuildingsLoading(true);
      try {
        const { data } = await client.GET(
          '/api/v1/admin/apartments/{apartmentId}/buildings',
          {
            params: {
              path: { apartmentId },
              query: {
                page: 0,
                size: 100,
                sort: 'buildingNumber,asc',
              },
            },
          }
        );

        console.log('건물 목록 API 응답:', data);

        if (data?.content) {
          const buildingList = data.content;
          console.log('설정할 건물 목록:', buildingList);
          setBuildings(buildingList);
        } else {
          console.error('건물 목록이 비어있음:', data);
          setError('건물 목록을 불러오는데 실패했습니다.');
        }
      } catch (error) {
        console.error('동 정보 조회 에러:', error);
        setError('동 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsBuildingsLoading(false);
      }
    };

    fetchBuildings();
  }, [apartmentId]);

  // 건물 번호 표시 로직
  const getBuildingNumber = (buildingId: number | null | undefined) => {
    if (!buildingId) {
      return '전체 공지';
    }

    const building = buildings.find((b) => Number(b.id) === Number(buildingId));
    return building ? `${building.buildingNumber}동` : 'undefined';
  };

  // 건물 선택 옵션 렌더링
  const renderBuildingOptions = () => {
    return (
      <>
        <option value="all">전체 대상</option>
        {buildings.map((building) => (
          <option key={building.id} value={building.id}>
            {building.buildingNumber}동
          </option>
        ))}
      </>
    );
  };

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
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>공지사항</CardTitle>
          <Link href="/admin/notices/new">
            <button className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors">
              글 작성
            </button>
          </Link>
        </CardHeader>
        <CardContent>
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
                {notices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8">
                      등록된 공지사항이 없습니다.
                    </td>
                  </tr>
                ) : (
                  notices.map((notice, idx) => (
                    <tr
                      key={notice.noticeId}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        {currentPage * 10 + idx + 1}
                      </td>
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
                                icon={faPaperclip}
                                className="w-4 h-4"
                                title="파일 첨부"
                              />
                            )}
                          </span>
                        </Link>
                      </td>
                      <td className="px-6 py-4">{notice.authorName}</td>
                      <td className="px-6 py-4">
                        {getBuildingNumber(notice.buildingId)}
                      </td>
                      <td className="px-6 py-4">
                        {notice.createdAt
                          ? new Date(notice.createdAt)
                              .toISOString()
                              .slice(0, 10)
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
        </CardContent>
      </Card>
    </div>
  );
}
