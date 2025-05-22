package com.ohammer.apartner.domain.facility.service;

import com.ohammer.apartner.domain.facility.dto.request.FacilityReservationRequestDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityReservationSummaryDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityResponseDto;
import com.ohammer.apartner.domain.facility.entity.Facility;
import com.ohammer.apartner.domain.facility.entity.FacilityReservation;
import com.ohammer.apartner.domain.facility.repository.FacilityRepository;
import com.ohammer.apartner.domain.facility.repository.FacilityReservationRepository;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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

        // "시작 > 종료"면 익일로 간주하여 endDateTime을 +1일
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            endDateTime = endDateTime.plusDays(1);
        }

        // 운영시간 내 예약인지 체크 (분리한 메서드 사용!)
        validateReservationTime(facility, request.getStartTime(), request.getEndTime());

        // 중복 예약 체크 (동일 시설, 시간 겹치는지)
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
                .status(FacilityReservation.Status.PENDING)
                .build();

        return facilityReservationRepository.save(reservation);
    }

    private void validateReservationTime(Facility facility, LocalTime startTime, LocalTime endTime) {
        LocalTime openTime = facility.getOpenTime();
        LocalTime closeTime = facility.getCloseTime();
        boolean isOvernight = openTime.isAfter(closeTime);

        if (startTime.equals(endTime)) {
            throw new IllegalArgumentException("시작 시간과 종료 시간은 달라야 합니다.");
        }

        boolean valid;
        if (!isOvernight) { // 예: 08:00~22:00
            valid = !startTime.isBefore(openTime) && !endTime.isAfter(closeTime);
        } else { // 예: 22:00~03:00 (익일)
            // 예약시간이 22:00~24:00 또는 00:00~03:00에 걸쳐있으면 OK
            valid = (
                    (!startTime.isBefore(openTime) && startTime.isBefore(LocalTime.MAX)) // 22:00~23:59
                            || (!endTime.isAfter(closeTime)) // 00:00~03:00
            );
        }
        if (!valid) {
            throw new IllegalArgumentException("예약 시간이 시설 운영 시간 내에 있어야 합니다.");
        }
    }

    // 내 예약 조회 (전체, 날짜, 시설, 상태 선택 가능)
    public List<FacilityReservationSummaryDto> getUserReservationsWithFilter(
            Long userId,
            LocalDate date,
            Long facilityId,
            FacilityReservation.Status status) {

        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        return facilityReservationRepository.findByUserWithFilter(userId, date, facilityId, status)
                .stream()
                .map(reservation -> FacilityReservationSummaryDto.builder()
                        .facilityName(reservation.getFacility().getName())
                        .reservationTime(formatReservationTime(reservation))
                        .createdAt(reservation.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")))
                        .status(reservation.getStatus().name())
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

        if (!facilityReservation.getUser().getId().equals(userId)) {
            throw new SecurityException("본인의 예약만 취소할 수 있습니다.");
        }

        if (facilityReservation.getStatus() == FacilityReservation.Status.CANCEL) {
            throw new IllegalStateException("이미 취소된 예약입니다.");
        }

        facilityReservation.setStatus(FacilityReservation.Status.CANCEL);
    }

}