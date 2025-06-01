package com.ohammer.apartner.domain.facility.service;

import com.ohammer.apartner.domain.facility.dto.request.FacilityReservationCancelDto;
import com.ohammer.apartner.domain.facility.dto.request.FacilityReservationRequestDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityReservationSimpleUserDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityReservationUserDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilitySimpleResponseDto;
import com.ohammer.apartner.domain.facility.dto.response.InstructorSimpleResponseDto;
import com.ohammer.apartner.domain.facility.dto.response.TimeSlotSimpleResponseDto;
import com.ohammer.apartner.domain.facility.entity.Facility;
import com.ohammer.apartner.domain.facility.entity.FacilityInstructor;
import com.ohammer.apartner.domain.facility.entity.FacilityReservation;
import com.ohammer.apartner.domain.facility.entity.FacilityTimeSlot;
import com.ohammer.apartner.domain.facility.repository.FacilityInstructorRepository;
import com.ohammer.apartner.domain.facility.repository.FacilityRepository;
import com.ohammer.apartner.domain.facility.repository.FacilityReservationRepository;
import com.ohammer.apartner.domain.facility.repository.FacilityTimeSlotRepository;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.user.repository.UserRepository;
import com.ohammer.apartner.global.Status;
import com.ohammer.apartner.global.service.AlarmService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    private final FacilityInstructorRepository facilityInstructorRepository;
    private final AlarmService alarmService;

    // 시설 목록 보기
    public List<FacilitySimpleResponseDto> getFacilityList(Long apartmentId, String keyword) {
        List<Facility> facilities;
        if (keyword == null || keyword.trim().isEmpty()) {
            facilities = facilityRepository.findByApartmentIdAndStatus(apartmentId, Status.ACTIVE);
        } else {
            facilities = facilityRepository.findByApartmentIdAndStatusAndNameContainingIgnoreCase(
                    apartmentId, Status.ACTIVE, keyword.trim());
        }
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

    // 강사 목록 보기
    public List<InstructorSimpleResponseDto> getInstructorList(Long facilityId) {
        List<FacilityInstructor> instructors = facilityInstructorRepository
                .findByFacilityIdAndStatus(facilityId, Status.ACTIVE);

        return instructors.stream()
                .map(InstructorSimpleResponseDto::from)
                .collect(Collectors.toList());
    }

    // 강사별 스케쥴 목록 보기
    public List<TimeSlotSimpleResponseDto> getInstructorTimeSlots(
            Long facilityId, Long instructorId, LocalDate startDate, LocalDate endDate) {

        List<FacilityTimeSlot> slots = facilityTimeSlotRepository
                .findByInstructorAndDateRange(facilityId, instructorId, startDate, endDate);

        return slots.stream()
                .map(TimeSlotSimpleResponseDto::from)
                .collect(Collectors.toList());
    }

    // ------- 예약 --------
    // 예약 신청하기
    @Transactional
    public Long reservationFacility(Long userId, FacilityReservationRequestDto facilityReservationRequestDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저 없음"));

        FacilityTimeSlot slot = facilityTimeSlotRepository.findById(facilityReservationRequestDto.getTimeSlotId())
                .orElseThrow(() -> new IllegalArgumentException("타임슬롯 없음"));

        Facility facility = slot.getFacility();

        boolean conflict = facilityReservationRepository.existsTimeConflict(
                userId,
                slot.getStartTime().atDate(slot.getDate()),
                slot.getEndTime().atDate(slot.getDate()));
        if (conflict) {
            throw new IllegalArgumentException("동일 시간대에 이미 예약이 있습니다.");
        }

        Long reservedCount = facilityReservationRepository.countByTimeSlot_IdAndStatus(
                slot.getId(), FacilityReservation.Status.AGREE);
        if (reservedCount >= slot.getMaxCapacity()) {
            throw new IllegalStateException("예약이 마감되었습니다.");
        }

        FacilityReservation facilityReservation = FacilityReservation.builder()
                .facility(facility)
                .user(user)
                .timeSlot(slot)
                .date(slot.getDate())
                .startTime(slot.getStartTime().atDate(slot.getDate()))
                .endTime(slot.getEndTime().atDate(slot.getDate()))
                .requestMessage(facilityReservationRequestDto.getRequestMessage())
                .status(FacilityReservation.Status.PENDING)
                .build();

        facilityReservationRepository.save(facilityReservation);
        
        // 예약 신청 알림 전송
        sendReservationNotification(user, facility, facilityReservation);
        
        return facilityReservation.getId();
    }

    @Transactional
    public void cancelReservation(Long userId, Long reservationId,
                                  FacilityReservationCancelDto facilityReservationCancelDto) {
        FacilityReservation facilityReservation = facilityReservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("예약 정보 없음"));

        if (!facilityReservation.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인의 예약만 취소할 수 있습니다.");
        }

        if (facilityReservation.getStatus() != FacilityReservation.Status.PENDING
                && facilityReservation.getStatus() != FacilityReservation.Status.AGREE) {
            throw new IllegalStateException("이미 취소/거절된 예약입니다.");
        }

        facilityReservation.setStatus(FacilityReservation.Status.CANCEL);
        facilityReservation.setCancelReasonType(facilityReservationCancelDto.getCancelReasonType());
        facilityReservation.setCancelReasonDetail(facilityReservationCancelDto.getCancelReason());
        facilityReservation.setModifiedAt(LocalDateTime.now());
        
        // 예약 취소 알림 전송
        sendCancelNotification(facilityReservation.getUser(), facilityReservation.getFacility(), facilityReservation);
    }

    // 본인 예약 목록 조회
    public List<FacilityReservationSimpleUserDto> getMyReservations(Long userId) {
        List<FacilityReservation> list = facilityReservationRepository.findByUserIdOrderByStartTimeDesc(userId);

        return list.stream().map(r -> FacilityReservationSimpleUserDto.builder()
                        .reservationId(r.getId())
                        .facilityName(r.getFacility().getName())
                        .instructorName(
                                r.getTimeSlot().getInstructor() != null ? r.getTimeSlot().getInstructor().getName() : null)
                        .programName(
                                r.getTimeSlot().getSchedule() != null ? r.getTimeSlot().getSchedule().getScheduleName() : null)
                        .reservationDateTime(
                                r.getStartTime().toLocalDate().toString() + " " +
                                        r.getStartTime().toLocalTime().toString() + "~" +
                                        r.getEndTime().toLocalTime().toString()
                        )
                        .status(r.getStatus())
                        .build())
                .collect(Collectors.toList());
    }

    // 본인 예약 단건 상세 조회
    public FacilityReservationUserDto getMyReservationDetail(Long facilityReservationId) {
        FacilityReservation r = facilityReservationRepository.findById(facilityReservationId)
                .orElseThrow(() -> new IllegalArgumentException("예약 정보 없음"));

        return FacilityReservationUserDto.builder()
                .reservationId(r.getId())
                .facilityName(r.getFacility().getName())
                .instructorName(
                        r.getTimeSlot().getInstructor() != null ? r.getTimeSlot().getInstructor().getName() : null)
                .programName(
                        r.getTimeSlot().getSchedule() != null ? r.getTimeSlot().getSchedule().getScheduleName() : null)
                .reservationDateTime(
                        r.getStartTime().toLocalDate().toString() + " " +
                                r.getStartTime().toLocalTime().toString() + "~" +
                                r.getEndTime().toLocalTime().toString()
                )
                .createdAt(r.getCreatedAt())
                .requestMessage(r.getRequestMessage())
                .status(r.getStatus())
                .build();
    }

    // 예약 신청 알림 전송 메서드
    private void sendReservationNotification(User user, Facility facility, FacilityReservation reservation) {
        Long apartmentId = user.getApartment().getId();
        Long userId = user.getId();
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        String formattedTime = reservation.getStartTime().format(formatter) + " ~ " +
                               reservation.getEndTime().toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm"));
        
        // 예약자에게 알림 전송
        String userTitle = "시설 예약 신청 완료";
        String userMessage = facility.getName() + " " + formattedTime + " 예약이 신청되었습니다.";
        String userType = "info"; // 프론트 기준
        
        alarmService.notifyUser(userId, apartmentId, userTitle, userType, "FACILITY_RESERVATION", userMessage, 
        "/udash/facilities", userId, reservation.getId(), null);        
        // 관리자/운영자에게 알림 전송
        String adminTitle = "새로운 시설 예약 신청";
        String adminMessage = user.getUserName() + "님이 " + facility.getName() + 
                             " " + formattedTime + " 예약을 신청하였습니다.";
        String adminType = "info"; // 프론트 기준
        
        alarmService.notifyApartmentAdmins(apartmentId, adminTitle, adminType, "FACILITY_RESERVATION_REQUEST", adminMessage, 
                "/admin/facilities/reservations", userId, reservation.getId(), null);
    }
    
    // 예약 취소 알림 전송 메서드
    private void sendCancelNotification(User user, Facility facility, FacilityReservation reservation) {
        Long apartmentId = user.getApartment().getId();
        Long userId = user.getId();
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        String formattedTime = reservation.getStartTime().format(formatter) + " ~ " +
                               reservation.getEndTime().toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm"));
        
        // 예약자에게 알림 전송
        String userTitle = "시설 예약 취소 완료";
        String userMessage = facility.getName() + " " + formattedTime + " 예약이 취소되었습니다.";
        String userType = "warning"; // 프론트 기준

        alarmService.notifyUser(userId, apartmentId, userTitle, userType, "FACILITY_CANCEL", userMessage, 
        "/udash/facilities", userId, reservation.getId(), null);        
        // 관리자/운영자에게 알림 전송
        String adminTitle = "시설 예약 취소 알림";
        String adminMessage = user.getUserName() + "님이 " + facility.getName() + 
                             " " + formattedTime + " 예약을 취소하였습니다.";
        String adminType = "warning"; // 프론트 기준
        
        alarmService.notifyApartmentAdmins(apartmentId, adminTitle, adminType, "FACILITY_RESERVATION_CANCEL", adminMessage, 
                "/admin/facilities/reservations", userId, reservation.getId(), null);
    }
}