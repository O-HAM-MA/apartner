package com.ohammer.apartner.domain.facility.dto.response;

import com.ohammer.apartner.domain.facility.entity.FacilityTimeSlot;
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
public class TimeSlotSimpleResponseDto {

    @Schema(description = "타임슬롯 ID", example = "123")
    private Long timeSlotId;

    @Schema(description = "프로그램명", example = "초보반")
    private String scheduleName;

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

    public static TimeSlotSimpleResponseDto from(FacilityTimeSlot slot) {
        boolean full = (slot.getReservedCount() != null) && (slot.getMaxCapacity() != null)
                && (slot.getReservedCount() >= slot.getMaxCapacity());
        return TimeSlotSimpleResponseDto.builder()
                .timeSlotId(slot.getId())
                .scheduleName(slot.getSchedule().getScheduleName())
                .date(slot.getDate())
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .maxCapacity(slot.getMaxCapacity())
                .reservedCount(slot.getReservedCount())
                .isFull(full)
                .build();
    }
}
