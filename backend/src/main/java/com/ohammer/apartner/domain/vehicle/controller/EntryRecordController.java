package com.ohammer.apartner.domain.vehicle.controller;

import com.ohammer.apartner.domain.vehicle.dto.EntryRecordRequestDto;
import com.ohammer.apartner.domain.vehicle.dto.EntryRecordResponseDto;
import com.ohammer.apartner.domain.vehicle.dto.EntryRecordStatusDto;
import com.ohammer.apartner.domain.vehicle.entity.EntryRecord;
import com.ohammer.apartner.domain.vehicle.service.EntryRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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


    // 🚗 입차
    @PostMapping("/enter")
    public ResponseEntity<EntryRecordResponseDto> enter(@RequestBody EntryRecordRequestDto dto) {

        return ResponseEntity.ok(entryRecordService.enterVehicle(dto));
    }

    // 🚙 출차
    @PostMapping("/exit")
    public ResponseEntity<EntryRecordResponseDto> exit(@RequestBody EntryRecordRequestDto dto) { // @RequestBody EntryRecordRequestDto dto
        return ResponseEntity.ok(entryRecordService.exitVehicle(dto));
    }

    // 📜 출입 기록 전체 조회
    @GetMapping("/{vehicleId}")
    public ResponseEntity<List<EntryRecordResponseDto>> getRecords(@PathVariable(value = "vehicleId") Long vehicleId) {
        return ResponseEntity.ok(entryRecordService.getEntryRecords(vehicleId));
    }

    // 🚗 차량이 다시 주차 허가를 요청할 때 (출입 신청)
    @PostMapping("/request/{vehicleId}")
    public ResponseEntity<EntryRecordResponseDto> requestEntryRecord() { // @PathVariable(value = "vehicleId") Long vehicleId
        EntryRecordResponseDto response = entryRecordService.requestEntryRecord();
        return ResponseEntity.ok(response);
    }

    // ✅ 가장 최근 PENDING 상태의 출입기록 상태 변경 (ex. AGREE, REJECT)
    @PutMapping("/update-status/{vehicleId}")
    public ResponseEntity<EntryRecordStatusDto> updateLatestPendingStatus(
            @PathVariable(value = "vehicleId") Long vehicleId,
            @RequestParam EntryRecord.Status status) {

        EntryRecordStatusDto updated = entryRecordService.updateLatestPendingStatus(vehicleId, status);
        return ResponseEntity.ok(updated);
    }

}
