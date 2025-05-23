package com.ohammer.apartner.domain.facility.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
@Schema(description = "타임슬롯 조회 응답 DTO")
public class TimeSlotResponseDto {

    @Schema(description = "타임슬롯 ID", example = "123")
    private Long timeSlotId;

    @Schema(description = "강사 이름(없을 수 있음)", example = "박태환")
    private String instructorName;

    @Schema(description = "날짜", example = "2025-06-10")
    private LocalDate date;

    @Schema(description = "시작 시간", example = "10:00")
    private LocalTime startTime;

    @Schema(description = "종료 시간", example = "11:00")
    private LocalTime endTime;

    @Schema(description = "최대 예약 가능 인원", example = "10")
    private Long maxCapacity;

    @Schema(description = "현재 예약 인원", example = "4")
    private Long reservedCount;

    @Schema(description = "마감 여부", example = "false")
    private Boolean isFull;

}
