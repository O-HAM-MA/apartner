package com.ohammer.apartner.domain.facility.dto.statistics;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
@Schema(description = "공용시설 시설별 이용 횟수 DTO")
public class FacilityUsageCountDto {

    @Schema(description = "공용시설 이름", example = "헬스장")
    private String facilityName;

    @Schema(description = "공용시설 이용 횟수", example = "5")
    private Long reservationCount;
}
