package com.ohammer.apartner.domain.vehicle.controller;

import com.ohammer.apartner.domain.vehicle.dto.EntryRecordStatusDto;
import com.ohammer.apartner.domain.vehicle.entity.EntryRecord;
import com.ohammer.apartner.domain.vehicle.service.EntryRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/entry-records")
public class EntryRecordController {

    private final EntryRecordService entryRecordService;

    @PatchMapping("/{entryRecordId}/status")
    public ResponseEntity<EntryRecordStatusDto> updateEntryStatus(
            @PathVariable(value = "entryRecordId") Long entryRecordId,
            @RequestParam(value = "status") EntryRecord.Status status) {

        EntryRecordStatusDto dto = entryRecordService.updateStatus(entryRecordId, status);
        return ResponseEntity.ok(dto);
    }

}
