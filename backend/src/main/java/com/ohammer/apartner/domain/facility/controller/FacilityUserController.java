package com.ohammer.apartner.domain.facility.controller;

import com.ohammer.apartner.domain.facility.dto.request.FacilityReservationRequestDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityReservationSummaryDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityResponseDto;
import com.ohammer.apartner.domain.facility.entity.FacilityReservation;
import com.ohammer.apartner.domain.facility.entity.FacilityReservationStatus;
import com.ohammer.apartner.domain.facility.service.FacilityUserService;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/facilities")
public class FacilityUserController {

    private final FacilityUserService facilityUserService;

    // 시설 목록 보기
    @GetMapping
    public ResponseEntity<List<FacilityResponseDto>> getAllFacilities() {
        List<FacilityResponseDto> facilities = facilityUserService.getAllFacilities();
        return ResponseEntity.ok(facilities);
    }

    // 예약하기
    @PostMapping("/{facilityId}/reserve")
    public ResponseEntity<?> reserveFacility(
            @RequestParam(name = "userId") Long userId, // 추후 수정
            @PathVariable(name = "facilityId") Long facilityId,
            @RequestBody FacilityReservationRequestDto request
    ) {
        FacilityReservation reservation = facilityUserService.reserveFacility(
                userId,  // 추후 수정
                facilityId,
                request
        );
        return ResponseEntity.ok("예약 요청이 접수되었습니다.");
    }

    // 내 예약 조회 (전체, 날짜, 시설, 상태 선택 가능)
    @GetMapping("/reservations")
    public ResponseEntity<List<FacilityReservationSummaryDto>> getUserReservations(
            @RequestParam(name = "userId") Long userId, // 추후 수정
            @RequestParam(name = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(name = "facilityId", required = false) Long facilityId,
            @RequestParam(name = "status", required = false) FacilityReservationStatus status
    ) {
        List<FacilityReservationSummaryDto> reservations =
                facilityUserService.getUserReservationsWithFilter(userId, date, facilityId, status);
        return ResponseEntity.ok(reservations);
    }

    // 내 예약 취소
    @PatchMapping("/{facilityReservationId}/cancel")
    public ResponseEntity<?> cancelReservation(
            @RequestParam(name = "userId") Long userId, // 추후 수정
            @PathVariable(name = "facilityReservationId") Long facilityReservationId
    ) {
        facilityUserService.cancelReservation(userId, facilityReservationId);
        return ResponseEntity.ok("예약이 취소되었습니다");
    }
}
