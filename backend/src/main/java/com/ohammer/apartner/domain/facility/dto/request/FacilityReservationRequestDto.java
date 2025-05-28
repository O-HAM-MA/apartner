package com.ohammer.apartner.domain.facility.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "공용시설 예약 요청 DTO")
public class FacilityReservationRequestDto {

    @Schema(description = "타임슬롯 ID", example = "1001")
    private Long timeSlotId;

    @Schema(description = "사용자 요청사항", example = "(선택) 요청사항 입력")
    private String requestMessage;

}
