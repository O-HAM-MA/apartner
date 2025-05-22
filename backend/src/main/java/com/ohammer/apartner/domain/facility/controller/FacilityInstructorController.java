package com.ohammer.apartner.domain.facility.controller;

import com.ohammer.apartner.domain.facility.dto.request.InstructorCreateRequestDto;
import com.ohammer.apartner.domain.facility.dto.request.InstructorUpdateRequestDto;
import com.ohammer.apartner.domain.facility.dto.response.InstructorSimpleResponseDto;
import com.ohammer.apartner.domain.facility.service.FacilityInstructorService;
import com.ohammer.apartner.security.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/facilities/{facilityId}/instructors")
@Tag(name = "공용시설 강사 관리")
public class FacilityInstructorController {

    private final FacilityInstructorService facilityInstructorService;

    @PostMapping
    @Operation(summary = "강사 등록")
    public ResponseEntity<Long> createInstructor(
            @PathVariable(name = "facilityId") Long facilityId,
            @RequestBody @Valid InstructorCreateRequestDto instructorCreateRequestDto) {
        Long apartmentId = SecurityUtil.getCurrentUser().getApartment().getId();
        Long instructorId = facilityInstructorService.createInstructor(facilityId, apartmentId,
                instructorCreateRequestDto);

        return ResponseEntity.ok(instructorId);
    }

    @PutMapping("/{instructorId}")
    @Operation(summary = "강사 정보 수정")
    public ResponseEntity<Void> updateInstructor(
            @PathVariable(name = "facilityId") Long facilityId,
            @PathVariable(name = "instructorId") Long instructorId,
            @RequestBody @Valid InstructorUpdateRequestDto instructorUpdateRequestDto) {
        Long apartmentId = SecurityUtil.getCurrentUser().getApartment().getId();
        facilityInstructorService.updateInstructor(facilityId, instructorId, apartmentId, instructorUpdateRequestDto);

        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{instructorId}")
    @Operation(summary = "강사 삭제 (비활성화)")
    public ResponseEntity<Void> deleteInstructor(
            @PathVariable(name = "facilityId") Long facilityId,
            @PathVariable(name = "instructorId") Long instructorId) {
        Long apartmentId = SecurityUtil.getCurrentUser().getApartment().getId();
        facilityInstructorService.deleteInstructor(facilityId, instructorId, apartmentId);

        return ResponseEntity.ok().build();
    }

    @GetMapping
    @Operation(summary = "강사 목록 조회")
    public ResponseEntity<List<InstructorSimpleResponseDto>> getInstructorList(
            @PathVariable(name = "facilityId") Long facilityId) {
        Long apartmentId = SecurityUtil.getCurrentUser().getApartment().getId();
        
        return ResponseEntity.ok(facilityInstructorService.getInstructorList(facilityId, apartmentId));
    }
}
