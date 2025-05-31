'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import client from '@/lib/backend/client';
import { use } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface NoticeFileDto {
  id: number;
  originalName: string;
  downloadUrl: string;
  size: number;
}

interface NoticeImageDto {
  id: number;
  originalName: string;
  downloadUrl: string;
  size: number;
}

interface NoticeDetail {
  noticeId: number;
  title: string;
  content: string;
  authorName: string;
  createdAt: string;
  viewCount: number;
  imageUrls: NoticeImageDto[];
  fileUrls: NoticeFileDto[];
}

const processContent = async (content: string) => {
  if (typeof window === 'undefined') return content;

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;

  // 이미지 URL 수정 - ID 기반 매칭
  const imgElements = tempDiv.getElementsByTagName('img');

  for (let i = 0; i < imgElements.length; i++) {
    const img = imgElements[i];
    const dataId = img.getAttribute('data-id');

    if (!dataId) continue;

    // data-id를 숫자로 변환
    const imageId = Number(dataId);
    if (isNaN(imageId)) continue;

    try {
      // 이미지 정보를 API로 직접 조회
      const response = await fetch(`/api/v1/notices/media/images/${imageId}`);

      if (!response.ok) {
        img.src = '/placeholder.jpg';
        img.alt = '이미지를 불러올 수 없습니다';
        continue;
      }

      const data = await response.json();
      if (data?.url) {
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

  return tempDiv.innerHTML;
};

export default function NoticeDetailPage({
  params,
}: {
  params: Promise<{ noticeId: string }>;
}) {
  const { noticeId } = use(params);
  const router = useRouter();
  const [notice, setNotice] = useState<NoticeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processedContent, setProcessedContent] = useState<string>('');

  useEffect(() => {
    async function fetchNoticeDetail() {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await client.GET(
          `/api/v1/notices/user/{noticeId}`,
          {
            params: {
              path: {
                noticeId: parseInt(noticeId),
              },
            },
          }
        );

        if (error) throw new Error('공지사항을 불러오지 못했습니다.');
        if (data) {
          const formattedImageUrls: NoticeImageDto[] = (
            data.imageUrls || []
          ).map((img) => ({
            id: img.id || 0,
            originalName: img.originalName || '',
            downloadUrl: img.downloadUrl || '',
            size: img.size || 0,
          }));

          const formattedFileUrls: NoticeFileDto[] = (data.fileUrls || []).map(
            (file) => ({
              id: file.id || 0,
              originalName: file.originalName || '',
              downloadUrl: file.downloadUrl || '',
              size: file.size || 0,
            })
          );

          const noticeData = {
            noticeId: data.noticeId || 0,
            title: data.title || '',
            content: data.content || '',
            authorName: data.authorName || '',
            createdAt: data.createdAt || '',
            viewCount: data.viewCount || 0,
            imageUrls: formattedImageUrls,
            fileUrls: formattedFileUrls,
          };

          setNotice(noticeData);

          // 컨텐츠 처리
          if (noticeData.content) {
            const processed = await processContent(noticeData.content);
            setProcessedContent(processed);
          }
        }
      } catch (e: any) {
        setError(e.message || '알 수 없는 에러가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchNoticeDetail();
  }, [noticeId]);

  const formatDateTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return format(date, 'yyyy-MM-dd HH:mm', { locale: ko });
    } catch {
      return dateTimeStr;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </Button>
      </div>
    );
  }

  if (!notice) return null;

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="space-y-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.push('/udash/notices')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← 목록으로
            </button>
          </div>
          <div className="space-y-3">
            <CardTitle className="text-2xl">{notice.title}</CardTitle>
            <div className="flex items-center text-gray-600 text-sm border-b pb-4">
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
          </div>
        </CardHeader>
        <CardContent>
          {/* 본문 내용 */}
          <div className="prose max-w-none pb-8">
            <div
              dangerouslySetInnerHTML={{
                __html: processedContent,
              }}
            />
          </div>

          {/* 첨부파일 섹션 */}
          {notice.fileUrls.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-medium mb-4">첨부파일</h3>
              <ul className="space-y-2 bg-gray-50 p-4 rounded-lg">
                {notice.fileUrls.map((file) => (
                  <li key={file.downloadUrl} className="flex items-center">
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
        </CardContent>
      </Card>
    </div>
  );
}
