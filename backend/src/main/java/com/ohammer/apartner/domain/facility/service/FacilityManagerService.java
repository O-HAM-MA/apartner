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
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.Status;
import com.ohammer.apartner.global.service.AlarmService;
import jakarta.persistence.EntityNotFoundException;
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
public class FacilityManagerService {

    private final ApartmentRepository apartmentRepository;
    private final FacilityRepository facilityRepository;
    private final FacilityReservationRepository facilityReservationRepository;
    private final FacilityInstructorRepository facilityInstructorRepository;
    private final AlarmService alarmService;

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

        // 이전 상태 저장
        FacilityReservation.Status oldStatus = reservation.getStatus();
        
        // 상태 변경
        reservation.setStatus(newStatus);
        reservation.setModifiedAt(LocalDateTime.now());
        
        // 상태 변경 알림 전송
        sendStatusChangeNotification(reservation, oldStatus, newStatus);
    }
    
    // 예약 상태 변경 알림 전송
    private void sendStatusChangeNotification(FacilityReservation reservation, 
                                             FacilityReservation.Status oldStatus,
                                             FacilityReservation.Status newStatus) {
        User user = reservation.getUser();
        Facility facility = reservation.getFacility();
        Long apartmentId = facility.getApartment().getId();
        Long userId = user.getId();
        Long facilityId = facility.getId();
        Long managerId = userId; // 관리자 ID가 없는 경우 임시로 userId 사용
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        String formattedTime = reservation.getStartTime().format(formatter) + " ~ " +
                               reservation.getEndTime().toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm"));
        
        // 사용자에게 보낼 알림 정보
        String userTitle;
        String userMessage;
        String userType;
        String userCustomType;
        
        // 관리자에게 보낼 알림 정보
        String adminTitle;
        String adminMessage;
        String adminType;
        String adminCustomType;
        
        // 상태에 따른 알림 내용 설정
        switch (newStatus) {
            case AGREE:
                // 승인 완료 알림
                userTitle = "시설 예약 승인 완료";
                userMessage = facility.getName() + " " + formattedTime + " 예약이 승인되었습니다.";
                userType = "success"; // 프론트엔드 알림 타입
                userCustomType = "FACILITY_RESERVATION_APPROVED";
                
                adminTitle = "시설 예약 승인 처리 완료";
                adminMessage = user.getUserName() + "님의 " + facility.getName() + 
                              " " + formattedTime + " 예약이 승인 처리되었습니다.";
                adminType = "success";
                adminCustomType = "FACILITY_RESERVATION_ADMIN_APPROVED";
                break;
                
            case REJECT:
                // 거절 알림
                userTitle = "시설 예약 신청 거절";
                userMessage = facility.getName() + " " + formattedTime + " 예약 신청이 거절되었습니다.";
                userType = "error"; // 프론트엔드 알림 타입
                userCustomType = "FACILITY_RESERVATION_REJECTED";
                
                adminTitle = "시설 예약 거절 처리 완료";
                adminMessage = user.getUserName() + "님의 " + facility.getName() + 
                              " " + formattedTime + " 예약이 거절 처리되었습니다.";
                adminType = "warning";
                adminCustomType = "FACILITY_RESERVATION_ADMIN_REJECTED";
                break;
                
            default:
                // 기타 상태 변경
                userTitle = "시설 예약 상태 변경";
                userMessage = facility.getName() + " " + formattedTime + " 예약 상태가 " + 
                             getStatusKoreanName(newStatus) + "(으)로 변경되었습니다.";
                userType = "info"; // 프론트엔드 알림 타입
                userCustomType = "FACILITY_RESERVATION_STATUS_CHANGED";
                
                adminTitle = "시설 예약 상태 변경 처리 완료";
                adminMessage = "사용자 " + user.getUserName() + "님의 " + facility.getName() + 
                              " " + formattedTime + " 예약 상태가 " + getStatusKoreanName(newStatus) + 
                              "(으)로 변경되었습니다.";
                adminType = "info";
                adminCustomType = "FACILITY_RESERVATION_ADMIN_STATUS_CHANGED";
                break;
        }
        
      
        
        alarmService.notifyUser(userId, apartmentId, userTitle, userType, userCustomType, userMessage, 
        "/udash/facilities", managerId, reservation.getId(), null);        
       
        // 관리자/운영자에게 알림 전송     
        alarmService.notifyApartmentAdmins(apartmentId, adminTitle, adminType, adminCustomType, adminMessage, 
                "/admin/facilities/reservations", managerId, reservation.getId(), null);
    }
    
    // 예약 상태 한글 이름 변환
    private String getStatusKoreanName(FacilityReservation.Status status) {
        switch (status) {
            case PENDING: return "승인 대기";
            case AGREE: return "승인 완료";
            case REJECT: return "승인 거절";
            case CANCEL: return "예약 취소";
            default: return "알 수 없음";
        }
    }
}