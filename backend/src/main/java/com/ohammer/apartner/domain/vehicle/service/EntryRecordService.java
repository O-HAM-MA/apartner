package com.ohammer.apartner.domain.vehicle.service;


import com.ohammer.apartner.domain.vehicle.dto.EntryRecordRequestDto;
import com.ohammer.apartner.domain.vehicle.dto.EntryRecordResponseDto;
import com.ohammer.apartner.domain.vehicle.dto.EntryRecordStatusDto;
import com.ohammer.apartner.domain.vehicle.dto.VehicleRegistrationInfoDto;
import com.ohammer.apartner.domain.vehicle.entity.EntryRecord;
import com.ohammer.apartner.domain.vehicle.entity.Vehicle;
import com.ohammer.apartner.domain.vehicle.repository.EntryRecordRepository;
//import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EntryRecordService {

    private final EntryRecordRepository entryRecordRepository;
    private final VehicleService vehicleService;

//    @Transactional
//    public EntryRecord updateStatus(Long entryRecordId, EntryRecord.Status newStatus) {
//        EntryRecord record = entryRecordRepository.findById(entryRecordId)
//                .orElseThrow(() -> new IllegalArgumentException("출입 기록이 없습니다."));
//
//        if (record.getStatus() != EntryRecord.Status.PENDING) {
//            throw new IllegalStateException("이미 처리된 상태입니다.");
//        }
//
//
//
//        record.setStatus(newStatus);  // 상태만 변경
//
//        return record;  // 변경된 상태가 자동으로 DB에 반영됨
//    }

    @Transactional
    public EntryRecordStatusDto updateStatus(Long entryRecordId, EntryRecord.Status newStatus) {
        EntryRecord record = entryRecordRepository.findById(entryRecordId)
                .orElseThrow(() -> new IllegalArgumentException("해당 출입기록이 없습니다."));

        record.setStatus(newStatus);
        return new EntryRecordStatusDto(record.getId(), record.getStatus().name());
    }


    // 🚗 입차
    public EntryRecordResponseDto enterVehicle(EntryRecordRequestDto dto) {
        //Vehicle vehicle = vehicleService.findById(dto.getVehicleId());
        Vehicle vehicle = vehicleService.findByCurrentUser();

        // 1) 외부인이라면 제출된 전화번호 검증
        if (Boolean.TRUE.equals(vehicle.getIsForeign())) {
            String registeredPhone = vehicle.getPhone();
            if (dto.getPhone() == null || !registeredPhone.equals(dto.getPhone())) {
                throw new IllegalArgumentException("등록된 전화번호와 일치하지 않습니다.");
            }
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

        return EntryRecordResponseDto.from(latestApprovedRecord);
    }


    // 🚙 출차
    @Transactional
    public EntryRecordResponseDto exitVehicle() {

        Vehicle vehicle = vehicleService.findByCurrentUser();
        // 승인된 출입기록 중 출차 안 한 기록 조회
        EntryRecord activeRecord = entryRecordRepository
                .findFirstByVehicleIdAndStatusAndExitTimeIsNullOrderByEntryTimeDesc(
                        vehicle.getId(), EntryRecord.Status.AGREE)
                .orElseThrow(() -> new IllegalStateException("현재 주차 중인 기록이 없습니다."));

        activeRecord.setExitTime(LocalDateTime.now());

        // 차량 상태 갱신
        //Vehicle vehicle = activeRecord.getVehicle();
        vehicle.setStatus(Vehicle.Status.INACTIVE);

        entryRecordRepository.save(activeRecord);
        vehicleService.save(vehicle);

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
                .status(EntryRecord.Status.PENDING)
                .build();

        entryRecordRepository.save(entryRecord);

        return EntryRecordResponseDto.from(entryRecord);
    }


    @Transactional
    public EntryRecordStatusDto updateLatestPendingStatus(Long vehicleId, EntryRecord.Status newStatus) {
        EntryRecord record = entryRecordRepository
                .findTopByVehicleIdAndStatusOrderByCreatedAtDesc(vehicleId, EntryRecord.Status.PENDING)
                .orElseThrow(() -> new IllegalArgumentException("승인 대기 중인 기록이 없습니다."));

        record.setStatus(newStatus);
        return new EntryRecordStatusDto(record.getId(), record.getStatus().name());
    }
















}
