package com.ohammer.apartner.domain.facility.service;

import com.ohammer.apartner.domain.facility.dto.request.FacilityReservationRequestDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityReservationUserDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityUserSimpleResponseDto;
import com.ohammer.apartner.domain.facility.dto.response.TimeSlotResponseDto;
import com.ohammer.apartner.domain.facility.entity.Facility;
import com.ohammer.apartner.domain.facility.entity.FacilityReservation;
import com.ohammer.apartner.domain.facility.entity.FacilityTimeSlot;
import com.ohammer.apartner.domain.facility.repository.FacilityRepository;
import com.ohammer.apartner.domain.facility.repository.FacilityReservationRepository;
import com.ohammer.apartner.domain.facility.repository.FacilityTimeSlotRepository;
import com.ohammer.apartner.domain.user.repository.UserRepository;
import com.ohammer.apartner.global.Status;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
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
    private final FacilityTimeSlotRepository facilityTimeSlotRepository;

    // 예약 신청하기
    @Transactional
    public Long reserveFacility(Long userId, FacilityReservationRequestDto facilityReservationRequestDto) {
        FacilityTimeSlot timeSlot = facilityTimeSlotRepository.findById(facilityReservationRequestDto.getTimeSlotId())
                .orElseThrow(() -> new EntityNotFoundException("예약 타임슬롯을 찾을 수 없습니다."));

        // 이미 마감 여부 체크
        Long reservedCount = facilityReservationRepository.countByTimeSlot_IdAndStatus(
                timeSlot.getId(), FacilityReservation.Status.AGREE);
        if (reservedCount >= timeSlot.getMaxCapacity()) {
            throw new IllegalStateException("이미 예약이 마감된 시간입니다.");
        }

        // 이미 이 슬롯에 유저가 예약했는지(중복방지)
        boolean already = facilityReservationRepository.existsByUser_IdAndTimeSlot_IdAndStatusIn(
                userId, timeSlot.getId(),
                List.of(FacilityReservation.Status.PENDING, FacilityReservation.Status.AGREE));
        if (already) {
            throw new IllegalArgumentException("이미 해당 시간에 예약 내역이 있습니다.");
        }

        FacilityReservation reservation = FacilityReservation.builder()
                .facility(timeSlot.getFacility())
                .user(userRepository.getReferenceById(userId))
                .date(timeSlot.getDate())
                .startTime(timeSlot.getDate().atTime(timeSlot.getStartTime()))
                .endTime(timeSlot.getDate().atTime(timeSlot.getEndTime()))
                .status(FacilityReservation.Status.PENDING)
                .timeSlot(timeSlot)
                .build();
        facilityReservationRepository.save(reservation);

        return reservation.getId();
    }

    // 시설 목록 보기
    public List<FacilityUserSimpleResponseDto> getFacilityList(Long apartmentId, String keyword) {
        List<Facility> facilities;
        if (keyword == null || keyword.trim().isEmpty()) {
            facilities = facilityRepository.findByApartmentIdAndStatus(apartmentId, Status.ACTIVE);
        } else {
            facilities = facilityRepository.findByApartmentIdAndStatusAndNameContainingIgnoreCase(
                    apartmentId, Status.ACTIVE, keyword.trim());
        }
        return facilities.stream()
                .map(f -> FacilityUserSimpleResponseDto.builder()
                        .facilityId(f.getId())
                        .name(f.getName())
                        .description(f.getDescription())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TimeSlotResponseDto> getTimeSlots(Long facilityId, String dateStr) {
        LocalDate date = (dateStr != null) ? LocalDate.parse(dateStr) : LocalDate.now();

        List<FacilityTimeSlot> slots = facilityTimeSlotRepository.findByFacilityIdAndDate(facilityId, date);

        return slots.stream().map(slot -> {
            Long reservedCount = facilityReservationRepository.countByTimeSlot_IdAndStatus(
                    slot.getId(), FacilityReservation.Status.AGREE
            );
            boolean isFull = reservedCount != null && reservedCount >= slot.getMaxCapacity();
            return TimeSlotResponseDto.builder()
                    .timeSlotId(slot.getId())
                    .instructorName(slot.getInstructor() != null ? slot.getInstructor().getName() : null)
                    .date(slot.getDate())
                    .startTime(slot.getStartTime())
                    .endTime(slot.getEndTime())
                    .maxCapacity(slot.getMaxCapacity())
                    .reservedCount(reservedCount)
                    .isFull(isFull)
                    .build();
        }).toList();
    }

    // 내 예약 조회 (전체, 날짜, 시설, 상태 선택 가능)
    public List<FacilityReservationUserDto> getUserReservationsWithFilter(
            Long userId,
            LocalDate date,
            Long facilityId,
            FacilityReservation.Status status) {

        userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        return facilityReservationRepository.findByUserWithFilter(userId, date, facilityId, status)
                .stream()
                .map(reservation -> FacilityReservationUserDto.builder()
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
    public void cancelReservation(Long userId, Long reservationId) {
        FacilityReservation reservation = facilityReservationRepository.findById(reservationId)
                .orElseThrow(() -> new EntityNotFoundException("예약 내역을 찾을 수 없습니다."));
        if (!reservation.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인의 예약만 취소할 수 있습니다.");
        }
        if (reservation.getStatus() != FacilityReservation.Status.PENDING
                && reservation.getStatus() != FacilityReservation.Status.AGREE) {
            throw new IllegalStateException("이미 취소/거절된 예약입니다.");
        }
        reservation.setStatus(FacilityReservation.Status.CANCEL);
    }


}