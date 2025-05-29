package com.ohammer.apartner.domain.facility.dto.response;

import com.ohammer.apartner.domain.facility.entity.FacilityReservation;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
@Schema(description = "공용시설 예약 단건 조회 [사용자] 응답 DTO")
public class FacilityReservationUserDto {

    @Schema(description = "예약 ID", example = "1")
    private Long reservationId;

    @Schema(description = "예약한 공용시설 이름", example = "수영장")
    private String facilityName;

    @Schema(description = "예약한 공용시설 강사 이름", example = "박태환")
    private String instructorName;

    @Schema(description = "예약한 공용시설 프로그램 이름", example = "자유형 기초")
    private String programName;

    @Schema(description = "예약 일시", example = "2025-05-28 14:00~15:00")
    private String reservationDateTime;

    @Schema(description = "예약 신청 일시", example = "2025-05-27 13:30")
    private LocalDateTime createdAt;

    @Schema(description = "예약시 요청사항", example = "(선택사항)")
    private String requestMessage;

    @Schema(description = "예약 상태", example = "PENDING")
    private FacilityReservation.Status status;

}