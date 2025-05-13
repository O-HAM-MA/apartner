package com.ohammer.apartner.domain.facility.service;

import com.ohammer.apartner.domain.facility.dto.request.FacilityReservationRequestDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityReservationSummaryDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityResponseDto;
import com.ohammer.apartner.domain.facility.entity.Facility;
import com.ohammer.apartner.domain.facility.entity.FacilityReservation;
import com.ohammer.apartner.domain.facility.entity.FacilityReservationStatus;
import com.ohammer.apartner.domain.facility.repository.FacilityRepository;
import com.ohammer.apartner.domain.facility.repository.FacilityReservationRepository;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FacilityUserService {

    private final UserRepository userRepository;
    private final FacilityRepository facilityRepository;
    private final FacilityReservationRepository facilityReservationRepository;

    // 시설 목록 보기
    public List<FacilityResponseDto> getAllFacilities() {
        return facilityRepository.findAll().stream()
                .map(FacilityResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 예약하기
    @Transactional
    public FacilityReservation reserveFacility(Long userId, Long facilityId, FacilityReservationRequestDto request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Facility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new IllegalArgumentException("시설을 찾을 수 없습니다."));

        // 시작과 종료 시간을 date와 합쳐 LocalDateTime 생성
        LocalDateTime startDateTime = LocalDateTime.of(request.getDate(), request.getStartTime());
        LocalDateTime endDateTime = LocalDateTime.of(request.getDate(), request.getEndTime());

        if (!startDateTime.isBefore(endDateTime)) {
            throw new IllegalArgumentException("시작 시간은 종료 시간보다 이전이어야 합니다.");
        }

        List<FacilityReservation> overlaps = facilityReservationRepository.findOverlappingReservations(
                facility.getId(), request.getDate(), startDateTime, endDateTime
        );
        if (!overlaps.isEmpty()) {
            throw new IllegalStateException("해당 시간대에 이미 예약이 존재합니다.");
        }

        FacilityReservation reservation = FacilityReservation.builder()
                .facility(facility)
                .user(user)
                .date(request.getDate())
                .startTime(startDateTime)
                .endTime(endDateTime)
                .status(FacilityReservationStatus.PENDING)
                .build();

        return facilityReservationRepository.save(reservation);
    }

    // 내 예약 조회 (전체, 날짜, 시설, 상태 선택 가능)
    public List<FacilityReservationSummaryDto> getUserReservationsWithFilter(
            Long userId,
            LocalDate date,
            Long facilityId,
            FacilityReservationStatus status) {

        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        return facilityReservationRepository.findByUserWithFilter(userId, date, facilityId, status)
                .stream()
                .map(reservation -> FacilityReservationSummaryDto.builder()
                        .facilityName(reservation.getFacility().getName())
                        .reservationTime(formatReservationTime(reservation))
                        .createdAt(reservation.getCreatedAt().format(formatter))
                        .status(reservation.getStatus().getDescription())
                        .build())
                .collect(Collectors.toList());
    }

    // 예약한 시설 이용 날짜 형식 (ex. "2025-05-15 10:00-11:00")
    private String formatReservationTime(FacilityReservation facilityReservation) {
        return String.format("%s %s-%s",
                facilityReservation.getDate(),
                facilityReservation.getStartTime().toLocalTime(),
                facilityReservation.getEndTime().toLocalTime());
    }

    // 내 예약 취소
    @Transactional
    public void cancelReservation(Long userId, Long facilityReservationId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        FacilityReservation facilityReservation = facilityReservationRepository.findById(facilityReservationId)
                .orElseThrow(() -> new EntityNotFoundException("예약을 찾을 수 없습니다."));

        facilityReservation.setStatus(FacilityReservationStatus.CANCEL);
    }

}