package com.ohammer.apartner.domain.notice.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
@Schema(description = "매니저 권한 - 공지사항 게시글 목록 조회 응답 DTO")
public class NoticeSummaryResponseDto {

    @Schema(description = "게시글 번호", example = "1")
    private Long noticeId;

    @Schema(description = "게시글 제목", example = "엘레베이터 정기점검 안내")
    private String title;

    @Schema(description = "게시글 작성자", example = "관리사무소")
    private String authorName;

    @Schema(description = "게시글 대상: 전체/동별 선택 - buildingId", example = "1 / null")
    private Long buildingId;

    @Schema(description = "게시글 작성일", example = "2025-05-15 09:00")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime createdAt;

    @Schema(description = "게시글 조회수", example = "0")
    private Long viewCount;
}
