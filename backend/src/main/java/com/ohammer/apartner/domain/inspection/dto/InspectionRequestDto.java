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
@Schema(description = "점검 일정에 대한 정보가 들어있는 DTO")
public class InspectionRequestDto {
    @NotBlank(message = "시작 시간은 필수요소 입니다")
    @Schema(description = "시작 시간", example = "2025-05-12T00:00")
    private LocalDateTime startAt;

    @NotBlank(message = "종료 시간은 필수요소 입니다")
    @Schema(description = "종료 시간", example = "2025-11-21T00:00")
    private LocalDateTime finishAt;

    //아무래도 공지사항에 등록할려면 이걸 추가해야 할 것 같음
    @NotBlank(message = "점검 제목을 적어주세요")
    @Schema(description = "점검 제목", example = "명장면 다시보기")
    private String title;

    @NotBlank(message = "점검 내용을 적어주세요")
    @Schema(description = "점검 상세 내용", example = "근데 드레이븐\uD83C\uDF85이 문제에요 이 와중에 진짜 예 타워\uD83C\uDFE6 안쪽 그래도 잭키러브\uD83C\uDF85가 문제에요 케넨\uD83C\uDF29없을때 그래도 이쪽도⏩⏩ 달려들어야되는거아닌가요 재키러브\uD83C\uDF85가문제에요 예 스턴걸고 쫓아가자 재키러브\uD83C\uDF85가 아아악\uD83D\uDE31\uD83D\uDE31 잭키러브\uD83C\uDF85\uD83C\uDF85가 문제에요 돈도왕창떨어졌고요\uD83D\uDCB5\uD83D\uDCB5\uD83D\uDCB5\uD83D\uDCB5 재키러브 어떡하나요\uD83D\uDE31\uD83D\uDE31\uD83D\uDE31\uD83D\uDE31 저 재키러브를 또 더블킬 케넨\uD83C\uDF29이없어요\uD83D\uDE45\uD83D\uDE45 재키러브가 퍽퍽\uD83E\uDD1C\uD83E\uDD1C 케넨\uD83C\uDF29\uD83C\uDF29이 없어요 기다려라 근데 이겼어요 좀 그만죽여 나도좀 죽이자\uD83D\uDE08\uD83D\uDE08 더샤이 오고있습니다 트리플킬 그리고 밀면되나요 왜이렇게빨리끝내나요 아이지❓❓\uD83D\uDE30\uD83D\uDE30\uD83D\uDE30\uD83D\uDE22\uD83D\uDE22\uD83D\uDE22이거 16분대 16분되기전에 이건아이지 이건 역대급인데요 와 아니 16분이 안됩니다 와 15분 50초 아이지 야 빨리 끝내자 기록\uD83C\uDF1F\uD83C\uDF1F이라도 세우자 끝났습니다 15분 55초 56초 쥐쥐")
    private String detail;

    @NotBlank(message = "점검 분류를 적어주세요")
    @Schema(description = "점검 분류", example = "소방")
    private String type;
}
