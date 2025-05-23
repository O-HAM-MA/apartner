'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect, useState, useRef } from 'react';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import type { Editor } from '@tiptap/react';
import type { Node as ProseMirrorNode } from 'prosemirror-model';
import { HTMLAttributes } from 'react';
import { Plugin, PluginKey, NodeSelection } from 'prosemirror-state';
import { BubbleMenu } from '@tiptap/react';
import client from '@/lib/backend/client';
import type { paths } from '@/lib/backend/apiV1/schema';
import { fetchApi } from '@/utils/api';

// MediaUploadResponseDto 타입 추가
type MediaUploadResponseDto = {
  id: number;
  url: string;
  originalName?: string;
};

// --- 사용자 정의 이미지 속성 인터페이스 ---
interface CustomImageAttributes extends HTMLAttributes<HTMLElement> {
  'data-id'?: string | null;
  'data-temp-id'?: string | null;
  'data-align'?: 'left' | 'center' | 'right';
}

/* 리사이즈 핸들 CSS 스타일 */
const resizeHandleStyles = {
  position: 'absolute',
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  backgroundColor: '#4263EB',
  border: '2px solid white',
  zIndex: 100,
  cursor: 'nwse-resize',
};

/* 이미지 리사이즈 핸들을 렌더링하는 함수 - 전방향 핸들 추가 */
const renderResizeHandle = () => {
  // 새 구조에 맞게 이미지 리사이저 선택자 수정
  const resizeHandles = document.querySelectorAll('.image-resizer');

  resizeHandles.forEach((container) => {
    // 이미 핸들이 있으면 제거 후 다시 추가
    const existingHandles = container.querySelectorAll('.resize-trigger');
    existingHandles.forEach((handle) => handle.remove());

    // 8방향 핸들 생성 - 위치와 커서 스타일 다르게 적용
    const handlePositions = [
      {
        className: 'nw',
        style: { top: '-6px', left: '-6px', cursor: 'nw-resize' },
      },
      {
        className: 'n',
        style: {
          top: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          cursor: 'n-resize',
        },
      },
      {
        className: 'ne',
        style: { top: '-6px', right: '-6px', cursor: 'ne-resize' },
      },
      {
        className: 'w',
        style: {
          top: '50%',
          left: '-6px',
          transform: 'translateY(-50%)',
          cursor: 'w-resize',
        },
      },
      {
        className: 'e',
        style: {
          top: '50%',
          right: '-6px',
          transform: 'translateY(-50%)',
          cursor: 'e-resize',
        },
      },
      {
        className: 'sw',
        style: { bottom: '-6px', left: '-6px', cursor: 'sw-resize' },
      },
      {
        className: 's',
        style: {
          bottom: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          cursor: 's-resize',
        },
      },
      {
        className: 'se',
        style: { bottom: '-6px', right: '-6px', cursor: 'se-resize' },
      },
    ];

    handlePositions.forEach(({ className, style }) => {
      const handle = document.createElement('div');
      handle.className = `resize-trigger resize-${className}`;

      // 기본 스타일과 특정 위치 스타일 합치기
      Object.assign(handle.style, resizeHandleStyles, style);

      // 컨테이너에 핸들 추가
      container.appendChild(handle);
    });
  });
};

// --- Custom Image Extension --- (기본 Image 확장)
const CustomImage = Image.extend({
  name: 'customImage',

  // 커스텀 속성 추가
  addAttributes() {
    return {
      // 기본 이미지 속성(src, alt, title 등) 상속
      ...this.parent?.(),

      // 추가: 너비 속성
      width: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('width'),
        renderHTML: (attributes: { width?: string | number | null }) => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      // 추가: 높이 속성
      height: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('height'),
        renderHTML: (attributes: { height?: string | number | null }) => {
          if (!attributes.height) return {};
          return { height: attributes.height };
        },
      },

      // 추가: 스타일 속성
      style: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('style'),
        renderHTML: (attributes: { style?: string | null }) => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        },
      },

      // 이미지 정렬 속성 추가
      'data-align': {
        default: 'center',
        parseHTML: (element: HTMLElement) => {
          // 상위 요소의 data-align 속성도 확인
          if (element.parentElement?.parentElement) {
            const wrapperAlign =
              element.parentElement.parentElement.getAttribute('data-align');
            if (wrapperAlign) return wrapperAlign;
          }
          return element.getAttribute('data-align');
        },
        renderHTML: (attributes: CustomImageAttributes) => {
          if (!attributes['data-align']) {
            return {};
          }
          return { 'data-align': attributes['data-align'] };
        },
      },

      // 임시 이미지 식별용 ID
      'data-id': {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-id'),
        renderHTML: (attributes: CustomImageAttributes) => {
          if (!attributes['data-id']) {
            return {};
          }
          return { 'data-id': attributes['data-id'] };
        },
      },

      // 백엔드 임시 저장 ID
      'data-temp-id': {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-temp-id'),
        renderHTML: (attributes: CustomImageAttributes) => {
          if (!attributes['data-temp-id']) {
            return {};
          }
          return { 'data-temp-id': attributes['data-temp-id'] };
        },
      },
    };
  },

  // 렌더링 HTML 수정 - 원래 구조로 돌아가기 (복잡한 구조는 오히려 문제를 일으킴)
  renderHTML({ HTMLAttributes }) {
    const attrs = { ...HTMLAttributes };
    const alignClass = attrs['data-align']
      ? `image-align-${attrs['data-align']}`
      : '';

    return [
      'div',
      {
        class: `image-resizer ${alignClass}`,
        'data-align': attrs['data-align'] || 'center',
      },
      ['img', attrs],
    ];
  },

  addProseMirrorPlugins() {
    const minWidth = 30; // 최소 이미지 너비

    return [
      new Plugin({
        key: new PluginKey('customImageResize'),
        props: {
          handleDOMEvents: {
            mousedown: (view, event) => {
              const target = event.target as HTMLElement;

              // 리사이즈 핸들 클릭 시
              if (target.classList.contains('resize-trigger')) {
                event.preventDefault();
                event.stopPropagation();

                const imgWrapper = target.closest(
                  '.image-resizer'
                ) as HTMLElement;
                if (!imgWrapper) return false;

                const img = imgWrapper.querySelector('img') as HTMLElement;
                if (!img) return false;

                const startX = event.pageX;
                const startY = event.pageY;
                const startWidth = img.offsetWidth;
                const startHeight = img.offsetHeight;
                const aspectRatio =
                  startHeight > 0 ? startWidth / startHeight : 1;

                // 리사이즈 방향 결정
                const direction =
                  Array.from(target.classList)
                    .find(
                      (cls) =>
                        cls.startsWith('resize-') && cls !== 'resize-trigger'
                    )
                    ?.replace('resize-', '') || 'se';

                // keepRatio: 가로세로 비율 유지 여부 (shift 키 누르고 있는지)
                const keepRatio = event.shiftKey;

                // ProseMirror 노드 위치 찾기 (개선된 방법)
                let imgPos = -1;

                // DOM에서 ProseMirror 위치 찾기 (개선된 접근 방식)
                // 이미지 요소가 포함된 div.image-resizer 찾기
                view.state.doc.descendants((node, pos) => {
                  if (node.type.name === 'customImage') {
                    // 하드코딩된 'customImage' 사용
                    // 현재 노드의 DOM 요소 찾기
                    const domAtPos = view.domAtPos(pos);
                    const nodeDOM = domAtPos.node;

                    // nodeDOM이 imgWrapper를 포함하거나 그 자체인지 확인
                    if (
                      nodeDOM &&
                      (nodeDOM === imgWrapper ||
                        nodeDOM.contains(imgWrapper) ||
                        imgWrapper.contains(nodeDOM))
                    ) {
                      imgPos = pos;
                      return false; // 찾으면 중단
                    }
                  }
                  return true;
                });

                if (imgPos === -1) {
                  // fallback 방법: 이미지 부모 요소에서 직접 위치 찾기 시도
                  const domPos = view.posAtDOM(imgWrapper, 0);
                  if (domPos && domPos >= 0) {
                    imgPos = domPos;
                  } else {
                    console.error('Failed to find image node position.');
                    return false;
                  }
                }

                // 이미지 노드 선택
                try {
                  const selection = NodeSelection.create(
                    view.state.doc,
                    imgPos
                  );
                  const trSelect = view.state.tr.setSelection(selection);
                  view.dispatch(trSelect);
                } catch (e) {
                  console.warn(
                    'Could not select image node during resize start',
                    e
                  );
                }

                imgWrapper.classList.add('resizing');

                const mousemove = (e: MouseEvent) => {
                  // 마우스 이동 거리
                  const deltaX = e.pageX - startX;
                  const deltaY = e.pageY - startY;

                  // 각 방향에 따라 너비와 높이 계산 로직
                  let newWidth = startWidth;
                  let newHeight = startHeight;

                  // 방향에 따른 크기 조절
                  switch (direction) {
                    case 'se': // 오른쪽 아래
                      newWidth = Math.max(minWidth, startWidth + deltaX);
                      newHeight = keepRatio
                        ? newWidth / aspectRatio
                        : Math.max(minWidth, startHeight + deltaY);
                      break;
                    case 'sw': // 왼쪽 아래
                      newWidth = Math.max(minWidth, startWidth - deltaX);
                      newHeight = keepRatio
                        ? newWidth / aspectRatio
                        : Math.max(minWidth, startHeight + deltaY);
                      break;
                    case 'ne': // 오른쪽 위
                      newWidth = Math.max(minWidth, startWidth + deltaX);
                      newHeight = keepRatio
                        ? newWidth / aspectRatio
                        : Math.max(minWidth, startHeight - deltaY);
                      break;
                    case 'nw': // 왼쪽 위
                      newWidth = Math.max(minWidth, startWidth - deltaX);
                      newHeight = keepRatio
                        ? newWidth / aspectRatio
                        : Math.max(minWidth, startHeight - deltaY);
                      break;
                    case 'n': // 위
                      newHeight = Math.max(minWidth, startHeight - deltaY);
                      newWidth = keepRatio
                        ? newHeight * aspectRatio
                        : startWidth;
                      break;
                    case 's': // 아래
                      newHeight = Math.max(minWidth, startHeight + deltaY);
                      newWidth = keepRatio
                        ? newHeight * aspectRatio
                        : startWidth;
                      break;
                    case 'e': // 오른쪽
                      newWidth = Math.max(minWidth, startWidth + deltaX);
                      newHeight = keepRatio
                        ? newWidth / aspectRatio
                        : startHeight;
                      break;
                    case 'w': // 왼쪽
                      newWidth = Math.max(minWidth, startWidth - deltaX);
                      newHeight = keepRatio
                        ? newWidth / aspectRatio
                        : startHeight;
                      break;
                  }

                  // 프로세미러 노드 가져오기
                  const node = view.state.doc.nodeAt(imgPos);
                  if (!node) return;

                  // 트랜잭션 생성 및 디스패치
                  const tr = view.state.tr.setNodeMarkup(imgPos, undefined, {
                    ...node.attrs,
                    width: Math.round(newWidth),
                    height: Math.round(newHeight),
                    style: `width: ${Math.round(
                      newWidth
                    )}px; height: ${Math.round(newHeight)}px;`,
                  });
                  view.dispatch(tr);
                };

                const mouseup = () => {
                  document.removeEventListener('mousemove', mousemove);
                  document.removeEventListener('mouseup', mouseup);
                  imgWrapper.classList.remove('resizing');
                };

                document.addEventListener('mousemove', mousemove);
                document.addEventListener('mouseup', mouseup);

                return true;
              }
              return false;
            },
          },
        },
      }),
    ];
  },
});

// 파일 정보 인터페이스 추가
interface FileInfo {
  id: string;
  name: string;
  url: string;
}

interface TiptapEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  onImageUploadSuccess?: (imageId: number) => void;
  onImageDelete?: (imageId: number) => void;
  onFileUploadSuccess?: (fileId: number) => void;
  onFileDelete?: (fileId: number) => void;
  onMediaIdsChange?: (imageIds: number[], fileIds: number[]) => void;
  noticeId?: number;
}

const TiptapEditor = ({
  content = '',
  onChange,
  onImageUploadSuccess,
  onImageDelete,
  onFileUploadSuccess,
  onFileDelete,
  onMediaIdsChange,
  noticeId,
}: TiptapEditorProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const linkButtonRef = useRef<HTMLButtonElement>(null);
  const linkModalRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState<string>('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const [currentImageIds, setCurrentImageIds] = useState<number[]>([]);

  // refs for tracking previous state
  const prevImageIdsRef = useRef<number[]>([]);
  const prevFileIdsRef = useRef<number[]>([]);
  const prevTempIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 초기 이미지와 파일 로드
  useEffect(() => {
    if (!noticeId) return;

    const loadInitialMedia = async () => {
      try {
        interface NoticeImage {
          id: number;
          originalName?: string;
          downloadUrl: string;
        }

        interface NoticeFile {
          id: number;
          originalName?: string;
          downloadUrl: string;
        }

        interface NoticeResponse {
          imageUrls: NoticeImage[];
          fileUrls: NoticeFile[];
        }

        const response = await client.GET('/api/v1/notices/{noticeId}', {
          params: { path: { noticeId } },
        });

        const notice = response.data as NoticeResponse;

        if (notice?.imageUrls && Array.isArray(notice.imageUrls)) {
          const imageIds = notice.imageUrls
            .filter(
              (img): img is NoticeImage =>
                typeof img?.id === 'number' &&
                typeof img?.downloadUrl === 'string'
            )
            .map((img) => img.id);
          setCurrentImageIds(imageIds);
          prevImageIdsRef.current = imageIds;
        }

        if (notice?.fileUrls && Array.isArray(notice.fileUrls)) {
          const files = notice.fileUrls
            .filter(
              (file): file is NoticeFile =>
                typeof file?.id === 'number' &&
                typeof file?.downloadUrl === 'string'
            )
            .map((file) => ({
              id: String(file.id),
              name: file.originalName || '파일',
              url: file.downloadUrl,
            }));
          setUploadedFiles(files);
          prevFileIdsRef.current = files.map((file) => Number(file.id));
        }
      } catch (error) {
        console.error('미디어 로드 실패:', error);
      }
    };

    loadInitialMedia();
  }, [noticeId]);

  // 모달 외부 클릭 감지를 위한 이벤트 핸들러
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showLinkModal &&
        linkModalRef.current &&
        !linkModalRef.current.contains(event.target as Node) &&
        linkButtonRef.current &&
        !linkButtonRef.current.contains(event.target as Node)
      ) {
        setShowLinkModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLinkModal]);

  // 현재 에디터에 있는 이미지 ID 추출
  const extractImageIds = useCallback((editorInstance: Editor) => {
    if (!editorInstance) return [];

    const imageIds: number[] = [];
    editorInstance.state.doc.descendants((node: ProseMirrorNode) => {
      if (node.type.name === 'customImage') {
        const tempId = node.attrs['data-temp-id'];
        if (tempId && typeof tempId === 'string') {
          const numId = Number(tempId);
          if (!isNaN(numId)) {
            imageIds.push(numId);
          }
        }
      }
      return true;
    });
    return imageIds;
  }, []);

  // 현재 파일 ID 추출
  const extractFileIds = useCallback(() => {
    return uploadedFiles.map((file) => Number(file.id));
  }, [uploadedFiles]);

  // 미디어 ID 변경 감지 및 부모 컴포넌트에 알림
  const handleMediaChange = useCallback(
    (imageIds: number[], fileIds: number[]) => {
      const currentImageIdsString = JSON.stringify(imageIds.sort());
      const currentFileIdsString = JSON.stringify(fileIds.sort());

      if (
        JSON.stringify(prevImageIdsRef.current.sort()) !==
          currentImageIdsString ||
        JSON.stringify(prevFileIdsRef.current.sort()) !== currentFileIdsString
      ) {
        prevImageIdsRef.current = imageIds;
        prevFileIdsRef.current = fileIds;
        setCurrentImageIds(imageIds);
        onMediaIdsChange?.(imageIds, fileIds);
      }
    },
    [onMediaIdsChange]
  );

  // 이미지 노드 변경 핸들러
  const handleImageNodeChanges = useCallback(
    async (editorInstance: Editor) => {
      if (!editorInstance) return;

      const currentTempIds = new Set<string>();
      editorInstance.state.doc.descendants((node: ProseMirrorNode) => {
        if (node.type.name === 'customImage') {
          const tempId = node.attrs['data-temp-id'];
          if (tempId && typeof tempId === 'string') {
            currentTempIds.add(tempId);
          }
        }
        return true;
      });

      const prevSet = prevTempIdsRef.current;

      // 제거된 이미지 찾기
      for (const prevId of prevSet) {
        if (!currentTempIds.has(prevId)) {
          try {
            const { error } = await client.DELETE(
              '/api/v1/notices/media/images/{noticeImageId}',
              {
                params: { path: { noticeImageId: Number(prevId) } },
              }
            );
            if (error) {
              console.error('이미지 삭제 실패:', error);
              return;
            }
            onImageDelete?.(Number(prevId));
          } catch (error) {
            console.error('이미지 삭제 실패:', error);
          }
        }
      }

      // 현재 이미지 목록으로 업데이트
      prevTempIdsRef.current = currentTempIds;

      // 현재 이미지와 파일 ID 추출
      const imageIds = extractImageIds(editorInstance);
      const fileIds = extractFileIds();

      handleMediaChange(imageIds, fileIds);
    },
    [extractImageIds, extractFileIds, onImageDelete, handleMediaChange]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // StarterKit에는 기본적인 익스텐션만 포함
      }),
      CustomImage.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'text-blue-500 hover:text-blue-600 underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
        defaultAlignment: 'left',
      }),
      Underline,
      Placeholder.configure({
        placeholder: '당신의 이야기를 적어보세요...',
        emptyEditorClass: 'is-editor-empty',
        emptyNodeClass: 'is-empty',
        showOnlyCurrent: true,
        includeChildren: false,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
      handleImageNodeChanges(editor);
    },
    immediatelyRender: false,
  });

  // 파일 삭제 처리
  const handleFileDelete = useCallback(
    (fileId: string) => {
      client
        .DELETE('/api/v1/notices/media/files/{noticeFileId}', {
          params: { path: { noticeFileId: Number(fileId) } },
        })
        .then(() => {
          setUploadedFiles((prev) => {
            const newFiles = prev.filter((file) => file.id !== fileId);
            const fileIds = newFiles.map((file) => Number(file.id));
            const imageIds = editor ? extractImageIds(editor) : [];
            handleMediaChange(imageIds, fileIds);
            return newFiles;
          });
          onFileDelete?.(Number(fileId));
        })
        .catch((error) => {
          console.error('파일 삭제 실패:', error);
          alert('파일 삭제에 실패했습니다.');
        });
    },
    [editor, onFileDelete, extractImageIds, handleMediaChange]
  );

  // 파일 업로드 성공 시 목록 업데이트
  const handleFileUploadSuccess = useCallback(
    (fileId: number, fileName: string, fileUrl: string) => {
      setUploadedFiles((prev) => {
        const newFiles = [
          ...prev,
          { id: String(fileId), name: fileName, url: fileUrl },
        ];
        const fileIds = newFiles.map((file) => Number(file.id));
        const imageIds = editor ? extractImageIds(editor) : [];
        if (onMediaIdsChange) {
          onMediaIdsChange(imageIds, fileIds);
        }
        return newFiles;
      });
      if (onFileUploadSuccess) {
        onFileUploadSuccess(fileId);
      }
    },
    [editor, onFileUploadSuccess, extractImageIds, onMediaIdsChange]
  );

  // 초기 이미지 ID 동기화
  useEffect(() => {
    if (!editor) return;

    const imageIds = extractImageIds(editor);
    const fileIds = extractFileIds();
    handleMediaChange(imageIds, fileIds);
  }, [editor, extractImageIds, extractFileIds, handleMediaChange]);

  // 이미지 렌더링 후 리사이즈 핸들 추가
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      requestAnimationFrame(() => {
        renderResizeHandle();
      });
    };

    editor.on('update', handleUpdate);
    handleUpdate();

    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor]);

  // content prop이 변경될 때 에디터 내용 업데이트
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  // 파일 업로드 핸들러 추가
  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || isUploading) return;

      setIsUploading(true);

      try {
        for (const file of Array.from(files)) {
          const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
          if (file.size > MAX_FILE_SIZE) {
            alert(
              `파일 크기가 너무 큽니다. 50MB 이하만 업로드해주세요: ${file.name}`
            );
            continue;
          }

          setUploadingFileName(file.name);
          const formData = new FormData();
          formData.append('files', file);

          try {
            const res = await fetchApi('/api/v1/notices/media/files/upload', {
              method: 'POST',
              body: formData,
            });

            if (!res.ok) {
              throw new Error(`서버 응답 오류 (status: ${res.status})`);
            }

            const data = await res.json();
            if (!data || !Array.isArray(data) || data.length === 0) {
              throw new Error('서버 응답 데이터가 유효하지 않습니다');
            }

            const uploadedFile = data[0];
            handleFileUploadSuccess(
              uploadedFile.id,
              file.name,
              uploadedFile.url
            );
          } catch (error) {
            console.error('파일 업로드 실패:', error);
            alert(
              `파일 업로드 실패 (${file.name}): ${
                error instanceof Error ? error.message : '알 수 없는 오류'
              }`
            );
          }
        }
      } finally {
        setIsUploading(false);
        setUploadingFileName('');
      }
    },
    [isUploading, handleFileUploadSuccess]
  );

  // 파일 추가 버튼 클릭 핸들러
  const addFile = useCallback(() => {
    if (!isMounted) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      e.preventDefault();
      handleFileUpload((e.target as HTMLInputElement).files);
      input.value = '';
    };
    input.click();
  }, [handleFileUpload, isMounted]);

  // 이미지 렌더링 후 리사이즈 핸들 추가
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      requestAnimationFrame(() => {
        renderResizeHandle();
      });
    };

    editor.on('update', handleUpdate);
    handleUpdate();

    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor]);

  // content prop이 변경될 때 에디터 내용 업데이트
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  // 이미지 업로드 핸들러 수정
  const handleImageUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || !editor || isUploading) return;

      setIsUploading(true);

      try {
        for (const file of Array.from(files)) {
          const MAX_FILE_SIZE = 5 * 1024 * 1024;
          if (file.size > MAX_FILE_SIZE) {
            alert(
              `이미지 크기가 너무 큽니다. 5MB 이하만 업로드해주세요: ${file.name}`
            );
            continue;
          }

          if (!file.type.startsWith('image/')) {
            alert(`이미지 파일만 업로드 가능합니다: ${file.name}`);
            continue;
          }

          const tempId = crypto.randomUUID();

          try {
            setUploadingFileName(file.name);
            const formData = new FormData();
            formData.append('files', file);

            const res = await fetchApi('/api/v1/notices/media/images/upload', {
              method: 'POST',
              body: formData,
            });

            if (!res.ok) {
              throw new Error(`서버 응답 오류 (status: ${res.status})`);
            }

            const data = await res.json();
            if (!data || !Array.isArray(data) || data.length === 0) {
              throw new Error('서버 응답 데이터가 유효하지 않습니다');
            }

            const uploadedImage = data[0];
            const { id: noticeImageId, url: imageUrl } = uploadedImage;

            // 이미지 삽입 - customImage 노드 사용
            editor
              .chain()
              .focus()
              .insertContent({
                type: 'customImage',
                attrs: {
                  src: imageUrl,
                  'data-id': String(noticeImageId),
                  'data-temp-id': tempId,
                  'data-align': 'center',
                  width: null,
                  height: null,
                  style: null,
                },
              })
              .run();

            console.log('이미지 삽입 완료:', imageUrl);
            onImageUploadSuccess?.(noticeImageId);
          } catch (error) {
            console.error('이미지 업로드 실패:', error);
            alert(
              `이미지 업로드 실패 (${file.name}): ${
                error instanceof Error ? error.message : '알 수 없는 오류'
              }`
            );
          } finally {
            setUploadingFileName('');
          }
        }
      } finally {
        setIsUploading(false);
      }
    },
    [editor, isUploading, onImageUploadSuccess]
  );

  // 이미지 업로드 버튼 클릭 핸들러
  const addImage = useCallback(() => {
    if (!isMounted || !editor) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.onchange = (e) => {
      e.preventDefault();
      handleImageUpload((e.target as HTMLInputElement).files);
      input.value = '';
    };
    input.click();
  }, [editor, handleImageUpload, isMounted]);

  // 스타일 추가
  const additionalStyles = `
    .hidden-file-info {
      display: none;
    }
  `;

  if (!editor || !isMounted) return null;

  return (
    <div className="flex flex-col h-full">
      {/* 에디터 툴바 */}
      <div className="flex flex-wrap items-center bg-gray-100 p-2 rounded-t-lg relative">
        <div className="flex mr-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              editor.chain().focus().toggleHeading({ level: 1 }).run();
            }}
            className={`p-2 hover:bg-gray-300 border-none outline-none ${
              editor.isActive('heading', { level: 1 })
                ? 'bg-gray-300 text-black'
                : 'text-gray-600 bg-transparent'
            }`}
            title="제목 1"
            type="button"
          >
            <span className="text-lg font-semibold">H1</span>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              editor.chain().focus().toggleHeading({ level: 2 }).run();
            }}
            className={`p-2 hover:bg-gray-300 border-none outline-none ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-gray-300 text-black'
                : 'text-gray-600 bg-transparent'
            }`}
            title="제목 2"
            type="button"
          >
            <span className="text-lg font-semibold">H2</span>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              editor.chain().focus().toggleHeading({ level: 3 }).run();
            }}
            className={`p-2 hover:bg-gray-300 border-none outline-none ${
              editor.isActive('heading', { level: 3 })
                ? 'bg-gray-300 text-black'
                : 'text-gray-600 bg-transparent'
            }`}
            title="제목 3"
            type="button"
          >
            <span className="text-lg font-semibold">H3</span>
          </button>
        </div>

        <div className="flex items-center mx-2 text-gray-400">
          <span>|</span>
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.chain().focus().toggleBold().run();
          }}
          className={`p-2 mx-1 hover:bg-gray-300 border-none outline-none bg-transparent ${
            editor.isActive('bold') ? 'bg-gray-300' : ''
          }`}
          title="굵게"
          type="button"
        >
          <span className="material-icons" style={{ fontSize: '20px' }}>
            format_bold
          </span>
        </button>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.chain().focus().toggleItalic().run();
          }}
          className={`p-2 mx-1 hover:bg-gray-300 border-none outline-none bg-transparent ${
            editor.isActive('italic') ? 'bg-gray-300' : ''
          }`}
          title="기울임"
          type="button"
        >
          <span className="material-icons" style={{ fontSize: '20px' }}>
            format_italic
          </span>
        </button>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.chain().focus().toggleUnderline().run();
          }}
          className={`p-2 mx-1 hover:bg-gray-300 border-none outline-none bg-transparent ${
            editor.isActive('underline') ? 'bg-gray-300' : ''
          }`}
          title="밑줄"
          type="button"
        >
          <span className="material-icons" style={{ fontSize: '20px' }}>
            format_underlined
          </span>
        </button>

        <div className="flex items-center mx-2 text-gray-400">
          <span>|</span>
        </div>

        <div className="flex mx-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              editor.chain().focus().setTextAlign('left').run();
            }}
            className={`p-2 hover:bg-gray-300 border-none outline-none bg-transparent ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : ''
            }`}
            title="왼쪽 정렬"
            type="button"
          >
            <span className="material-icons" style={{ fontSize: '20px' }}>
              format_align_left
            </span>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              editor.chain().focus().setTextAlign('center').run();
            }}
            className={`p-2 hover:bg-gray-300 border-none outline-none bg-transparent ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : ''
            }`}
            title="가운데 정렬"
            type="button"
          >
            <span className="material-icons" style={{ fontSize: '20px' }}>
              format_align_center
            </span>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              editor.chain().focus().setTextAlign('right').run();
            }}
            className={`p-2 hover:bg-gray-300 border-none outline-none bg-transparent ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : ''
            }`}
            title="오른쪽 정렬"
            type="button"
          >
            <span className="material-icons" style={{ fontSize: '20px' }}>
              format_align_right
            </span>
          </button>
        </div>

        <div className="flex items-center mx-2 text-gray-400">
          <span>|</span>
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.chain().focus().toggleBlockquote().run();
          }}
          className={`p-2 mx-1 hover:bg-gray-300 border-none outline-none bg-transparent ${
            editor.isActive('blockquote') ? 'bg-gray-300' : ''
          }`}
          title="인용구"
          type="button"
        >
          <span className="material-icons" style={{ fontSize: '20px' }}>
            format_quote
          </span>
        </button>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addImage();
          }}
          className={`p-2 mx-1 hover:bg-gray-300 border-none outline-none bg-transparent ${
            isUploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title={isUploading ? `업로드 중: ${uploadingFileName}` : '이미지'}
          disabled={isUploading}
          type="button"
        >
          <span className="material-icons" style={{ fontSize: '20px' }}>
            {isUploading ? 'hourglass_empty' : 'image'}
          </span>
        </button>

        <div className="flex items-center mx-2 text-gray-400">
          <span>|</span>
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.chain().focus().toggleCodeBlock().run();
          }}
          className={`p-2 mx-1 hover:bg-gray-300 border-none outline-none bg-transparent ${
            editor.isActive('codeBlock') ? 'bg-gray-300' : ''
          }`}
          title="코드 블록"
          type="button"
        >
          <span className="material-icons" style={{ fontSize: '20px' }}>
            code
          </span>
        </button>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.chain().focus().toggleBulletList().run();
          }}
          className={`p-2 mx-1 hover:bg-gray-300 border-none outline-none bg-transparent ${
            editor.isActive('bulletList') ? 'bg-gray-300' : ''
          }`}
          title="글머리 기호"
          type="button"
        >
          <span className="material-icons" style={{ fontSize: '20px' }}>
            format_list_bulleted
          </span>
        </button>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editor.chain().focus().toggleOrderedList().run();
          }}
          className={`p-2 mx-1 hover:bg-gray-300 border-none outline-none bg-transparent ${
            editor.isActive('orderedList') ? 'bg-gray-300' : ''
          }`}
          title="번호 매기기"
          type="button"
        >
          <span className="material-icons" style={{ fontSize: '20px' }}>
            format_list_numbered
          </span>
        </button>
      </div>

      {/* 에디터 본문 */}
      <div className="flex-grow overflow-auto">
        <div className="CodeMirror-scroll" ref={editorContainerRef}>
          <div className="CodeMirror-sizer">
            <div style={{ position: 'relative', top: '0px' }}>
              <div className="CodeMirror-lines" role="presentation">
                <div
                  role="presentation"
                  style={{ position: 'relative', outline: 'none' }}
                >
                  <div className="tiptap-content-wrapper">
                    <EditorContent className="h-full" editor={editor} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 파일 첨부 섹션 - 하단에 고정 */}
      <div className="mt-4 border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">첨부파일</h3>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addFile();
            }}
            className={`px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isUploading}
            type="button"
          >
            <span className="material-icons mr-2" style={{ fontSize: '20px' }}>
              {isUploading ? 'hourglass_empty' : 'attach_file'}
            </span>
            파일 추가
          </button>
        </div>

        {/* 업로드된 파일 목록 */}
        <div className="space-y-2">
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between bg-gray-50 p-2 rounded"
            >
              <div className="flex items-center">
                <span className="material-icons mr-2 text-gray-500">
                  description
                </span>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {file.name}
                </a>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFileDelete(file.id);
                }}
                className="text-red-500 hover:text-red-700"
                type="button"
              >
                <span className="material-icons" style={{ fontSize: '20px' }}>
                  delete
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 이미지를 위한 버블 메뉴 추가 */}
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          shouldShow={({ editor }) => editor.isActive('customImage')}
        >
          <div className="flex bg-white shadow-lg rounded-lg p-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                editor
                  .chain()
                  .focus()
                  .updateAttributes('customImage', { 'data-align': 'left' })
                  .run();
              }}
              className={`p-1 mx-1 hover:bg-gray-200 rounded ${
                editor.isActive('customImage', { 'data-align': 'left' })
                  ? 'bg-gray-300'
                  : ''
              }`}
              type="button"
            >
              <span className="material-icons" style={{ fontSize: '20px' }}>
                format_align_left
              </span>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                editor
                  .chain()
                  .focus()
                  .updateAttributes('customImage', { 'data-align': 'center' })
                  .run();
              }}
              className={`p-1 mx-1 hover:bg-gray-200 rounded ${
                editor.isActive('customImage', { 'data-align': 'center' })
                  ? 'bg-gray-300'
                  : ''
              }`}
              type="button"
            >
              <span className="material-icons" style={{ fontSize: '20px' }}>
                format_align_center
              </span>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                editor
                  .chain()
                  .focus()
                  .updateAttributes('customImage', { 'data-align': 'right' })
                  .run();
              }}
              className={`p-1 mx-1 hover:bg-gray-200 rounded ${
                editor.isActive('customImage', { 'data-align': 'right' })
                  ? 'bg-gray-300'
                  : ''
              }`}
              type="button"
            >
              <span className="material-icons" style={{ fontSize: '20px' }}>
                format_align_right
              </span>
            </button>
          </div>
        </BubbleMenu>
      )}

      {/* 링크 삽입 모달 */}
      {showLinkModal && (
        <div
          className="absolute z-50"
          style={{
            top: linkButtonRef.current
              ? linkButtonRef.current.offsetTop +
                linkButtonRef.current.offsetHeight +
                5
              : 0,
            left: linkButtonRef.current ? linkButtonRef.current.offsetLeft : 0,
          }}
          ref={linkModalRef}
        >
          <div
            className="bg-[#ffffff] p-4 rounded-lg shadow-lg border border-gray-200"
            style={{ width: '320px' }}
          >
            <h3 className="text-base font-medium mb-3 m-[10px]">링크 삽입</h3>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="URL 입력"
              className="w-full px-3 py-2 border border-gray-300 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-[#980ffa] m-[10px]"
              style={{ width: '270px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  editor
                    .chain()
                    .focus()
                    .insertContent(
                      `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkUrl}</a>`
                    )
                    .run();
                  setShowLinkModal(false);
                  setLinkUrl('');
                }
              }}
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowLinkModal(false)}
                className="px-3 py-1 bg-gray-200 text-[#000000] rounded hover:bg-gray-300 m-[10px] border-none rounded-[10px] p-[5px]"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons');

        .codemirror-like-editor {
          font-family: monospace;
          height: 100%;
          font-size: 14px;
          position: relative;
        }

        .CodeMirror-scroll {
          min-height: 300px;
          border: 1px solid #f9fafb;
          border-radius: 4px;
          overflow: auto;
          position: relative;
          background: #ffffff;
          padding: 16px;
        }

        .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #aaa;
          pointer-events: none;
          height: 0;
        }

        .ProseMirror {
          outline: none;
          padding: 8px;
          caret-color: #000;
          min-height: calc(100% - 16px);
          background: #ffffff;
        }

        .ProseMirror p.is-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #aaa;
          pointer-events: none;
          height: 0;
        }

        .tiptap-content-wrapper {
          background: #ffffff;
          border-radius: 15px;
          height: 100%;
          overflow: hidden;
        }

        .tiptap-content-wrapper .ProseMirror {
          outline: none;
          height: auto;
          overflow-y: auto;
          min-height: 300px;
          padding: 16px 20px;
          background: #ffffff;
        }

        .ProseMirror p.is-empty:first-child::before {
          color: #9ca3af;
          content: '당신의 이야기를 적어보세요...';
        }

        .tiptap-content-wrapper .ProseMirror {
          outline: none;
        }

        .tiptap-content-wrapper img {
          max-width: 100%;
          margin: 0 auto;
          display: block;
        }

        /* 전역 정렬 스타일 추가 */
        [data-text-align='center'] {
          text-align: center !important;
        }

        [data-text-align='right'] {
          text-align: right !important;
        }

        [data-text-align='left'] {
          text-align: left !important;
        }

        /* 이미지 정렬 관련 스타일 - .image-resizer에 직접 적용 */
        .image-resizer.image-align-left {
          margin-left: 0 !important;
          margin-right: auto !important;
        }

        .image-resizer.image-align-center {
          margin-left: auto !important;
          margin-right: auto !important;
        }

        .image-resizer.image-align-right {
          margin-left: auto !important;
          margin-right: 0 !important;
        }

        /* 이미지 리사이저 스타일 - display: table 로 변경 */
        .image-resizer {
          /* display: block; */
          display: table; /* 변경: 너비를 콘텐츠(이미지)에 맞춤 */
          position: relative;
          /* margin-top/bottom 제거 - 필요 시 img에 적용 */
          /* margin-top: 0.5em; */
          /* margin-bottom: 0.5em; */
          max-width: 100%;
          /* box-shadow 제거 - 선택 시에만 표시 */
          /* box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1); */
          border-radius: 2px;
          overflow: visible;
          line-height: 0; /* 이미지 아래 여백 제거 */
        }

        /* 이미지 자체의 스타일 */
        .image-resizer img {
          display: block; /* 유지 */
          max-width: 100%;
          border-radius: 2px;
          /* 필요 시 여기에 마진 추가 */
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }

        /* 리사이징 중인 이미지에 강조 표시 */
        .image-resizer.resizing {
          outline: 2px solid #4263eb;
          box-shadow: 0 0 8px rgba(66, 99, 235, 0.5);
        }

        /* 전방향 리사이즈 핸들 스타일 */
        .image-resizer .resize-trigger {
          position: absolute !important;
          width: 12px !important;
          height: 12px !important;
          border-radius: 50% !important;
          background-color: #4263eb !important;
          border: 2px solid white !important;
          z-index: 9999 !important;
          opacity: 0;
          transition: opacity 0.3s ease;
          box-shadow: 0 0 3px rgba(0, 0, 0, 0.5) !important;
          pointer-events: auto !important;
        }

        .image-resizer:hover .resize-trigger {
          opacity: 1 !important;
        }

        /* 드래그 중에는 항상 표시 */
        .image-resizer:active .resize-trigger {
          opacity: 1 !important;
        }

        /* ProseMirror 선택 노드일 때 항상 표시 */
        .ProseMirror-selectednode .resize-trigger {
          opacity: 1 !important;
        }

        /* 이미지가 선택됐을 때 하이라이트 효과 - .image-resizer에 적용 */
        .image-resizer.ProseMirror-selectednode {
          outline: 2px solid #4263eb;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1); /* 선택 시 그림자 추가 */
          border-radius: 2px;
        }

        /* --- 헤딩 스타일 정리 시작 --- */
        .ProseMirror h1,
        .ProseMirror h2,
        .ProseMirror h3,
        .ProseMirror h4,
        .ProseMirror h5,
        .ProseMirror h6 {
          font-weight: bold;
          margin-bottom: 0.5em;
          color: #000000; /* 헤딩 색상 기본값 */
        }

        .ProseMirror h1 {
          font-size: 28px;
          line-height: 1.2;
          margin-top: 0.8em;
        }

        .ProseMirror h2 {
          font-size: 24px;
          line-height: 1.3;
          margin-top: 0.7em;
        }

        .ProseMirror h3 {
          font-size: 20px;
          line-height: 1.4;
          margin-top: 0.6em;
        }
        /* --- 헤딩 스타일 정리 끝 --- */

        .ProseMirror blockquote {
          border-left: 3px solid #000000;
          padding-left: 1em;
          margin-left: 0;
          color: #000000; /* blockquote 색상 추가 */
        }

        .ProseMirror pre {
          background-color: #f5f5f5;
          padding: 0.5em;
          border-radius: 4px;
          font-family: 'Courier New', Courier, monospace;
          border: 1px solid #f9fafb;
        }

        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1em;
          color: #000000; /* 리스트 전체 색상 */
        }

        /* 리스트 마커 스타일 */
        .ProseMirror ul {
          list-style-type: disc;
        }
        .ProseMirror ol {
          list-style-type: decimal;
        }
        .ProseMirror ul li::marker,
        .ProseMirror ol li::marker {
          color: #000000; /* 마커 색상 명시 */
        }

        /* 기존에 있던 색상 강제 적용 부분에서 헤딩 제거 */
        .ProseMirror blockquote,
        .ProseMirror ul li::marker,
        .ProseMirror ol li::marker {
          /* color: #000000 !important; <- 이 규칙은 각 요소 스타일에 포함시켰으므로 제거 */
        }

        /* 기존 tiptap-content-wrapper 관련 헤딩 스타일 제거 */
        /*
        .tiptap-content-wrapper h1 { ... }
        .tiptap-content-wrapper h2 { ... }
        .tiptap-content-wrapper h3 { ... }
        */

        /* 이미지 내부 img 태그 스타일 */
        .image-resizer img {
          display: block;
          max-width: 100%;
          border-radius: 2px;
        }

        ${additionalStyles}
      `}</style>
    </div>
  );
};

export default TiptapEditor;
