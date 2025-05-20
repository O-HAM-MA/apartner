'use client';

import { use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { components } from '@/lib/backend/apiV1/schema';
import client from '@/lib/backend/client';

type NoticeDetail = components['schemas']['NoticeReadResponseDto'];

export default function NoticeDetailPage({
  params,
}: {
  params: Promise<{ noticeId: string }>;
}) {
  const router = useRouter();
  const { noticeId } = use(params);

  const [notice, setNotice] = useState<NoticeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNoticeDetail = async () => {
      try {
        const response = await client.GET('/api/v1/notices/{noticeId}', {
          params: { path: { noticeId: Number(noticeId) } },
        });
        setNotice(response.data as NoticeDetail);
      } catch (error) {
        console.error('공지사항 불러오기 실패:', error);
        setError('공지사항을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNoticeDetail();
  }, [noticeId]);

  const handleEdit = () => {
    router.push(`/notice/${noticeId}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await client.DELETE('/api/v1/notices/{noticeId}', {
        params: { path: { noticeId: Number(noticeId) } },
      });

      alert('공지사항이 성공적으로 삭제되었습니다.');
      router.push('/notice');
    } catch (error) {
      console.error('공지사항 삭제 실패:', error);
      alert('공지사항 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  if (isLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-8">로딩 중...</div>;
  }

  if (!notice) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        공지사항을 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <button
          onClick={() => router.push('/notice')}
          className="text-gray-600 hover:text-gray-800"
        >
          ← 목록으로
        </button>
        <div className="space-x-2">
          <button
            onClick={handleEdit}
            className="px-4 py-2 text-blue-600 hover:text-blue-800"
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-red-600 hover:text-red-800"
          >
            삭제
          </button>
        </div>
      </div>

      <article className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">{notice.title}</h1>

          <div className="flex items-center text-gray-600 text-sm mb-6">
            <span className="mr-4">작성자: {notice.authorName}</span>
            <span className="mr-4">
              작성일:{' '}
              {notice.createdAt
                ? new Date(notice.createdAt).toLocaleDateString()
                : ''}
            </span>
            <span>조회수: {notice.viewCount}</span>
          </div>

          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{
              __html: notice.content ?? '',
            }}
          />

          {notice.fileUrls && notice.fileUrls.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-medium mb-2">첨부파일</h3>
              <ul className="space-y-2">
                {notice.fileUrls.map((file) => (
                  <li key={file.downloadUrl}>
                    <a
                      href={file.downloadUrl}
                      download={file.originalName}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {file.originalName}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
