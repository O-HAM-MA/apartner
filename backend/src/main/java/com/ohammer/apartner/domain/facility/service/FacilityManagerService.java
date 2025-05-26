package com.ohammer.apartner.domain.facility.service;

import com.ohammer.apartner.domain.apartment.entity.Apartment;
import com.ohammer.apartner.domain.apartment.repository.ApartmentRepository;
import com.ohammer.apartner.domain.facility.dto.request.FacilityCreateRequestDto;
import com.ohammer.apartner.domain.facility.dto.request.FacilityUpdateRequestDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityManagerSimpleResponseDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityReservationManagerDto;
import com.ohammer.apartner.domain.facility.entity.Facility;
import com.ohammer.apartner.domain.facility.entity.FacilityInstructor;
import com.ohammer.apartner.domain.facility.entity.FacilityReservation;
import com.ohammer.apartner.domain.facility.repository.FacilityInstructorRepository;
import com.ohammer.apartner.domain.facility.repository.FacilityRepository;
import com.ohammer.apartner.domain.facility.repository.FacilityReservationRepository;
import com.ohammer.apartner.global.Status;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
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
    private final FacilityInstructorRepository facilityInstructorRepository;

    // 공용시설 등록
    @Transactional
    public Long createFacility(FacilityCreateRequestDto facilityCreateRequestDto, Long apartmentId) {
        Apartment apartment = apartmentRepository.findById(apartmentId)
                .orElseThrow(() -> new EntityNotFoundException("아파트를 찾을 수 없습니다."));

        if (facilityRepository.existsByApartmentIdAndNameAndStatus(
                apartmentId, facilityCreateRequestDto.getName(), Status.ACTIVE)) {
            throw new IllegalArgumentException("이미 운영 중인 시설 이름입니다.");
        }

        if (facilityCreateRequestDto.getOpenTime().equals(facilityCreateRequestDto.getCloseTime())) {
            throw new IllegalArgumentException("시작 시간과 종료 시간이 같을 수 없습니다.");
            // openTime > closeTime은 "익일 운영"으로 허용
            // openTime < closeTime은 "당일 운영"으로 허용
        }

        Facility facility = Facility.builder()
                .name(facilityCreateRequestDto.getName())
                .description(facilityCreateRequestDto.getDescription())
                .openTime(facilityCreateRequestDto.getOpenTime())
                .closeTime(facilityCreateRequestDto.getCloseTime())
                .apartment(apartment)
                .status(Status.ACTIVE) // 등록 시 ACTIVE
                .build();
        facilityRepository.save(facility);

        return facility.getId();
    }

    // 공용시설 수정
    @Transactional
    public void updateFacility(Long facilityId, FacilityUpdateRequestDto facilityUpdateRequestDto, Long apartmentId) {
        Facility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new EntityNotFoundException("공용시설을 찾을 수 없습니다."));

        if (facilityRepository.existsByApartmentIdAndNameAndStatusAndIdNot(
                apartmentId, facilityUpdateRequestDto.getName(), Status.ACTIVE, facilityId)) {
            throw new IllegalArgumentException("이미 운영 중인 시설 이름입니다.");
        }

        if (facilityUpdateRequestDto.getOpenTime().equals(facilityUpdateRequestDto.getCloseTime())) {
            throw new IllegalArgumentException("시작 시간과 종료 시간이 같을 수 없습니다.");
        }

        facility.update(
                facilityUpdateRequestDto.getName(),
                facilityUpdateRequestDto.getDescription(),
                facilityUpdateRequestDto.getOpenTime(),
                facilityUpdateRequestDto.getCloseTime()
        );
        facility.setModifiedAt(LocalDateTime.now());
    }

    // 공용시설 삭제 (비활성화)
    @Transactional
    public void deleteFacility(Long facilityId) {
        Facility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new EntityNotFoundException("시설을 찾을 수 없습니다."));

        if (facility.getStatus() == Status.INACTIVE) {
            throw new IllegalStateException("이미 비활성화된 시설입니다.");
        }
        facility.setInactive();
        facility.setModifiedAt(LocalDateTime.now());

        // 해당 시설에 속한 모든 강사도 INACTIVE 처리
        List<FacilityInstructor> instructors = facilityInstructorRepository.findByFacilityId(facilityId);
        for (FacilityInstructor instructor : instructors) {
            if (instructor.getStatus() == Status.ACTIVE) {
                instructor.setStatus(Status.INACTIVE);
                instructor.setModifiedAt(LocalDateTime.now());
            }
        }
    }

    // 시설 목록 조회
    public List<FacilityManagerSimpleResponseDto> getFacilityList(Long apartmentId) {
        List<Facility> facilities = facilityRepository.findByApartmentIdAndStatus(apartmentId, Status.ACTIVE);

        return facilities.stream()
                .map(f -> FacilityManagerSimpleResponseDto.builder()
                        .facilityId(f.getId())
                        .facilityName(f.getName())
                        .description(f.getDescription())
                        .openTime(f.getOpenTime())
                        .closeTime(f.getCloseTime())
                        .build())
                .collect(Collectors.toList());
    }

    // 시설 단건 조회
    public FacilityManagerSimpleResponseDto getFacility(Long facilityId, Long apartmentId) {
        Facility facility = facilityRepository.findByIdAndApartmentId(facilityId, apartmentId)
                .orElseThrow(() -> new IllegalArgumentException("시설을 찾을 수 없습니다."));
        return FacilityManagerSimpleResponseDto.from(facility);
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
