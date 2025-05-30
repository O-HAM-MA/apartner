'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TiptapEditor from '@/components/editor/TiptapEditor';
import { components } from '@/lib/backend/apiV1/schema';
import client from '@/lib/backend/client';

type NoticeDetail = components['schemas']['NoticeReadResponseDto'] & {
  buildingId?: number | null;
};
type NoticeUpdateRequestDto =
  components['schemas']['NoticeUpdateRequestDto'] & {
    buildingId?: number | null;
  };
type Building = components['schemas']['BuildingResponseDto'];

export default function EditNoticePage({
  params,
}: {
  params: Promise<{ noticeId: string }>;
}) {
  const router = useRouter();
  const { noticeId } = use(params);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [buildingId, setBuildingId] = useState<number | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageIds, setCurrentImageIds] = useState<number[]>([]);
  const [currentFileIds, setCurrentFileIds] = useState<number[]>([]);

  // 아파트의 모든 동 정보 가져오기
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const response = await client.GET(
          '/api/v1/admin/apartments/{apartmentId}/buildings',
          {
            params: {
              path: { apartmentId: 1 }, // TODO: 실제 로그인한 관리자의 아파트 ID로 변경 필요
              query: {
                pageable: {
                  page: 0,
                  size: 100,
                },
              },
            },
          }
        );
        if (response.data && response.data.content) {
          setBuildings(response.data.content as Building[]);
        }
      } catch (error) {
        console.error('동 정보를 불러오는데 실패했습니다:', error);
      }
    };

    fetchBuildings();
  }, []);

  // 기존 공지사항 데이터 불러오기
  useEffect(() => {
    const fetchNoticeDetail = async () => {
      try {
        const response = await client.GET('/api/v1/admin/notices/{noticeId}', {
          params: { path: { noticeId: Number(noticeId) } },
        });
        const notice = response.data as NoticeDetail;
        setTitle(notice.title || '');
        setContent(notice.content || '');
        setBuildingId(notice.buildingId || null);

        // 기존 이미지와 파일 ID 설정 - undefined 필터링
        setCurrentImageIds(
          notice.imageUrls
            ?.map((img) => img.id)
            .filter((id): id is number => id !== undefined) || []
        );
        setCurrentFileIds(
          notice.fileUrls
            ?.map((file) => file.id)
            .filter((id): id is number => id !== undefined) || []
        );
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
        buildingId,
        imageIds: currentImageIds,
        fileIds: currentFileIds,
      };

      await client.PUT('/api/v1/admin/notices/{noticeId}/update', {
        params: { path: { noticeId: Number(noticeId) } },
        body: updateData,
      });

      router.push(`admin/notices/${noticeId}`);
    } catch (error) {
      alert('공지사항 수정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 미디어 ID 변경 핸들러
  const handleMediaIdsChange = (imageIds: number[], fileIds: number[]) => {
    setCurrentImageIds(imageIds);
    setCurrentFileIds(fileIds);
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="제목을 입력하세요"
              required
            />
          </div>

          <div>
            <label
              htmlFor="buildingId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              공지 대상 (동 선택)
            </label>
            <select
              id="buildingId"
              value={buildingId || ''}
              onChange={(e) =>
                setBuildingId(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">전체 공지</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.buildingNumber}동
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              특정 동을 선택하면 해당 동 거주자에게만 공지가 전달됩니다. 전체
              공지를 선택하면 모든 거주자에게 전송됩니다.
            </p>
          </div>

          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              내용
            </label>
            <TiptapEditor
              content={content}
              onChange={setContent}
              onMediaIdsChange={handleMediaIdsChange}
              noticeId={Number(noticeId)}
            />
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
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
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
