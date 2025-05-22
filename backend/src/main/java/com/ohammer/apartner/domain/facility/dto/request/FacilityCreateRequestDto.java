package com.ohammer.apartner.domain.facility.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "공용시설 등록 요청 DTO")
public class FacilityCreateRequestDto {

    @Schema(description = "등록할 공용시설 이름", example = "수영장")
    @NotBlank(message = "시설명은 필수 입력값입니다.")
    @Size(max = 50, message = "시설명은 50자 이하여야 합니다.")
    private String name;

    @Schema(description = "공용시설 설명", example = "반드시 수영모를 씁시다")
    @NotBlank(message = "시설 설명은 필수 입력값입니다.")
    private String description;

    @Schema(description = "공용시설 운영 시작 시간", example = "06:00")
    @NotNull(message = "운영 시작 시간은 필수입니다.")
    private LocalTime openTime;

    @Schema(description = "공용시설 운영 종료 시간", example = "22:00")
    @NotNull(message = "운영 종료 시간은 필수입니다.")
    private LocalTime closeTime;

    @Schema(description = "자유 이용시간 리스트", example = "[]")
    private List<FreeUseTime> freeUseTimes;

    @Schema(description = "자유 이용 한 타임당 수용 인원", example = "30")
    private Long freeUseCapacity;

    @Schema(description = "예약 단위(분)", example = "60")
    private Long freeUseUnitMinutes;

    @Schema(description = "강사 리스트", example = "a강사")
    private List<InstructorInfo> instructors;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FreeUseTime {
        private DayOfWeek dayOfWeek;      // 요일 (월,화,수 등)
        private LocalTime startTime;
        private LocalTime endTime;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InstructorInfo {
        private String name;                  // 강사명
        private String description;           // 강사소개/설명

        private List<InstructorSchedule> schedules;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InstructorSchedule {
        private DayOfWeek dayOfWeek;          // 예: MONDAY
        private LocalTime startTime;          // 예: 10:00
        private LocalTime endTime;            // 예: 12:00
        private Long capacity;             // 수용 인원
        private Long unitMinutes;          // 한 타임 단위(분), 예: 60
    }
}
