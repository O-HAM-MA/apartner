package com.ohammer.apartner.domain.notice.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
@Schema(description = "공지사항 게시글 조회 응답 DTO")
public class NoticeReadResponseDto {

    @Schema(description = "게시글 번호", example = "1")
    private Long noticeId;

    @Schema(description = "게시글 제목", example = "엘레베이터 정기점검 안내")
    private String title;

    @Schema(description = "게시글 내용", example = "점검일시: 2025년 5월 15일 14시 ~ 16시")
    private String content;

    @Schema(description = "게시글 작성자", example = "관리사무소")
    private String authorName;

    @Schema(description = "게시글 작성일", example = "2025-05-15 09:00")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime createdAt;

    @Schema(description = "게시글 조회수", example = "0")
    private Long viewCount;

    @Schema(description = "게시글 첨부 이미지", example = "엘레베이터.jpg")
    private List<String> imageUrls;

    @Schema(description = "게시글 첨부 파일", example = "엘레베이터_점검_안내문.pdf")
    private List<NoticeFileDto> fileUrls;

    @Getter
    @Builder
    public static class NoticeFileDto {
        private String originalName;
        private String downloadUrl;
        private Long size;
    }
}