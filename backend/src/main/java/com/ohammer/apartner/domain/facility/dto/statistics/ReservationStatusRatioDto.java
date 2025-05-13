package com.ohammer.apartner.domain.facility.dto.statistics;

import com.ohammer.apartner.domain.facility.entity.FacilityReservation;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
@Schema(description = "공용시설 예약 상태 비율 DTO")
public class ReservationStatusRatioDto {

    @Schema(description = "예약 상태", example = "AGREE / PENDING / REJECT / CANCEL")
    private FacilityReservation.Status status;

    @Schema(description = "횟수", example = "5")
    private Long count;
}
