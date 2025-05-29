package com.ohammer.apartner.domain.facility.dto.statistics;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
@Schema(description = "공용시설 시간대별 이용 횟수 DTO")
public class TimePeriodUsageDto {

    @Schema(description = "시간대", example = "오전/오후/저녁/야간")
    private String timePeriod;

    @Schema(description = "공용시설 이용 횟수", example = "5")
    private Long reservationCount;
}
