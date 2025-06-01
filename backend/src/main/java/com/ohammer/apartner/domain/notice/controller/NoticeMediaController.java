package com.ohammer.apartner.domain.notice.controller;

import com.ohammer.apartner.domain.notice.dto.response.MediaInfoResponseDto;
import com.ohammer.apartner.domain.notice.dto.response.MediaUploadResponseDto;
import com.ohammer.apartner.domain.notice.service.NoticeMediaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/notices/media")
@Tag(name = "공지사항 게시물 미디어(사진, 파일) 관리")
public class NoticeMediaController {

    private final NoticeMediaService noticeMediaService;

    @PostMapping(value = "/images/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "공지사항 게시글 이미지 등록", description = "공지사항 에디터에 사용될 이미지를 업로드합니다.")
    public ResponseEntity<List<MediaUploadResponseDto>> uploadImages(@RequestPart("files") List<MultipartFile> files) {
        return ResponseEntity.ok(noticeMediaService.uploadImages(files));
    }

    @PostMapping(value = "/files/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "공지사항 게시글 파일 등록", description = "공지사항에 첨부할 파일을 업로드합니다.")
    public ResponseEntity<List<MediaUploadResponseDto>> uploadFiles(@RequestPart("files") List<MultipartFile> files) {
        return ResponseEntity.ok(noticeMediaService.uploadFiles(files));
    }

    @GetMapping("/images/{noticeImageId}")
    @Operation(summary = "공지사항 게시글 이미지 정보 조회",
            description = "게시글에 첨부된 이미지를 ID로 조회합니다. S3 접근 URL, 원본 파일명, 임시 여부 등을 반환합니다.")
    public ResponseEntity<MediaInfoResponseDto> getImageInfo(@PathVariable(name = "noticeImageId") Long noticeImageId) {
        return ResponseEntity.ok(noticeMediaService.getImageInfo(noticeImageId));
    }

    @GetMapping("/files/{noticeFileId}")
    @Operation(summary = "공지사항 게시글 파일 정보 조회",
            description = "게시글에 첨부된 파일을 ID로 조회합니다. S3 접근 URL, 원본 파일명, 임시 여부 등을 반환합니다.")
    public ResponseEntity<MediaInfoResponseDto> getFileInfo(@PathVariable(name = "noticeFileId") Long noticeFileId) {
        return ResponseEntity.ok(noticeMediaService.getFileInfo(noticeFileId));
    }

    @DeleteMapping("/images/{noticeImageId}")
    @Operation(summary = "임시 이미지 삭제", description = "사용자가 업로드한 임시 이미지를 삭제합니다. S3와 DB 모두에서 제거")
    public ResponseEntity<Void> deleteImage(@PathVariable(name = "noticeImageId") Long noticeImageId) {
        noticeMediaService.deleteImage(noticeImageId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/files/{noticeFileId}")
    @Operation(summary = "임시 파일 삭제", description = "사용자가 업로드한 임시 파일을 삭제합니다. S3와 DB 모두에서 제거")
    public ResponseEntity<Void> deleteFile(@PathVariable(name = "noticeFileId") Long noticeFileId) {
        noticeMediaService.deleteFile(noticeFileId);
        return ResponseEntity.noContent().build();
    }
}