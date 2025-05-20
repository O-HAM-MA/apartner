package com.ohammer.apartner.domain.inspection.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "이슈 등록/수정 요청 DTO")
public class InspectionIssueDto {
    @NotBlank(message = "이슈 내역을 등록해주세요")
    @Schema(description = "넣을 이슈 내용", example = "어어어어! / 어어어 들어가면 큰 일 나죠, 이거는!\n" +
            "아아아아아! / 들어갔어요, 들어갔어요!\n" +
            "으아아아아! / 자, 스파이더 마인 심어놓고\n" +
            "야아아아 박정욱! / 야, 이거 큰일 났습니다, 큰일 났습니다.\n" +
            "아아아아아! / 거기서 탱크 잃으면 큰일이에요!\n" +
            "망했어요~ / 탱크 한 개 깨졌고!\n" +
            "망했어요... 아~ / 벌쳐가 들어가면 무방비상태!\n" +
            "망했어요, 아~ / 자, 여기 마인 심어놓고 쭉 들어갑니다, 임요환!\n" +
            "박정욱~ 박정욱~ / 레이스밖에 막을 수 있는 방법이 없어요, 레이스밖에 없어요!\n" +
            "망했어요, 이 게임 / 아, 박정욱!\n" +
            "아~ 피해가 너무 크다아아아아앜! / 으아아아아아아아!")
    private String description;
}
