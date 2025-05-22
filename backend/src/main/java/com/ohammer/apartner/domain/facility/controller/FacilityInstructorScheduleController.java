package com.ohammer.apartner.domain.facility.controller;

import com.ohammer.apartner.domain.facility.dto.request.InstructorScheduleCreateRequestDto;
import com.ohammer.apartner.domain.facility.service.FacilityInstructorScheduleService;
import com.ohammer.apartner.security.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/facilities/{facilityId}/instructors/{instructorId}/schedules")
@Tag(name = "공용시설 강사 스케쥴 관리")
public class FacilityInstructorScheduleController {

    private final FacilityInstructorScheduleService facilityInstructorScheduleService;

    @PostMapping
    @Operation(summary = "강사 스케줄(타임슬롯) 등록")
    public ResponseEntity<Void> createSchedules(
            @PathVariable(name = "facilityId") Long facilityId,
            @PathVariable(name = "instructorId") Long instructorId,
            @RequestBody List<InstructorScheduleCreateRequestDto> instructorScheduleCreateRequestDtos) {
        Long apartmentId = SecurityUtil.getCurrentUser().getApartment().getId();
        facilityInstructorScheduleService.createSchedules(apartmentId, facilityId, instructorId,
                instructorScheduleCreateRequestDtos);

        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{scheduleId}")
    @Operation(summary = "공용시설 강사 스케줄 삭제 (한 건씩 삭제)")
    public ResponseEntity<Void> deleteSchedule(
            @PathVariable(name = "facilityId") Long facilityId,
            @PathVariable(name = "instructorId") Long instructorId,
            @PathVariable(name = "scheduleId") Long scheduleId
    ) {
        Long apartmentId = SecurityUtil.getCurrentUser().getApartment().getId();
        facilityInstructorScheduleService.deleteSchedule(apartmentId, facilityId, instructorId, scheduleId);

        return ResponseEntity.ok().build();
    }

}
