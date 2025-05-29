package com.ohammer.apartner.domain.vehicle.dto;


import com.ohammer.apartner.domain.vehicle.entity.EntryRecord;
import lombok.Getter;
import lombok.Builder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Getter
@Builder
@Transactional
public class EntryRecordResponseDto {

    private Long vehicleId;
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;
    private EntryRecord.Status status;

    public static EntryRecordResponseDto from(EntryRecord record) {
        return EntryRecordResponseDto.builder()
                .vehicleId(record.getVehicle().getId())
                .entryTime(record.getEntryTime())
                .exitTime(record.getExitTime())
                .status(record.getStatus())
                .build();
    }
}
