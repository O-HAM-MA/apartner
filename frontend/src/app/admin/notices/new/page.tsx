'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TiptapEditor from '@/components/editor/TiptapEditor';
import { components } from '@/lib/backend/apiV1/schema';
import client from '@/lib/backend/client';

type NoticeCreateRequestDto = components['schemas']['NoticeCreateRequestDto'];

export default function CreateNoticePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [buildingNumber, setBuildingNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageIds, setImageIds] = useState<number[]>([]);
  const [fileIds, setFileIds] = useState<number[]>([]);

  useEffect(() => {
    const createPost = async () => {
      if (!isSubmitting) return;

      try {
        const noticeCreateData: NoticeCreateRequestDto = {
          title,
          content,
          buildingId: buildingNumber ? Number(buildingNumber) : undefined,
          imageIds,
          fileIds,
        };

        const { data, error } = await client.POST(
          '/api/v1/admin/notices/create',
          {
            body: noticeCreateData,
          }
        );

        if (error) {
          alert('공지사항 작성에 실패했습니다. 다시 시도해주세요.');
          return;
        }

        if (data && typeof data === 'object' && 'noticeId' in data) {
          router.push(`/admin/notices/${data.noticeId}`);
        } else {
          router.push('/admin/notices');
        }
      } catch (error) {
        alert('공지사항 작성에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setIsSubmitting(false);
      }
    };

    createPost();
  }, [isSubmitting, title, content, buildingNumber, router, imageIds, fileIds]);

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

  if (isLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-8">로딩 중...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">공지사항 작성</h1>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-800"
        >
          뒤로가기
        </button>
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
            htmlFor="building"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            공지 대상 (동 번호)
          </label>
          <input
            type="text"
            id="building"
            value={buildingNumber}
            onChange={(e) => setBuildingNumber(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="동 번호를 입력하세요 (전체 공지는 비워두세요)"
          />
          <p className="mt-1 text-sm text-gray-500">
            특정 동을 입력하면 해당 동 거주자에게만 공지가 전달됩니다. 비워두면
            전체 공지로 전송됩니다.
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
            onImageUploadSuccess={handleImageUploadSuccess}
            onFileUploadSuccess={handleFileUploadSuccess}
            onImageDelete={handleImageDelete}
            onFileDelete={handleFileDelete}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? '등록 중...' : '등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
