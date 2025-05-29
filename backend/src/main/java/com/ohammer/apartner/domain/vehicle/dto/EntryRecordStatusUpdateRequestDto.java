package com.ohammer.apartner.domain.vehicle.dto;


import com.ohammer.apartner.domain.vehicle.entity.EntryRecord;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class EntryRecordStatusUpdateRequestDto {

    private EntryRecord.Status status;
}
