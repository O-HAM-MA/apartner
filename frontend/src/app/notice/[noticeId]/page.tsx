'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { components } from '@/lib/backend/apiV1/schema';
import client from '@/lib/backend/client';

// 백엔드 응답 타입 정의
type NoticeImage = {
  id: number;
  url: string;
  originalName: string;
};

type NoticeFile = {
  originalName: string;
  downloadUrl: string;
  size: number;
};

type NoticeResponse = {
  noticeId: number;
  title: string;
  content: string;
  authorName: string;
  createdAt: string;
  viewCount: number;
  imageUrls: NoticeImage[];
  fileUrls: NoticeFile[];
};

const processContent = async (
  content: string,
  images: NoticeImage[],
  files: NoticeFile[]
) => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;

  // 디버깅용 로그
  console.log('백엔드에서 받은 이미지 목록:', images);
  console.log('백엔드에서 받은 파일 목록:', files);

  // 이미지 URL 수정 - ID 기반 매칭
  const imgElements = tempDiv.getElementsByTagName('img');

  for (let i = 0; i < imgElements.length; i++) {
    const img = imgElements[i];
    const dataId = img.getAttribute('data-id');

    if (!dataId) {
      console.log('이미지에 data-id가 없음:', img);
      continue;
    }

    // data-id를 숫자로 변환
    const imageId = Number(dataId);
    if (isNaN(imageId)) {
      console.warn('유효하지 않은 이미지 ID:', dataId);
      continue;
    }

    try {
      // 이미지 정보를 API로 직접 조회
      const { data, error } = await client.GET(
        '/api/v1/notices/media/images/{noticeImageId}',
        {
          params: { path: { noticeImageId: imageId } },
        }
      );

      if (error) {
        console.error('이미지 정보 조회 실패:', error);
        img.src = '/placeholder.jpg';
        img.alt = '이미지를 불러올 수 없습니다';
        continue;
      }

      if (data && data.url) {
        console.log('이미지 매칭 성공:', {
          id: imageId,
          url: data.url,
          originalName: data.originalName,
        });
        img.src = data.url;
      } else {
        console.warn('이미지 URL이 없음:', data);
        img.src = '/placeholder.jpg';
        img.alt = '이미지를 불러올 수 없습니다';
      }
    } catch (error) {
      console.error('이미지 정보 조회 중 오류 발생:', error);
      img.src = '/placeholder.jpg';
      img.alt = '이미지를 불러올 수 없습니다';
    }
  }

  // 본문의 파일 링크 제거
  const links = tempDiv.getElementsByTagName('a');
  const linksToRemove = [];
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    if (link.getAttribute('data-file-id')) {
      linksToRemove.push(link);
    }
  }

  // 파일 링크 제거
  linksToRemove.forEach((link) => {
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
  });

  return tempDiv.innerHTML;
};

export default function NoticeDetailPage({
  params,
}: {
  params: Promise<{ noticeId: string }>;
}) {
  const router = useRouter();
  const { noticeId } = use(params);

  const [notice, setNotice] = useState<NoticeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processedContent, setProcessedContent] = useState<string>('');

  useEffect(() => {
    const fetchNoticeDetail = async () => {
      try {
        const { data, error } = await client.GET('/api/v1/notices/{noticeId}', {
          params: { path: { noticeId: Number(noticeId) } },
        });

        if (error || !data) {
          throw new Error(
            typeof error === 'object' && error !== null
              ? (error as Error).message
              : '공지사항을 불러오는데 실패했습니다.'
          );
        }

        // 서버 응답 데이터 구조 확인
        console.log('서버 응답 원본 데이터:', data);

        // 이미지 데이터 파싱
        let parsedImages: NoticeImage[] = [];
        if (Array.isArray(data.imageUrls)) {
          parsedImages = data.imageUrls.map((img: any) => {
            // 이미지 데이터가 문자열인 경우 (URL만 있는 경우)
            if (typeof img === 'string') {
              return {
                id: 0, // 임시 ID
                url: img,
                originalName: '',
              };
            }

            // 이미지 데이터가 객체인 경우
            return {
              id: Number(img.id) || 0,
              url: img.url || '',
              originalName: img.originalName || '',
            };
          });
        }

        // 데이터 변환
        const noticeData: NoticeResponse = {
          noticeId: Number(data.noticeId) || 0,
          title: data.title || '',
          content: data.content || '',
          authorName: data.authorName || '',
          createdAt: data.createdAt || new Date().toISOString(),
          viewCount: Number(data.viewCount) || 0,
          imageUrls: parsedImages,
          fileUrls: Array.isArray(data.fileUrls)
            ? data.fileUrls.map((file: any) => ({
                originalName: file.originalName || '',
                downloadUrl: file.downloadUrl || '',
                size: Number(file.size) || 0,
              }))
            : [],
        };

        console.log('변환된 데이터:', {
          ...noticeData,
          imageUrls: noticeData.imageUrls.map((img) => ({
            id: img.id,
            url: img.url,
            originalName: img.originalName,
          })),
        });

        setNotice(noticeData);

        if (noticeData.content) {
          try {
            const processed = await processContent(
              noticeData.content,
              noticeData.imageUrls,
              noticeData.fileUrls
            );
            setProcessedContent(processed);
          } catch (err) {
            console.error('컨텐츠 처리 중 오류:', err);
            setError('컨텐츠를 처리하는 중 오류가 발생했습니다.');
          }
        }
      } catch (err) {
        console.error('공지사항 불러오기 실패:', err);
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

          {/* 본문 내용 */}
          <div className="prose max-w-none border-b pb-8">
            <div
              dangerouslySetInnerHTML={{
                __html: processedContent || '',
              }}
            />
          </div>

          {/* 첨부파일 섹션 - 항상 본문 아래에 고정 */}
          {notice.fileUrls && notice.fileUrls.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">첨부파일</h3>
              <ul className="space-y-2 bg-gray-50 p-4 rounded-lg">
                {notice.fileUrls.map((file, index) => (
                  <li
                    key={file.downloadUrl || index}
                    className="flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-2 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                    <a
                      href={file.downloadUrl}
                      download={file.originalName}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {file.originalName}
                      <span className="text-gray-500 text-sm ml-2">
                        ({Math.round(file.size / 1024)}KB)
                      </span>
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
