package com.ohammer.apartner.domain.facility.dto.statistics;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
@Schema(description = "공용시설 취소율 DTO")
public class CancellationRatioDto {

    @Schema(description = "전체 예약 수", example = "10")
    private Long totalReservations;

    @Schema(description = "취소된 예약 수", example = "2")
    private Long totalCancelled;

    @Schema(description = "취소율", example = "0.2 → 20%")
    private double cancellationRatio;
}
