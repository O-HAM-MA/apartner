package com.ohammer.apartner.domain.facility.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
@Schema(description = "공용시설 예약 조회 [관리자] 응답 DTO")
public class FacilityReservationManagerDto {

    @Schema(description = "신청자 이름", example = "신짱구")
    private String userName;

    @Schema(description = "신청자 주소(동)", example = "101동")
    private String building;

    @Schema(description = "신청자 주소(호수)", example = "202호")
    private String unit;

    @Schema(description = "예약한 공용시설 이름", example = "헬스장")
    private String facilityName;       // 시설명

    @Schema(description = "예약 일시", example = "2025-05-15 09:00-11:00")
    private String reservationTime;

    @Schema(description = "신청 일시", example = "2025-05-13 10:10")
    private String createdAt;

    @Schema(description = "예약 상태", example = "PENDING")
    private String status;
}
