package com.ohammer.apartner.domain.facility.service;

import com.ohammer.apartner.domain.facility.dto.response.FacilityReservationManagerDto;
import com.ohammer.apartner.domain.facility.entity.FacilityReservation;
import com.ohammer.apartner.domain.facility.repository.FacilityReservationRepository;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FacilityManagerService {

    private final FacilityReservationRepository facilityReservationRepository;

    // 예약 목록 조회
    public Page<FacilityReservationManagerDto> getReservations(
            LocalDate date,
            Long facilityId,
            String statusStr,
            Pageable pageable
    ) {
        FacilityReservation.Status status = null;
        if (statusStr != null && !statusStr.isBlank()) {
            try {
                status = FacilityReservation.Status.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("잘못된 예약 상태입니다: " + statusStr);
            }
        }

        Page<FacilityReservation> reservations = facilityReservationRepository.findByManagerFilter(
                date, facilityId, status, pageable
        );

        return reservations.map(this::convertToDto);
    }

    private FacilityReservationManagerDto convertToDto(FacilityReservation r) {
        String reservationTime = String.format("%s %02d:%02d-%02d:%02d",
                r.getDate(),
                r.getStartTime().getHour(), r.getStartTime().getMinute(),
                r.getEndTime().getHour(), r.getEndTime().getMinute()
        );

        return new FacilityReservationManagerDto(
                r.getUser().getUserName(),
                r.getUser().getBuilding().getBuildingNumber(),
                r.getUser().getUnit().getUnitNumber(),
                r.getFacility().getName(),
                reservationTime,
                r.getCreatedAt().toString(),
                r.getStatus().name()
        );
    }

    
}
