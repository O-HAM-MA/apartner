package com.ohammer.apartner.domain.notice.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
@Schema(description = "공지사항 게시글 첨부파일 상세 정보 응답 DTO")
public class MediaInfoResponseDto {

    @Schema(description = "첨부파일/이미지 ID", example = "23")
    private Long id;

    @Schema(description = "S3 업로드 URL 또는 접근 URL", example = "https://bucket.s3.ap-northeast-2.amazonaws.com/notice/1/images/abcd.png")
    private String url;

    @Schema(description = "원본 파일명", example = "사진1.png")
    private String originalName;

    @Schema(description = "임시 파일 여부", example = "false")
    private Boolean isTemp;

    @Schema(description = "임시 파일 만료일시", example = "2025-05-23T09:00:00")
    private LocalDateTime expiresAt;

}