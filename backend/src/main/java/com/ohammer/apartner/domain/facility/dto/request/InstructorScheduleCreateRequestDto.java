package com.ohammer.apartner.domain.facility.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalTime;
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
@Schema(description = "공용시설 강사 일정 등록 요청 DTO")
public class InstructorScheduleCreateRequestDto {

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
}
