package com.ohammer.apartner.domain.vehicle.service;


import com.ohammer.apartner.domain.vehicle.dto.EntryRecordStatusDto;
import com.ohammer.apartner.domain.vehicle.dto.VehicleRegistrationInfoDto;
import com.ohammer.apartner.domain.vehicle.entity.EntryRecord;
import com.ohammer.apartner.domain.vehicle.entity.Vehicle;
import com.ohammer.apartner.domain.vehicle.repository.EntryRecordRepository;
//import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EntryRecordService {

    private final EntryRecordRepository entryRecordRepository;

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










}
