package com.ohammer.apartner.domain.facility.dto.request;

import com.ohammer.apartner.domain.facility.entity.FacilityReservation;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "공용시설 예약 상태 변경 요청 DTO")
public class FacilityReservationStatusUpdateDto {

    @Schema(description = "예약 상태", example = "PENDING")
    private FacilityReservation.Status status;
}
