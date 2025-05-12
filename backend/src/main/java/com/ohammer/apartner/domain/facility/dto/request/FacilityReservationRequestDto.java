package com.ohammer.apartner.domain.facility.dto.request;

import java.time.LocalDate;
import java.time.LocalTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FacilityReservationRequestDto {

    private LocalDate date;

    private LocalTime startTime;

    private LocalTime endTime;
}
