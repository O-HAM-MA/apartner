package com.ohammer.apartner.domain.facility.controller;

import com.ohammer.apartner.domain.facility.dto.request.InstructorScheduleCreateRequestDto;
import com.ohammer.apartner.domain.facility.dto.response.InstructorScheduleSimpleResponseDto;
import com.ohammer.apartner.domain.facility.dto.response.TimeSlotSimpleResponseDto;
import com.ohammer.apartner.domain.facility.service.FacilityInstructorScheduleService;
import com.ohammer.apartner.domain.facility.service.FacilityTimeSlotService;
import com.ohammer.apartner.security.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/facilities/{facilityId}/instructors/{instructorId}/schedules")
@Tag(name = "공용시설 강사 스케쥴 관리")
public class FacilityInstructorScheduleController {

    private final FacilityInstructorScheduleService facilityInstructorScheduleService;
    private final FacilityTimeSlotService facilityTimeSlotService;

    @PostMapping
    @Operation(summary = "강사 스케줄(타임슬롯) 등록")
    public ResponseEntity<Long> createSchedules(
            @PathVariable(name = "facilityId") Long facilityId,
            @PathVariable(name = "instructorId") Long instructorId,
            @RequestBody @Valid InstructorScheduleCreateRequestDto instructorScheduleCreateRequestDtos
    ) {
        Long apartmentId = SecurityUtil.getCurrentUser().getApartment().getId();
        Long scheduleId = facilityInstructorScheduleService.createSchedulesAndSlots(facilityId, instructorId,
                apartmentId, instructorScheduleCreateRequestDtos);
        return ResponseEntity.status(HttpStatus.CREATED).body(scheduleId);
    }

    @DeleteMapping("/{scheduleId}")
    @Operation(summary = "공용시설 강사 스케줄 삭제 (한 건씩 삭제)")
    public ResponseEntity<Void> deleteSchedule(
            @PathVariable(name = "facilityId") Long facilityId,
            @PathVariable(name = "instructorId") Long instructorId,
            @PathVariable(name = "scheduleId") Long scheduleId
    ) {
        Long apartmentId = SecurityUtil.getCurrentUser().getApartment().getId();
        facilityInstructorScheduleService.deleteSchedule(facilityId, instructorId, scheduleId, apartmentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @Operation(summary = "강사 스케줄 목록 조회")
    public ResponseEntity<List<InstructorScheduleSimpleResponseDto>> getScheduleList(
            @PathVariable(name = "facilityId") Long facilityId,
            @PathVariable(name = "instructorId") Long instructorId
    ) {
        Long apartmentId = SecurityUtil.getCurrentUser().getApartment().getId();
        List<InstructorScheduleSimpleResponseDto> result =
                facilityInstructorScheduleService.getScheduleList(facilityId, instructorId, apartmentId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/timeslots")
    @Operation(summary = "스케쥴 타임슬롯 목록 조회")
    public ResponseEntity<List<TimeSlotSimpleResponseDto>> getTimeSlots(
            @PathVariable(name = "facilityId") Long facilityId,
            @PathVariable(name = "instructorId") Long instructorId,
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        Long apartmentId = SecurityUtil.getCurrentUser().getApartment().getId();
        List<TimeSlotSimpleResponseDto> result =
                facilityTimeSlotService.getTimeSlots(facilityId, instructorId, apartmentId, startDate, endDate);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/timeslots/{timeSlotId}")
    @Operation(summary = "스케쥴 타임슬롯 목록 조회")
    public ResponseEntity<Void> deleteTimeSlot(
            @PathVariable(name = "facilityId") Long facilityId,
            @PathVariable(name = "instructorId") Long instructorId,
            @PathVariable(name = "timeSlotId") Long timeSlotId
    ) {
        Long apartmentId = SecurityUtil.getCurrentUser().getApartment().getId();
        facilityTimeSlotService.deleteTimeSlot(timeSlotId, facilityId, instructorId, apartmentId);
        return ResponseEntity.noContent().build();
    }

}
