package com.ohammer.apartner.domain.inspection.controller;


import com.ohammer.apartner.domain.inspection.dto.InspectionTypeDto;
import com.ohammer.apartner.domain.inspection.entity.InspectionType;
import com.ohammer.apartner.domain.inspection.service.InspectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/inspectiontype")
public class InspectionTypeV1Controller {
    private final InspectionService inspectionService;

    //근데 한번에 api 2개 불러올 수 있음?
    //설마 못부르겠어?
    //아님 누르는걸 트리거로?
    //일단은 나중에 생각하는걸로
    //어차피 me api 생각하면 그냥 여러개 불러도 될 것 같은데

    @GetMapping("")
    public List<InspectionType> showAllTypes() {
        return inspectionService.showAllTypes();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteType(@PathVariable(name = "id") Long id) {
        try {
            inspectionService.removeType(id);
        }
        catch (Exception e) {
            return ResponseEntity.badRequest().body("삭제 실패했는뎁쇼");
        }
         return ResponseEntity.ok().build();
    }

    @PostMapping("")
    public ResponseEntity<InspectionType> addNewType(@RequestBody InspectionTypeDto dto) {
        try {
            inspectionService.addType(dto.getName());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok().build();
    }
}
