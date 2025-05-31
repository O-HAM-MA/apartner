'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { components } from '@/lib/backend/apiV1/schema';
import client from '@/lib/backend/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

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

  // 이미지 URL 수정 - ID 기반 매칭
  const imgElements = tempDiv.getElementsByTagName('img');

  for (let i = 0; i < imgElements.length; i++) {
    const img = imgElements[i];
    const dataId = img.getAttribute('data-id');

    if (!dataId) {
      continue;
    }

    // data-id를 숫자로 변환
    const imageId = Number(dataId);
    if (isNaN(imageId)) {
      continue;
    }

    try {
      // 이미지 정보를 API로 직접 조회
      const { data, error } = await client.GET(
        '/api/v1/admin/notices/media/images/{noticeImageId}',
        {
          params: { path: { noticeImageId: imageId } },
        }
      );

      if (error) {
        img.src = '/placeholder.jpg';
        img.alt = '이미지를 불러올 수 없습니다';
        continue;
      }

      if (data && data.url) {
        img.src = data.url;
      } else {
        img.src = '/placeholder.jpg';
        img.alt = '이미지를 불러올 수 없습니다';
      }
    } catch (error) {
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
  const { toast } = useToast();

  const [notice, setNotice] = useState<NoticeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processedContent, setProcessedContent] = useState<string>('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchNoticeDetail = async () => {
      try {
        const { data, error } = await client.GET(
          '/api/v1/admin/notices/{noticeId}',
          {
            params: { path: { noticeId: Number(noticeId) } },
          }
        );

        if (error || !data) {
          throw new Error(
            typeof error === 'object' && error !== null
              ? (error as Error).message
              : '공지사항을 불러오는데 실패했습니다.'
          );
        }

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
            setError('컨텐츠를 처리하는 중 오류가 발생했습니다.');
          }
        }
      } catch (err) {
        setError('공지사항을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNoticeDetail();
  }, [noticeId]);

  const handleEdit = () => {
    router.push(`/admin/notices/${noticeId}/edit`);
  };

  const handleDelete = async () => {
    try {
      await client.DELETE('/api/v1/admin/notices/{noticeId}', {
        params: { path: { noticeId: Number(noticeId) } },
      });

      toast({
        title: '성공',
        description: '공지사항이 성공적으로 삭제되었습니다.',
      });
      router.push('/admin/notices');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '공지사항 삭제에 실패했습니다. 다시 시도해주세요.',
      });
    } finally {
      setIsDeleteDialogOpen(false);
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
          onClick={() => router.push('/admin/notices')}
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
            onClick={() => setIsDeleteDialogOpen(true)}
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
                ? format(new Date(notice.createdAt), 'yyyy-MM-dd HH:mm', {
                    locale: ko,
                  })
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

      {/* 삭제 확인 모달 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>공지사항 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 공지사항을 삭제하시겠습니까? 이 작업은 되돌릴 수
              없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
