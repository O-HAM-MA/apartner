package com.ohammer.apartner.domain.notice.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "공지사항 게시글 등록 요청 DTO")
public class NoticeCreateRequestDto {

    @Schema(description = "게시글 제목", example = "엘레베이터 정기점검 안내")
    private String title;

    @Schema(description = "게시글 내용", example = "점검일시: 2025년 5월 15일 14시 ~ 16시")
    private String content;

    @Schema(description = "게시글 대상: 전체/동별 선택 - buildingId", example = "101동 / null일 경우 전체 공지")
    private Long buildingId;

    @Schema(description = "tiptap에 삽입된 이미지 ID들", example = "[ ]")
    private List<Long> imageIds; // optional

    @Schema(description = "tiptap에 삽입된 첨부파일 ID들", example = "[ ]")
    private List<Long> fileIds; // optional
}