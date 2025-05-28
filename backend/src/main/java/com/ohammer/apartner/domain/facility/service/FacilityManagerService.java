package com.ohammer.apartner.domain.facility.service;

import com.ohammer.apartner.domain.apartment.entity.Apartment;
import com.ohammer.apartner.domain.apartment.repository.ApartmentRepository;
import com.ohammer.apartner.domain.facility.dto.request.FacilityCreateRequestDto;
import com.ohammer.apartner.domain.facility.dto.request.FacilityUpdateRequestDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityReservationManagerDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityReservationSimpleManagerDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilitySimpleResponseDto;
import com.ohammer.apartner.domain.facility.entity.Facility;
import com.ohammer.apartner.domain.facility.entity.FacilityInstructor;
import com.ohammer.apartner.domain.facility.entity.FacilityReservation;
import com.ohammer.apartner.domain.facility.repository.FacilityInstructorRepository;
import com.ohammer.apartner.domain.facility.repository.FacilityRepository;
import com.ohammer.apartner.domain.facility.repository.FacilityReservationRepository;
import com.ohammer.apartner.global.Status;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
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
    public List<FacilitySimpleResponseDto> getFacilityList(Long apartmentId) {
        List<Facility> facilities = facilityRepository.findByApartmentIdAndStatus(apartmentId, Status.ACTIVE);

        return facilities.stream()
                .map(f -> FacilitySimpleResponseDto.builder()
                        .facilityId(f.getId())
                        .facilityName(f.getName())
                        .description(f.getDescription())
                        .openTime(f.getOpenTime())
                        .closeTime(f.getCloseTime())
                        .build())
                .collect(Collectors.toList());
    }

    // 시설 단건 조회
    public FacilitySimpleResponseDto getFacility(Long facilityId, Long apartmentId) {
        Facility facility = facilityRepository.findByIdAndApartmentId(facilityId, apartmentId)
                .orElseThrow(() -> new IllegalArgumentException("시설을 찾을 수 없습니다."));
        return FacilitySimpleResponseDto.from(facility);
    }

    // ---예약 관련
    // 예약 목록 조회
    public List<FacilityReservationSimpleManagerDto> getReservationsByApartment(Long apartmentId) {
        List<FacilityReservation> list = facilityReservationRepository.findByFacility_Apartment_IdOrderByStartTimeDesc(
                apartmentId);
        return list.stream()
                .map(FacilityReservationSimpleManagerDto::from)
                .collect(Collectors.toList());
    }

    // 예약 상세 조회
    public FacilityReservationManagerDto getReservationDetail(Long reservationId) {
        FacilityReservation facilityReservation = facilityReservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("예약 정보 없음"));
        return FacilityReservationManagerDto.from(facilityReservation);
    }

    // 예약 상태 변경
    @Transactional
    public void updateReservationStatus(Long facilityReservationId, FacilityReservation.Status newStatus) {
        FacilityReservation reservation = facilityReservationRepository.findById(facilityReservationId)
                .orElseThrow(() -> new IllegalArgumentException("예약 정보 없음"));

        if (reservation.getStatus() == FacilityReservation.Status.CANCEL) {
            throw new IllegalStateException("이미 취소된 예약은 상태 변경이 불가합니다.");
        }
        if (newStatus == null) {
            throw new IllegalArgumentException("상태값이 없습니다.");
        }
        if (reservation.getStartTime().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("이미 시작된 예약은 상태 변경이 불가합니다.");
        }

        reservation.setStatus(newStatus);
        reservation.setModifiedAt(LocalDateTime.now());
    }

}