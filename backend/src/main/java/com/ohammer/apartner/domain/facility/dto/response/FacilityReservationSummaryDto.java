package com.ohammer.apartner.domain.facility.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class FacilityReservationSummaryDto {

    private String facilityName;

    private String reservationTime; // 예: "2024-05-15 10:00-12:00"

    private String createdAt;

    private String status;
}