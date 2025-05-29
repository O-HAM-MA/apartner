package com.ohammer.apartner.domain.facility.controller;

import com.ohammer.apartner.domain.facility.dto.request.FacilityReservationCancelDto;
import com.ohammer.apartner.domain.facility.dto.request.FacilityReservationRequestDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityReservationSimpleUserDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityReservationUserDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilitySimpleResponseDto;
import com.ohammer.apartner.domain.facility.dto.response.InstructorSimpleResponseDto;
import com.ohammer.apartner.domain.facility.dto.response.TimeSlotSimpleResponseDto;
import com.ohammer.apartner.domain.facility.service.FacilityUserService;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.security.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
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
@RequestMapping("/api/v1/facilities")
@Tag(name = "공용시설 예약 - 사용자")
public class FacilityUserController {

    private final FacilityUserService facilityUserService;

    // 시설 목록 보기
    @GetMapping
    @Operation(summary = "공용시설 목록 조회", description = "등록된(활성화 중) 공용시설 목록 조희")
    public ResponseEntity<List<FacilitySimpleResponseDto>> getFacilityList(
            @RequestParam(name = "keyword", required = false) String keyword) {
        Long apartmentId = SecurityUtil.getCurrentUser().getApartment().getId();
        List<FacilitySimpleResponseDto> list = facilityUserService.getFacilityList(apartmentId, keyword);
        return ResponseEntity.ok(list);
    }

    // 공용시설 단건 조회
    @GetMapping("/{facilityId}")
    @Operation(summary = "공용시설 단건 조회")
    public ResponseEntity<FacilitySimpleResponseDto> getFacility(
            @PathVariable(name = "facilityId") Long facilityId) {
        User user = SecurityUtil.getCurrentUser();
        Long apartmentId = user.getApartment().getId();
        FacilitySimpleResponseDto dto = facilityUserService.getFacility(facilityId, apartmentId);
        return ResponseEntity.ok(dto);
    }

    // 강사 목록 보기
    @GetMapping("/{facilityId}/instructors")
    @Operation(summary = "시설별 강사 목록 조회")
    public ResponseEntity<List<InstructorSimpleResponseDto>> getInstructorList(
            @PathVariable(name = "facilityId") Long facilityId) {
        List<InstructorSimpleResponseDto> list = facilityUserService.getInstructorList(facilityId);
        return ResponseEntity.ok(list);
    }

    // 강사별 스케줄 목록 보기
    @GetMapping("/{facilityId}/instructors/{instructorId}/schedules")
    @Operation(summary = "강사별 캘린더 타임슬롯 조회")
    public ResponseEntity<List<TimeSlotSimpleResponseDto>> getInstructorTimeSlots(
            @PathVariable(name = "facilityId") Long facilityId,
            @PathVariable(name = "instructorId") Long instructorId,
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        List<TimeSlotSimpleResponseDto> slots =
                facilityUserService.getInstructorTimeSlots(facilityId, instructorId, startDate, endDate);
        return ResponseEntity.ok(slots);
    }

    // 예약 신청하기
    @PostMapping("/reservations")
    @Operation(summary = "유저 공용시설 예약하기", description = "유저가 등록된 공용시설을 예약하기")
    public ResponseEntity<Long> reservationFacility(
            @RequestBody @Valid FacilityReservationRequestDto requestDto
    ) {
        Long userId = SecurityUtil.getCurrentUser().getId();
        Long reservationId = facilityUserService.reservationFacility(userId, requestDto);
        return ResponseEntity.ok(reservationId);
    }

    // 내 예약 취소
    @DeleteMapping("/reservations/{facilityReservationId}")
    @Operation(summary = "유저 예약 취소", description = "유저가 예약한 공용시설을 예약 취소하기")
    public ResponseEntity<Void> cancelReservation(
            @PathVariable(name = "facilityReservationId") Long facilityReservationId,
            @RequestBody FacilityReservationCancelDto facilityReservationCancelDto
    ) {
        Long userId = SecurityUtil.getCurrentUser().getId();
        facilityUserService.cancelReservation(userId, facilityReservationId, facilityReservationCancelDto);
        return ResponseEntity.ok().build();
    }

    // 본인 예약 목록 조회
    @GetMapping("/reservations")
    @Operation(summary = "유저 예약 조회", description = "유저가 예약한 공용시설 예약 목록 조회")
    public ResponseEntity<List<FacilityReservationSimpleUserDto>> getMyReservations() {
        User user = SecurityUtil.getCurrentUser();
        List<FacilityReservationSimpleUserDto> reservationsList = facilityUserService.getMyReservations(user.getId());
        return ResponseEntity.ok(reservationsList);
    }

    // 본인 예약 단건 상세 조회
    @GetMapping("/reservations/{facilityReservationId}")
    public ResponseEntity<FacilityReservationUserDto> getMyReservationDetail(
            @PathVariable(name = "facilityReservationId") Long facilityReservationId
    ) {
        FacilityReservationUserDto facilityReservationUserDto = facilityUserService.getMyReservationDetail(
                facilityReservationId);
        return ResponseEntity.ok(facilityReservationUserDto);
    }
}
