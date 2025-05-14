package com.ohammer.apartner.domain.facility.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
@Schema(description = "공용시설 예약 조회 [사용자] 응답 DTO")
public class FacilityReservationSummaryDto {

    @Schema(description = "예약한 공용시설 이름", example = "헬스장")
    private String facilityName;

    @Schema(description = "예약 일시", example = "2025-05-15 09:00-11:00")
    private String reservationTime;

    @Schema(description = "신청 일시", example = "2025-05-13 10:10")
    private String createdAt;

    @Schema(description = "예약 상태", example = "PENDING")
    private String status;
}