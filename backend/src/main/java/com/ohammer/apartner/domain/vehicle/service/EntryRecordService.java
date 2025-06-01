package com.ohammer.apartner.domain.vehicle.service;


import com.ohammer.apartner.domain.user.entity.Role;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.vehicle.dto.EntryRecordRequestDto;
import com.ohammer.apartner.domain.vehicle.dto.EntryRecordResponseDto;
import com.ohammer.apartner.domain.vehicle.dto.EntryRecordStatusDto;
import com.ohammer.apartner.domain.vehicle.dto.VehicleRegistrationInfoDto;
import com.ohammer.apartner.domain.vehicle.entity.EntryRecord;
import com.ohammer.apartner.domain.vehicle.entity.ParkingProperties;
import com.ohammer.apartner.domain.vehicle.entity.Vehicle;
import com.ohammer.apartner.domain.vehicle.repository.EntryRecordRepository;
//import jakarta.transaction.Transactional;
import com.ohammer.apartner.global.service.AlarmService;
import com.ohammer.apartner.security.utils.SecurityUtil;
import com.ohammer.apartner.security.utils.checkRoleUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EntryRecordService {

    private final EntryRecordRepository entryRecordRepository;
    private final VehicleService vehicleService;
    private final AlarmService alarmService;
    private static final int MAX_CAPACITY = 30; // 총 주차 가능 수
    private final ParkingProperties parkingProperties;


    @Transactional
    public EntryRecordStatusDto updateStatus(Long entryRecordId, EntryRecord.Status newStatus) {
        EntryRecord record = entryRecordRepository.findById(entryRecordId)
                .orElseThrow(() -> new IllegalArgumentException("해당 출입기록이 없습니다."));

        User currentUser = SecurityUtil.getCurrentUser();
        if (currentUser == null) {
            throw new IllegalStateException("로그인한 사용자 정보를 불러올 수 없습니다.");
        }

        // 유저가 가진 역할들
        Set<Role> roles = currentUser.getRoles();
        boolean isMG = roles.contains(Role.MANAGER) || roles.contains(Role.MODERATOR);
        boolean isAD = roles.contains(Role.ADMIN);

        if (!isMG && !isAD && !record.getVehicle().getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("본인의 차량에 대한 요청만 처리할 수 있습니다.");
        }

        // 역할에 따라 허용된 상태 모음 구성
        Set<EntryRecord.Status> allowedStatuses = new HashSet<>();

        if (roles.contains(Role.USER)) {
            allowedStatuses.addAll(Set.of(EntryRecord.Status.INVITER_AGREE, EntryRecord.Status.INAGREE));
        }
        if (isMG) {
            allowedStatuses.addAll(Set.of(EntryRecord.Status.INAGREE, EntryRecord.Status.AGREE));
        }

        if (isAD) {
            allowedStatuses.addAll(Set.of(EntryRecord.Status.INAGREE, EntryRecord.Status.AGREE));
        }

        if (allowedStatuses.isEmpty()) {
            throw new IllegalArgumentException("해당 역할은 상태 변경 권한이 없습니다.");
        }

        if (!allowedStatuses.contains(newStatus)) {
            throw new IllegalArgumentException("요청한 상태로 변경할 권한이 없습니다.");
        }

        record.setStatus(newStatus);
        
        // 실시간 알림 추가
        Vehicle vehicle = record.getVehicle();
        User vehicleOwner = vehicle.getUser();
        Long apartmentId = vehicleOwner.getApartment() != null ? vehicleOwner.getApartment().getId() : null;
        
        // 차량 주인에게 알림
        String statusText = newStatus.name();
        String notificationType;
switch (newStatus) {
    case AGREE: notificationType = "success"; break;
    case INVITER_AGREE: notificationType = "info"; break;
    case INAGREE: notificationType = "warning"; break;
    case PENDING: notificationType = "info"; break;
    default: notificationType = "info";
}
        
        String message = String.format("차량 [%s] 출입 요청이 %s 상태로 변경되었습니다.", 
                vehicle.getVehicleNum(), getStatusKoreanName(newStatus));
        
        alarmService.notifyUser(vehicleOwner.getId(), apartmentId, "차량 출입 상태 변경", notificationType, "vehicle", message, null, null, null, null);
        
        // 관리자에게도 알림 (관리자가 아닌 사람이 상태 변경했을 경우)
        if (!isMG && !isAD && apartmentId != null) {
            String adminMessage = String.format("사용자가 차량 [%s] 출입 요청 상태를 %s(으)로 변경했습니다.", 
                    vehicle.getVehicleNum(), getStatusKoreanName(newStatus));
            
            alarmService.notifyApartmentAdmins(apartmentId, "차량 출입 상태 변경", "info", "vehicle", adminMessage, null, currentUser.getId(), null, null);
        }
        
        return new EntryRecordStatusDto(record.getId(), record.getStatus().name());
    }




    // 🚗 입차
    public EntryRecordResponseDto enterVehicle(EntryRecordRequestDto dto) {


        long activeCount = vehicleService.countActiveVehicles();

        if (activeCount >= parkingProperties.getMaxCapacity()) {
            throw new IllegalStateException("주차장이 꽉 찼습니다.");
        }

        Vehicle vehicle;

        // ── 1) 외부인 분기 ───────────────────────────────────
        // dto.getPhone()에 값이 있으면 외부인 입차
        if (dto.getPhone() != null) {
            // 차량 테이블에 isForeign = true, phone 칼럼으로 검색
            vehicle = vehicleService
                    //.findByPhoneAndIsForeign(dto.getPhone(), true)
                    .findLatestByPhoneAndIsForeign(dto.getPhone())  // ← 이 부분을 변경
                    .orElseThrow(() -> new IllegalArgumentException("등록된 외부 차량이 없습니다."));

            // (전화번호 일치 검사는 findBy… 호출만으로 끝났으므로 추가 검사는 불필요)
        }
        // ── 2) 입주민 분기 ───────────────────────────────────
        else {
            // 기존처럼 로그인한 유저의 차량 한 대 가져오기
            vehicle = vehicleService.findByCurrentUser();
        }

        // 가장 최근 승인된(AGREE) 출입기록 찾기, exitTime이 null인 상태
        EntryRecord latestApprovedRecord = entryRecordRepository
                .findFirstByVehicleIdAndStatusAndExitTimeIsNullOrderByCreatedAtDesc(
                        vehicle.getId(), EntryRecord.Status.AGREE)
                .orElseThrow(() -> new IllegalStateException("승인된 출입 기록이 없거나 이미 입차된 상태입니다."));


        // 이미 입차 기록이 있다면 중복 입차 방지
        if (latestApprovedRecord.getEntryTime() != null) {
            throw new IllegalStateException("이미 주차된 차량입니다.");
        }

        // 입차 시간 세팅
        latestApprovedRecord.setEntryTime(LocalDateTime.now());

        // 차량 상태 갱신
        vehicle.setStatus(Vehicle.Status.ACTIVE);

        entryRecordRepository.save(latestApprovedRecord);
        vehicleService.save(vehicle);
        
        // 실시간 알림 추가
        User vehicleOwner = vehicle.getUser();
        Long apartmentId = vehicleOwner.getApartment() != null ? vehicleOwner.getApartment().getId() : null;
        
        // 차량 주인에게 알림
        String message = String.format("차량 [%s]이(가) 주차장에 입차했습니다.", vehicle.getVehicleNum());
        alarmService.notifyUser(vehicleOwner.getId(), apartmentId, "차량 입차", "info", "vehicle", message, null, null, null, null);
        
        // 외부 차량인 경우 초대한 입주민에게 알림
        if (vehicle.getIsForeign() && !vehicleOwner.getId().equals(SecurityUtil.getCurrentUserId())) {
            String inviterMessage = String.format("초대한 방문차량 [%s]이(가) 주차장에 입차했습니다.", vehicle.getVehicleNum());
            alarmService.notifyUser(vehicleOwner.getId(), apartmentId, "방문차량 입차", "info", "vehicle", inviterMessage, null, null, null, null);
        }
        
        // 관리자에게도 알림
        if (apartmentId != null) {
            String adminMessage = String.format("%s 차량 [%s]이(가) 주차장에 입차했습니다.", 
                    vehicle.getIsForeign() ? "외부" : "입주민", vehicle.getVehicleNum());
            
            alarmService.notifyApartmentAdmins(apartmentId, "차량 입차", "info", "vehicle", adminMessage, null, null, null, null);
        }

        return EntryRecordResponseDto.from(latestApprovedRecord);
    }


    // 🚙 출차
    @Transactional
    public EntryRecordResponseDto exitVehicle(EntryRecordRequestDto dto) {

        Vehicle vehicle;

        // ── 1) 외부인 분기 ───────────────────────────────────
        if (dto != null && dto.getPhone() != null) {
            vehicle = vehicleService
                    .findMostRecentActiveVehicleByPhoneAndIsForeign(dto.getPhone(), true)
                    .orElseThrow(() -> new IllegalArgumentException("등록된 외부 차량이 없습니다."));
        }
        // ── 2) 입주민 분기 ───────────────────────────────────
        else {
            vehicle = vehicleService.findByCurrentUser();
        }


        EntryRecord activeRecord = entryRecordRepository
                .findFirstByVehicleIdAndStatusAndExitTimeIsNullOrderByEntryTimeDesc(
                        vehicle.getId(), EntryRecord.Status.AGREE)
                .orElseThrow(() -> new IllegalStateException("현재 주차 중인 기록이 없습니다."));

        activeRecord.setExitTime(LocalDateTime.now());


        vehicle.setStatus(Vehicle.Status.INACTIVE);

        entryRecordRepository.save(activeRecord);
        vehicleService.save(vehicle);
        
        // 실시간 알림 추가
        User vehicleOwner = vehicle.getUser();
        Long apartmentId = vehicleOwner.getApartment() != null ? vehicleOwner.getApartment().getId() : null;
        
        // 차량 주인에게 알림
        String message = String.format("차량 [%s]이(가) 주차장에서 출차했습니다.", vehicle.getVehicleNum());
        alarmService.notifyUser(vehicleOwner.getId(), apartmentId, "차량 출차", "info", "vehicle", message, null, null, null, null);
        
        // 외부 차량인 경우 초대한 입주민에게 알림
        if (vehicle.getIsForeign() && !vehicleOwner.getId().equals(SecurityUtil.getCurrentUserId())) {
            String inviterMessage = String.format("초대한 방문차량 [%s]이(가) 주차장에서 출차했습니다.", vehicle.getVehicleNum());
            alarmService.notifyUser(vehicleOwner.getId(), apartmentId, "방문차량 출차", "info", "vehicle", inviterMessage, null, null, null, null);
        }
        
        // 관리자에게도 알림
        if (apartmentId != null) {
            String adminMessage = String.format("%s 차량 [%s]이(가) 주차장에서 출차했습니다.", 
                    vehicle.getIsForeign() ? "외부" : "입주민", vehicle.getVehicleNum());
            
            alarmService.notifyApartmentAdmins(apartmentId, "차량 출차", "info", "vehicle", adminMessage, null, null, null, null);
        }

        return EntryRecordResponseDto.from(activeRecord);
    }


    // 📜 출입 기록 조회
    public List<EntryRecordResponseDto> getEntryRecords(Long vehicleId) {


        return entryRecordRepository.findByVehicleIdOrderByEntryTimeDesc(vehicleId)
                .stream()
                .map(EntryRecordResponseDto::from)
                .collect(Collectors.toList());
    }


    // 차량이 다시 주차 허가를 받고 싶을 때
    @Transactional
    public EntryRecordResponseDto requestEntryRecord() {
        Vehicle vehicle = vehicleService.findByCurrentUser();

        // 차량 상태가 ACTIVE면 주차 중인 상태로 간주
        if (vehicle.getStatus() == Vehicle.Status.ACTIVE) {
            throw new IllegalStateException("현재 주차 중이므로 새 출입 신청이 불가합니다.");
        }

        EntryRecord entryRecord = EntryRecord.builder()
                .vehicle(vehicle)
                .status(EntryRecord.Status.AGREE)
                .build();

        entryRecordRepository.save(entryRecord);

        return EntryRecordResponseDto.from(entryRecord);
    }

//
//    @Transactional
//    public EntryRecordStatusDto updateLatestPendingStatus(Long vehicleId, EntryRecord.Status newStatus) {
//        EntryRecord record = entryRecordRepository
//                .findTopByVehicleIdAndStatusOrderByCreatedAtDesc(vehicleId, EntryRecord.Status.PENDING)
//                .orElseThrow(() -> new IllegalArgumentException("승인 대기 중인 기록이 없습니다."));
//
//        record.setStatus(newStatus);
//        return new EntryRecordStatusDto(record.getId(), record.getStatus().name());
//    }

    // 출입 상태 한글명 반환 헬퍼 메서드
    private String getStatusKoreanName(EntryRecord.Status status) {
        switch (status) {
            case AGREE: return "최종 승인";
            case INAGREE: return "미승인";
            case INVITER_AGREE: return "입주민 승인";
            case PENDING: return "승인 대기";
            default: return status.name();
        }
    }

}
