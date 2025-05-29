package com.ohammer.apartner.domain.facility.dto.request;

import com.ohammer.apartner.domain.facility.entity.FacilityReservation.CancelReasonType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "공용시설 예약 취소 요청 DTO")
public class FacilityReservationCancelDto {

    @Schema(description = "예약 취소 사유 선택", example = "잘못 예약함")
    private CancelReasonType cancelReasonType;

    @Schema(description = "취소 사유 입력", example = "'기타'선택시 입력")
    private String cancelReason;
}
