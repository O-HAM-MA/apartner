package com.ohammer.apartner.domain.inspection.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "점검 항목을 업데이트 위한 DTO")
public class InspectionUpdateDto {
    @Schema(description = "시작 시간", example = "2025-05-25T00:00")
    private LocalDateTime startAt;

    @Schema(description = "종료 시간", example = "2025-05-26T00:00")
    private LocalDateTime finishAt;

    //아무래도 공지사항에 등록할려면 이걸 추가해야 할 것 같음
    @Schema(description = "점검 제목", example = "아이스크림 스타스크림")
    private String title;

    @Schema(description = "점검 상세 내용", example = "ルビィちゃん！[「はーい！」] 何が好き？\n" +
            "루비쨩 나니가 스키\n" +
            "루비쨩! 어떤 게 좋아?\n" +
            "\n" +
            "チョコミント　よりも　あ･な･た･♡\n" +
            "쵸코민토 요리모 아나타\n" +
            "민트초코보다도 바･로･너･♡\n" +
            "\n" +
            "歩夢ちゃん！[「はーい！」] 何が好き？\n" +
            "아유무쨩 나니가 스키\n" +
            "아유무쨩! 어떤 게 좋아?\n" +
            "\n" +
            "ストロベリーフレイバー　よりも　あ･な･た･♡\n" +
            "스토로베리이 후레이바아 요리모 아나타\n" +
            "딸기 맛보다도 바･로･너･♡\n" +
            "\n" +
            "四季ちゃん！[「はーい！」] 何が好き？\n" +
            "시키쨩 나니가 스키\n" +
            "시키쨩! 어떤 게 좋아?\n" +
            "\n" +
            "クッキー＆クリーム　よりも　あ･な･た･♡\n" +
            "쿳키이 안도 크리이무 요리모 아나타\n" +
            "쿠키 앤 크림보다도 바･로･너･♡\n" +
            "\n" +
            "みんな[「はーい！」] 何が好き？\n" +
            "민나 나니가 스키\n" +
            "얘들아, 어떤 게 좋아?\n" +
            "\n" +
            "モチロン大好き　AiScReam\n" +
            "모치론 다이스키 AiScReam\n" +
            "당연히 제일 좋아하는 건 AiScReam")
    private String detail;

    @Schema(description = "점검 분류", example = "소방")
    private String type;

    @Schema(description = "점검 결과", example = "CHECKED")
    private String result;
}
