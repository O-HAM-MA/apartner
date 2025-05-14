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
public class InspectionV1Controller {
    private final InspectionService inspectionService;

    //얼추 여기서 CRUD 넣기
    //전체 불러오기

    //그냥 여기서 제목만 불러와도 되는게 아닌가
    @GetMapping("")
    public ResponseEntity<List<Inspection>> showAllInspections() {
        return ResponseEntity.ok(inspectionService.showAllInspections());
    }

    //상세 보기 -> 추가 내용 볼려고?
    @GetMapping("/{id}")
    public ResponseEntity<Inspection> showInspection(@PathVariable(name = "id") Long id) {
        try {
                Inspection inspection = inspectionService.showInspection(id);
                return ResponseEntity.ok(inspection);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }

    }


    //추가
    @PostMapping("")
    public ResponseEntity<Inspection> createInspectionSchedule(@RequestBody InspectionRequestDto dto) {
        return ResponseEntity.ok(inspectionService.newInspectionSchedule(dto));
    }

    //수정
    @PostMapping("/{id}")
    public ResponseEntity<?> updateInspectionSchedule(@PathVariable("id") Long id, @RequestBody InspectionUpdateDto dto) {
        try {
            inspectionService.updateInspection(id, dto);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok().build();
    }

    //완료
    @PostMapping("/complete/{id}")
    public ResponseEntity<?> compeleteInspection(@PathVariable(name = "id") Long id) {
        try {
            inspectionService.showInspection(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    //제거
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteInspectionSchedule(@PathVariable("id") Long id) {
        inspectionService.deleteInspection(id);
        return ResponseEntity.ok().build();
    }
}
