package com.ohammer.apartner.domain.facility.dto.statistics;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
@Schema(description = "공용시설 요일별 이용 횟수 DTO")
public class DayOfWeekUsageDto {

    @Schema(description = "요일", example = "월요일")
    private String dayOfWeek;

    @Schema(description = "공용시설 이용 횟수", example = "5")
    private Long reservationCount;
}
