package com.ohammer.apartner.domain.facility.dto.response;

import com.ohammer.apartner.domain.facility.entity.FacilityInstructorSchedule;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "강사 스케줄 목록 조회 응답 DTO")
public class InstructorScheduleSimpleResponseDto {

    @Schema(description = "스케쥴 ID", example = "1")
    private Long scheduleId;

    @Schema(description = "프로그램명", example = "초보반")
    private String scheduleName;

    @Schema(description = "근무 요일", example = "TUESDAY")
    private String dayOfWeek;

    @Schema(description = "근무 시작 시간", example = "15:00")
    private LocalTime startTime;

    @Schema(description = "근무 종료 시간", example = "18:00")
    private LocalTime endTime;

    @Schema(description = "예약 단위(분)", example = "60")
    private Long slotMinutes;

    @Schema(description = "한 슬롯(타임)당 최대 수용 가능 인원", example = "20")
    private Long capacity;

    public static InstructorScheduleSimpleResponseDto from(FacilityInstructorSchedule s) {
        return InstructorScheduleSimpleResponseDto.builder()
                .scheduleId(s.getId())
                .scheduleName(s.getScheduleName())
                .dayOfWeek(s.getDayOfWeek().toString())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .slotMinutes(s.getSlotMinutes())
                .capacity(s.getCapacity())
                .build();
    }
}
