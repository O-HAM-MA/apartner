'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, ChevronDown, Loader2, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import client from '@/lib/backend/client';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Notice {
  noticeId: number;
  title: string;
  authorName: string;
  createdAt: string;
  viewCount: number;
}

export default function NoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    async function fetchNotices() {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await client.GET('/api/v1/notices/user/list', {
          params: {
            query: {
              page: 0,
              size: 100,
              sort: 'noticeId,asc',
            },
          },
        });

        if (error) throw new Error('서버에서 데이터를 불러오지 못했습니다.');
        if (data?.content) {
          const formattedNotices: Notice[] = data.content.map((notice) => ({
            noticeId: notice.noticeId || 0,
            title: notice.title || '',
            authorName: notice.authorName || '',
            createdAt: notice.createdAt || '',
            viewCount: notice.viewCount || 0,
          }));
          setNotices(formattedNotices);
        }
      } catch (e: any) {
        setError(e.message || '알 수 없는 에러가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchNotices();
  }, []);

  const filteredNotices = notices.filter((notice) =>
    notice.title.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const formatDateTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return format(date, 'yyyy-MM-dd', { locale: ko });
    } catch {
      return dateTimeStr;
    }
  };

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 p-6 pt-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">공지사항</h1>
          <p className="text-muted-foreground mt-2">
            아파트 주민들을 위한 중요 공지사항을 확인하세요.
          </p>
        </div>

        {/* 검색 및 필터 영역 */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center rounded-md border border-border bg-card shadow-sm">
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-foreground">
                전체 공지
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="공지사항 검색"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full rounded-md border border-border bg-card pl-9 md:w-[240px] text-foreground"
              />
            </div>
          </div>
        </div>

        {/* 공지사항 목록 */}
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="text-center py-10 text-muted-foreground">
                <Loader2 className="w-6 h-6 text-pink-500 animate-spin mx-auto mb-2" />
                로딩 중...
              </div>
            ) : error ? (
              <div className="text-center py-10 text-red-500">{error}</div>
            ) : filteredNotices.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="px-4 py-3 text-left">번호</th>
                    <th className="px-4 py-3 text-left">제목</th>
                    <th className="px-4 py-3 text-center">작성자</th>
                    <th className="px-4 py-3 text-center">작성일</th>
                    <th className="px-4 py-3 text-center">조회수</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotices.map((notice, index) => (
                    <tr
                      key={notice.noticeId}
                      className="border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() =>
                        router.push(`/udash/notices/${notice.noticeId}`)
                      }
                    >
                      <td className="px-4 py-3 text-left font-medium">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-left">
                        <div className="flex items-center">
                          <span className="text-pink-500 hover:underline">
                            {notice.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {notice.authorName}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {formatDateTime(notice.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {notice.viewCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-10">
                <BellRing className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">등록된 공지사항이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
