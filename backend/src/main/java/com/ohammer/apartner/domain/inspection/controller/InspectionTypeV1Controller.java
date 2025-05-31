package com.ohammer.apartner.domain.inspection.controller;


import com.ohammer.apartner.domain.inspection.dto.InspectionTypeDto;
import com.ohammer.apartner.domain.inspection.entity.InspectionType;
import com.ohammer.apartner.domain.inspection.service.InspectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/inspection/type")
@Tag(name = "점검 항목 api", description = "점검 항목 관리 API")
public class InspectionTypeV1Controller {
    private final InspectionService inspectionService;

    //근데 한번에 api 2개 불러올 수 있음?
    //설마 못부르겠어?
    //아님 누르는걸 트리거로?
    //일단은 나중에 생각하는걸로
    //어차피 me api 생각하면 그냥 여러개 불러도 될 것 같은데

    @GetMapping("")
    @Operation(
            summary = "점검 항목 내용들을 싹다 보여주기",
            description = "점검 항목들을 보여줍니다, 그리고 주호야 페이징 언제 만들꺼니"
    )
    public ResponseEntity<List<InspectionType>> showAllTypes() {
        return ResponseEntity.ok().body(inspectionService.showAllTypes());
    }

    //일단은 보류
//    @DeleteMapping("/{id}")
//    @Operation(
//            summary = "점검 항목을 삭제하기",
//            description = "삭제할 점검항목을 선택하여 삭제합니다"
//    )
//    public ResponseEntity<?> deleteType(@PathVariable(name = "id") Long id) {
//        try {
//            inspectionService.removeType(id);
//        }
//        catch (Exception e) {
//            return ResponseEntity.badRequest().body("삭제 실패했는뎁쇼");
//        }
//         return ResponseEntity.ok().build();
//    }
//
//    @PostMapping("/{id}")
//    @Operation(
//            summary = "점검 항목을 수정하기",
//            description = "점검항목을 선택하여 수정합니다, 그런데 쓸 일이 있을까요"
//    ) public ResponseEntity<?> updateType(@PathVariable(name = "id") Long id) {
//
//    }

    @PostMapping("/create")
    @Operation(
            summary = "점검 항목을 추가합니다",
            description = "점검 항목을 추가합니다"
    )
    public ResponseEntity<InspectionType> addNewType(@RequestBody InspectionTypeDto dto) {
        try {
            inspectionService.addType(dto.getName());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok().build();
    }
}
