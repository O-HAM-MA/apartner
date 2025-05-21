package com.ohammer.apartner.domain.vehicle.controller;

import com.ohammer.apartner.domain.vehicle.dto.EntryRecordRequestDto;
import com.ohammer.apartner.domain.vehicle.dto.EntryRecordResponseDto;
import com.ohammer.apartner.domain.vehicle.dto.EntryRecordStatusDto;
import com.ohammer.apartner.domain.vehicle.entity.EntryRecord;
import com.ohammer.apartner.domain.vehicle.service.EntryRecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "출입 기록 관리 api")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/entry-records")
public class EntryRecordController {

    private final EntryRecordService entryRecordService;

    @Operation(summary = "주차 요청 승인/미승인 결정하는 동작")
    @PatchMapping("/{entryRecordId}/status")
    public ResponseEntity<EntryRecordStatusDto> updateEntryStatus(
            @PathVariable(value = "entryRecordId") Long entryRecordId,
            @RequestParam(value = "status") EntryRecord.Status status) {

        EntryRecordStatusDto dto = entryRecordService.updateStatus(entryRecordId, status);
        return ResponseEntity.ok(dto);
    }


    // 🚗 입차
    @Operation(summary = "차 몰고 주차장으로 들어가는 동작")
    @PostMapping("/enter")
    public ResponseEntity<EntryRecordResponseDto> enter(@RequestBody EntryRecordRequestDto dto) {

        return ResponseEntity.ok(entryRecordService.enterVehicle(dto));
    }

    // 🚙 출차
    @Operation(summary = "주차장에서 차 빼서 나가는 동작")
    @PostMapping("/exit")
    public ResponseEntity<EntryRecordResponseDto> exit(@RequestBody EntryRecordRequestDto dto) { // @RequestBody EntryRecordRequestDto dto
        return ResponseEntity.ok(entryRecordService.exitVehicle(dto));
    }

    // 📜 출입 기록 전체 조회
    @Operation(summary = "차량의 출입 기록들 최신순 조회")
    @GetMapping("/{vehicleId}")
    public ResponseEntity<List<EntryRecordResponseDto>> getRecords(@PathVariable(value = "vehicleId") Long vehicleId) {
        return ResponseEntity.ok(entryRecordService.getEntryRecords(vehicleId));
    }

    // 🚗 차량이 다시 주차 허가를 요청할 때 (출입 신청)
    @Operation(summary = "이미 등록한 차량이 다시 주차장에 들어가려 등록하는 동작")
    @PostMapping("/request/{vehicleId}")
    public ResponseEntity<EntryRecordResponseDto> requestEntryRecord() { // @PathVariable(value = "vehicleId") Long vehicleId
        EntryRecordResponseDto response = entryRecordService.requestEntryRecord();
        return ResponseEntity.ok(response);
    }

    // ✅ 가장 최근 PENDING 상태의 출입기록 상태 변경 (ex. AGREE, REJECT)
//    @PutMapping("/update-status/{vehicleId}")
//    public ResponseEntity<EntryRecordStatusDto> updateLatestPendingStatus(
//            @PathVariable(value = "vehicleId") Long vehicleId,
//            @RequestParam EntryRecord.Status status) {
//
//        EntryRecordStatusDto updated = entryRecordService.updateLatestPendingStatus(vehicleId, status);
//        return ResponseEntity.ok(updated);
//    }

}
