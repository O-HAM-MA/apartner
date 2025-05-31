'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TiptapEditor from '@/components/editor/TiptapEditor';
import { components } from '@/lib/backend/apiV1/schema';
import client from '@/lib/backend/client';

type NoticeDetail = components['schemas']['NoticeReadResponseDto'] & {
  buildingId?: number | null;
};

type NoticeUpdateRequestDto = components['schemas']['NoticeRequestDto'];
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
  roles: string[];
  gradeId: number | null;
  apartmentId: number;
}

interface MediaInfo {
  id: number;
  originalName: string;
  downloadUrl: string;
  size: number;
}

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
  const [isBuildingsLoading, setIsBuildingsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageIds, setCurrentImageIds] = useState<number[]>([]);
  const [currentFileIds, setCurrentFileIds] = useState<number[]>([]);
  const [currentImages, setCurrentImages] = useState<MediaInfo[]>([]);
  const [currentFiles, setCurrentFiles] = useState<MediaInfo[]>([]);
  const [apartmentId, setApartmentId] = useState<number | null>(null);

  // 관리자 정보 및 아파트 ID 가져오기
  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const response = await client.GET('/api/v1/admin/me');
        if (response.data) {
          setApartmentId(response.data.apartmentId);
        }
      } catch (error) {
        console.error('관리자 정보를 불러오는데 실패했습니다:', error);
        setError('관리자 정보를 불러오는데 실패했습니다.');
      }
    };

    fetchAdminInfo();
  }, []);

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
        // URL을 직접 구성하여 API 호출
        const response = await fetch(
          `/api/v1/admin/apartments/${apartmentId}/buildings?page=0&size=100&sort=buildingNumber,asc`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('건물 목록을 불러오는데 실패했습니다.');
        }

        const data = await response.json();
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

  // 기존 공지사항 데이터 불러오기
  useEffect(() => {
    const fetchNoticeDetail = async () => {
      try {
        const response = await client.GET('/api/v1/admin/notices/{noticeId}', {
          params: { path: { noticeId: Number(noticeId) } },
        });
        const notice = response.data as NoticeDetail;
        console.log('불러온 공지사항 데이터:', notice);

        setTitle(notice.title || '');

        // content와 이미지 처리
        let processedContent = notice.content || '';

        // 이미지 URL이 content에 없는 경우에만 추가
        if (notice.imageUrls && notice.imageUrls.length > 0) {
          const imageUrlsInContent = notice.imageUrls
            .filter((img) => img.downloadUrl)
            .map((img) => img.downloadUrl);

          // 깨진 이미지 아이콘을 실제 이미지로 대체
          const imgPlaceholderRegex = /<img[^>]*>/g;
          let imgIndex = 0;
          processedContent = processedContent.replace(
            imgPlaceholderRegex,
            () => {
              if (imgIndex < imageUrlsInContent.length) {
                const url = imageUrlsInContent[imgIndex];
                imgIndex++;
                return `<img src="${url}" />`;
              }
              return '';
            }
          );
        }

        console.log('최종 처리된 content:', processedContent);
        setContent(processedContent);

        setBuildingId(
          notice.buildingId && notice.buildingId > 0 ? notice.buildingId : null
        );

        // 기존 이미지와 파일 정보 설정
        if (notice.imageUrls && notice.imageUrls.length > 0) {
          console.log('원본 이미지 데이터:', notice.imageUrls);

          const images = notice.imageUrls
            .filter((img) => img.downloadUrl) // 다운로드 URL이 있는 이미지만 필터링
            .map((img) => ({
              id: img.id || 0,
              originalName: img.originalName || '',
              downloadUrl: img.downloadUrl,
              size: img.size || 0,
            })) as MediaInfo[];

          console.log('처리된 이미지 데이터:', images);
          setCurrentImages(images);
          setCurrentImageIds(images.map((img) => img.id));
        }

        if (notice.fileUrls && notice.fileUrls.length > 0) {
          console.log('원본 파일 데이터:', notice.fileUrls);

          const files = notice.fileUrls
            .filter((file) => file.downloadUrl) // 다운로드 URL이 있는 파일만 필터링
            .map((file) => ({
              id: file.id || 0,
              originalName: file.originalName || '',
              downloadUrl: file.downloadUrl,
              size: file.size || 0,
            })) as MediaInfo[];

          console.log('처리된 파일 데이터:', files);
          setCurrentFiles(files);
          setCurrentFileIds(files.map((file) => file.id));
        }
      } catch (error) {
        console.error('공지사항 불러오기 에러:', error);
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
        buildingId: buildingId || undefined,
        imageIds: currentImageIds,
        fileIds: currentFileIds,
      };

      await client.PUT('/api/v1/admin/notices/{noticeId}/update', {
        params: { path: { noticeId: Number(noticeId) } },
        body: updateData,
      });

      router.push(`/admin/notices/${noticeId}`);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow px-8 py-10">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
          >
            ← 목록으로
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            공지사항 수정
          </h1>
          <div /> {/* 오른쪽 공간 맞추기용 */}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
            >
              제목
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="제목을 입력하세요"
              required
            />
          </div>

          <div>
            <label
              htmlFor="buildingId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
            >
              공지 대상 (동 선택)
            </label>
            <select
              id="buildingId"
              value={buildingId || ''}
              onChange={(e) =>
                setBuildingId(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">전체 공지</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.buildingNumber}동
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              특정 동을 선택하면 해당 동 거주자에게만 공지가 전달됩니다. 전체
              공지를 선택하면 모든 거주자에게 전송됩니다.
            </p>
          </div>

          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
            >
              내용
            </label>
            <TiptapEditor
              content={content}
              onChange={setContent}
              onMediaIdsChange={handleMediaIdsChange}
              noticeId={Number(noticeId)}
              initialImages={currentImages}
              initialFiles={currentFiles}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
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
