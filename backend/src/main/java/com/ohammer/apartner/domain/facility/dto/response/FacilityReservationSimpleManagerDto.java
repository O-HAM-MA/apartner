package com.ohammer.apartner.domain.facility.dto.response;

import com.ohammer.apartner.domain.facility.entity.FacilityReservation;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
@Schema(description = "공용시설 사용자 예약 목록 조회 [관리자] 응답 DTO")
public class FacilityReservationSimpleManagerDto {

    @Schema(description = "예약 ID", example = "1")
    private Long reservationId;

    @Schema(description = "신청자 이름", example = "신짱구")
    private String applicantName;

    @Schema(description = "신청자 주소(동)", example = "101동")
    private String building;

    @Schema(description = "신청자 주소(호수)", example = "202호")
    private String unit;

    @Schema(description = "신청한 공용시설 이름", example = "수영장")
    private String facilityName;

    @Schema(description = "신청한 공용시설 강사 이름", example = "박태환")
    private String instructorName;

    @Schema(description = "신청한 예약 일시", example = "2025-05-28 14:00~15:00")
    private String reservationDateTime;

    @Schema(description = "예약 상태", example = "PENDING")
    private FacilityReservation.Status status;

    public static FacilityReservationSimpleManagerDto from(FacilityReservation r) {
        return FacilityReservationSimpleManagerDto.builder()
                .reservationId(r.getId())
                .applicantName(r.getUser().getUserName())
                .building(r.getUser().getBuilding() != null ? r.getUser().getBuilding().getBuildingNumber() : null)
                .unit(r.getUser().getUnit().getUnitNumber())
                .facilityName(r.getFacility().getName())
                .instructorName(
                        r.getTimeSlot().getInstructor() != null ? r.getTimeSlot().getInstructor().getName() : null)
                .reservationDateTime(
                        r.getStartTime().toLocalDate().toString() + " " +
                                r.getStartTime().toLocalTime().toString() + "~" +
                                r.getEndTime().toLocalTime().toString()
                )
                .status(r.getStatus())
                .build();
    }
}