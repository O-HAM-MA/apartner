'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

          setNotice({
            noticeId: data.noticeId || 0,
            title: data.title || '',
            content: data.content || '',
            authorName: data.authorName || '',
            createdAt: data.createdAt || '',
            viewCount: data.viewCount || 0,
            imageUrls: formattedImageUrls,
            fileUrls: formattedFileUrls,
          });
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
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        {/* 헤더 */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">공지사항</h1>
        </div>

        {/* 게시글 내용 */}
        <div className="rounded-lg border border-border bg-card shadow-sm">
          {/* 게시글 헤더 */}
          <div className="border-b border-border p-6">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              {notice.title}
            </h2>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div>작성자: {notice.authorName}</div>
              <div>작성일: {formatDateTime(notice.createdAt)}</div>
              <div>조회수: {notice.viewCount}</div>
            </div>
          </div>

          {/* 게시글 본문 */}
          <div className="p-6">
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: notice.content }}
            />
          </div>

          {/* 첨부 파일 및 이미지 */}
          {(notice.fileUrls.length > 0 || notice.imageUrls.length > 0) && (
            <div className="border-t border-border p-6">
              {/* 첨부 파일 */}
              {notice.fileUrls.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 font-semibold text-foreground">
                    첨부 파일
                  </h3>
                  <ul className="space-y-2">
                    {notice.fileUrls.map((file) => (
                      <li key={file.id}>
                        <a
                          href={file.downloadUrl}
                          className="flex items-center gap-2 rounded-md border border-border p-2 hover:bg-secondary/50"
                          download
                        >
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1 text-sm">
                            {file.originalName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 첨부 이미지 */}
              {notice.imageUrls.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold text-foreground">
                    첨부 이미지
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {notice.imageUrls.map((image) => (
                      <div
                        key={image.id}
                        className="overflow-hidden rounded-lg border border-border"
                      >
                        <img
                          src={image.downloadUrl}
                          alt={image.originalName}
                          className="w-full object-cover"
                        />
                        <div className="flex items-center justify-between border-t border-border bg-card/50 p-2">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {image.originalName}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(image.size)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
