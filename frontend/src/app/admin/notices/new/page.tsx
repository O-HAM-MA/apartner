'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TiptapEditor from '@/components/editor/TiptapEditor';
import { components } from '@/lib/backend/apiV1/schema';
import { useToast } from '@/components/ui/use-toast';
import client from '@/lib/backend/client';

type NoticeCreateRequestDto = components['schemas']['NoticeRequestDto'];
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

export default function CreateNoticePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [buildingId, setBuildingId] = useState<number | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageIds, setImageIds] = useState<number[]>([]);
  const [fileIds, setFileIds] = useState<number[]>([]);
  const [apartmentId, setApartmentId] = useState<number | null>(null);
  const [apartmentName, setApartmentName] = useState<string>('');
  const [isBuildingsLoading, setIsBuildingsLoading] = useState(false);

  // 관리자 정보 조회
  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const { data, error } = await client.GET('/api/v1/auth/me');

        if (error) {
          toast({
            variant: 'destructive',
            title: '오류',
            description: '관리자 정보를 불러오는데 실패했습니다.',
          });
          return;
        }

        const adminInfo = data as unknown as MeDto;
        console.log('관리자 정보:', adminInfo);

        if (adminInfo?.apartmentId && adminInfo?.apartmentName) {
          setApartmentId(adminInfo.apartmentId);
          setApartmentName(adminInfo.apartmentName);
        } else {
          setApartmentId(null);
          setApartmentName('');
          toast({
            variant: 'destructive',
            title: '오류',
            description: '아파트 정보를 불러오는데 실패했습니다.',
          });
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: '오류',
          description: '관리자 정보를 불러오는데 실패했습니다.',
        });
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
      if (isBuildingsLoading) return;

      setIsBuildingsLoading(true);
      try {
        console.log('건물 목록 조회 시작 - apartmentId:', apartmentId);

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
          toast({
            variant: 'destructive',
            title: '오류',
            description: '건물 목록을 불러오는데 실패했습니다.',
          });
        }
      } catch (error) {
        console.error('동 정보 조회 에러:', error);
        toast({
          variant: 'destructive',
          title: '오류',
          description: '동 정보를 불러오는데 실패했습니다.',
        });
      } finally {
        setIsBuildingsLoading(false);
      }
    };

    fetchBuildings();
  }, [apartmentId]);

  useEffect(() => {
    if (!isSubmitting) return;

    const createPost = async () => {
      try {
        const noticeCreateData: NoticeCreateRequestDto = {
          title,
          content,
          buildingId: buildingId || undefined,
          imageIds,
          fileIds,
        };

        const response = await fetch('/api/v1/admin/notices/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(noticeCreateData),
        });

        if (!response.ok) {
          throw new Error('공지사항 작성에 실패했습니다.');
        }

        const data = await response.json();

        toast({
          title: '성공',
          description: '공지사항이 성공적으로 등록되었습니다.',
        });

        if (data && typeof data === 'object' && 'noticeId' in data) {
          router.push(`/admin/notices/${data.noticeId}`);
        } else {
          router.push('/admin/notices');
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: '오류',
          description: '공지사항 작성에 실패했습니다. 다시 시도해주세요.',
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    createPost();
  }, [
    isSubmitting,
    title,
    content,
    buildingId,
    router,
    imageIds,
    fileIds,
    toast,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
  };

  const handleImageUploadSuccess = (imageId: number) => {
    setImageIds((prev) => [...prev, imageId]);
  };

  const handleFileUploadSuccess = (fileId: number) => {
    setFileIds((prev) => [...prev, fileId]);
  };

  const handleImageDelete = (imageId: number) => {
    setImageIds((prev) => prev.filter((id) => id !== imageId));
  };

  const handleFileDelete = (fileId: number) => {
    setFileIds((prev) => prev.filter((id) => id !== fileId));
  };

  const handleMediaIdsChange = (
    newImageIds: number[],
    newFileIds: number[]
  ) => {
    setImageIds(newImageIds);
    setFileIds(newFileIds);
  };

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
            공지사항 작성
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
            <div className="relative">
              <select
                id="buildingId"
                value={buildingId || ''}
                onChange={(e) =>
                  setBuildingId(e.target.value ? Number(e.target.value) : null)
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none"
                disabled={isBuildingsLoading}
              >
                <option value="">전체 공지</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.buildingNumber}동
                  </option>
                ))}
              </select>
              {isBuildingsLoading && (
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                </div>
              )}
            </div>
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
              onImageUploadSuccess={handleImageUploadSuccess}
              onFileUploadSuccess={handleFileUploadSuccess}
              onImageDelete={handleImageDelete}
              onFileDelete={handleFileDelete}
              onMediaIdsChange={handleMediaIdsChange}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
