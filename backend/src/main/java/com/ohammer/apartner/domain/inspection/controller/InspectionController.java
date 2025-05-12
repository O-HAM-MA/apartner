package com.ohammer.apartner.domain.inspection.controller;

import com.ohammer.apartner.domain.inspection.dto.InspectionRequestDto;
import com.ohammer.apartner.domain.inspection.dto.InspectionUpdateDto;
import com.ohammer.apartner.domain.inspection.entity.Inspection;
import com.ohammer.apartner.domain.inspection.service.InspectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/inspection")
public class InspectionController {
    private final InspectionService inspectionService;

    //얼추 여기서 CRUD 넣기
    @GetMapping("/")
    public ResponseEntity<List<Inspection>> showAllInspections() {
        return ResponseEntity.ok(inspectionService.showAllInspections());
    }

    //추가
    @PostMapping("/")
    public ResponseEntity<Inspection> createInspectionSchedule(InspectionRequestDto dto) {
        return ResponseEntity.ok(inspectionService.newInspectionSchedule(dto));
    }

    //수정
    @PostMapping("/{id}")
    public ResponseEntity<?> updateInspectionSchedule(@PathVariable("id") Long id, InspectionUpdateDto dto) {
        inspectionService.updateInspection(id, dto);
        return ResponseEntity.ok().build();
    }

    //제거

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteInspectionSchedule(@PathVariable("id") Long id) {
        inspectionService.deleteInspection(id);
        return ResponseEntity.ok().build();
    }




}
