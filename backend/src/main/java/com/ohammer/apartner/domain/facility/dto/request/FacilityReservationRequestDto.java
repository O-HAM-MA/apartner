package com.ohammer.apartner.domain.facility.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "공용시설 예약 요청 DTO")
public class FacilityReservationRequestDto {

    @Schema(description = "예약할 날짜", example = "2025-05-15")
    private LocalDate date;

    @Schema(description = "예약 시작 시간", example = "09:00:00")
    private LocalTime startTime;

    @Schema(description = "예약 종료 시간", example = "11:00:00")
    private LocalTime endTime;
}
