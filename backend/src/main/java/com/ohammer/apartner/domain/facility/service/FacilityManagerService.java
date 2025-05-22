package com.ohammer.apartner.domain.facility.service;

import com.ohammer.apartner.domain.apartment.entity.Apartment;
import com.ohammer.apartner.domain.apartment.repository.ApartmentRepository;
import com.ohammer.apartner.domain.facility.dto.request.FacilityCreateRequestDto;
import com.ohammer.apartner.domain.facility.dto.request.FacilityUpdateRequestDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityReservationManagerDto;
import com.ohammer.apartner.domain.facility.entity.Facility;
import com.ohammer.apartner.domain.facility.entity.FacilityReservation;
import com.ohammer.apartner.domain.facility.repository.FacilityRepository;
import com.ohammer.apartner.domain.facility.repository.FacilityReservationRepository;
import com.ohammer.apartner.global.Status;
import jakarta.persistence.EntityNotFoundException;
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

    private final ApartmentRepository apartmentRepository;
    private final FacilityRepository facilityRepository;
    private final FacilityReservationRepository facilityReservationRepository;

    // 공용시설 등록
    @Transactional
    public Long createFacility(FacilityCreateRequestDto facilityCreateRequestDto) {
        Apartment apartment = apartmentRepository.findById(facilityCreateRequestDto.getApartmentId())
                .orElseThrow(() -> new EntityNotFoundException("아파트를 찾을 수 없습니다."));

        Facility facility = Facility.builder()
                .name(facilityCreateRequestDto.getName())
                .description(facilityCreateRequestDto.getDescription())
                .apartment(apartment)
                .status(Status.ACTIVE) // 등록 시 ACTIVE
                .build();

        facilityRepository.save(facility);
        return facility.getId();
    }

    // 공용시설 수정
    @Transactional
    public void updateFacility(Long facilityId, FacilityUpdateRequestDto facilityUpdateRequestDto) {
        Facility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new EntityNotFoundException("공용시설을 찾을 수 없습니다."));

        facility.update(facilityUpdateRequestDto.getName(), facilityUpdateRequestDto.getDescription());
    }

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

    // 예약 상태 변경
    @Transactional
    public void updateReservationStatus(Long facilityReservationId, String newStatusStr) {
        FacilityReservation facilityReservation = facilityReservationRepository.findById(facilityReservationId)
                .orElseThrow(() -> new EntityNotFoundException("예약 정보를 찾을 수 없습니다."));

        if (facilityReservation.getStatus() != FacilityReservation.Status.PENDING) {
            throw new IllegalStateException("예약 상태가 'PENDING'일 때만 상태를 변경할 수 있습니다.");
        }

        FacilityReservation.Status newStatus;
        try {
            newStatus = FacilityReservation.Status.valueOf(newStatusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("잘못된 상태 값 입니다: " + newStatusStr);
        }

        if (newStatus != FacilityReservation.Status.AGREE && newStatus != FacilityReservation.Status.REJECT) {
            throw new IllegalArgumentException("상태는 AGREE 또는 REJECT만 가능합니다.");
        }

        facilityReservation.setStatus(newStatus);
        facilityReservationRepository.save(facilityReservation);
    }

}
