package com.ohammer.apartner.domain.facility.dto.statistics;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
@Schema(description = "공용시설 동별 이용 횟수 DTO")
public class BuildingUsageCountDto {

    @Schema(description = "사용자 주소(동)", example = "101동")
    private String buildingNumber;

    @Schema(description = "공용시설 이용 횟수", example = "5")
    private Long reservationCount;
}
