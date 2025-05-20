'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TiptapEditor from '@/components/editor/TiptapEditor';
import { components } from '@/lib/backend/apiV1/schema';
import client from '@/lib/backend/client';

type NoticeDetail = components['schemas']['NoticeReadResponseDto'];
type NoticeUpdateRequestDto = components['schemas']['NoticeUpdateRequestDto'];

export default function EditNoticePage({
  params,
}: {
  params: Promise<{ noticeId: string }>;
}) {
  const router = useRouter();
  const { noticeId } = use(params);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 기존 공지사항 데이터 불러오기
  useEffect(() => {
    const fetchNoticeDetail = async () => {
      try {
        const response = await client.GET('/api/v1/notices/{noticeId}', {
          params: { path: { noticeId: Number(noticeId) } },
        });
        const notice = response.data as NoticeDetail;
        setTitle(notice.title || '');
        setContent(notice.content || '');
      } catch (error) {
        setError('공지사항을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNoticeDetail();
  }, [noticeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updateData: NoticeUpdateRequestDto = {
        title,
        content,
        imageIds: [], // 이미지 ID 배열
        fileIds: [], // 파일 ID 배열
      };

      await client.PUT('/api/v1/notices/{noticeId}/update', {
        params: { path: { noticeId: Number(noticeId) } },
        body: updateData,
      });

      router.push(`/notice/${noticeId}`);
    } catch (error) {
      console.error('공지사항 수정 실패:', error);
      alert('공지사항 수정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-8">로딩 중...</div>;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-red-600">{error}</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow px-8 py-10">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-800"
          >
            ← 목록으로
          </button>
          <h1 className="text-2xl font-bold">공지사항 수정</h1>
          <div /> {/* 오른쪽 공간 맞추기용 */}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              제목
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="제목을 입력하세요"
              required
            />
          </div>

          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              내용
            </label>
            <TiptapEditor content={content} onChange={setContent} />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? '수정 중...' : '수정하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
