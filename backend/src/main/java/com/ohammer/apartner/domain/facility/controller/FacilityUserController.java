package com.ohammer.apartner.domain.facility.controller;

import com.ohammer.apartner.domain.facility.dto.request.FacilityReservationRequestDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityReservationUserDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityUserSimpleResponseDto;
import com.ohammer.apartner.domain.facility.entity.FacilityReservation;
import com.ohammer.apartner.domain.facility.service.FacilityUserService;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.security.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "공용시설 예약")
public class FacilityUserController {

    private final FacilityUserService facilityUserService;

    // 시설 목록 보기
    @GetMapping
    @Operation(
            summary = "공용시설 목록 조회",
            description = "등록된 공용시설 목록 조희"
    )
    public ResponseEntity<List<FacilityUserSimpleResponseDto>> getAllFacilities() {
        List<FacilityUserSimpleResponseDto> facilities = facilityUserService.getAllFacilities();
        return ResponseEntity.ok(facilities);
    }

    // 예약하기
    @PostMapping("/{facilityId}/reserve")
    @Operation(
            summary = "유저 공용시설 예약하기",
            description = "유저가 등록된 공용시설을 예약하기",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    public ResponseEntity<?> reserveFacility(
            @PathVariable(name = "facilityId") Long facilityId,
            @RequestBody FacilityReservationRequestDto request
    ) {
        User user = SecurityUtil.getCurrentUser();
        facilityUserService.reserveFacility(user.getId(), facilityId, request);
        return ResponseEntity.ok("예약 요청이 접수되었습니다.");
    }

    // 내 예약 조회 (전체, 날짜, 시설, 상태 선택 가능)
    @GetMapping("/reservations")
    @Operation(
            summary = "유저 예약 조회",
            description = "유저가 예약한 공용시설 예약 조회(전체보기, 시설, 예약 상태, 날짜 필터링 가능)"
    )
    public ResponseEntity<List<FacilityReservationUserDto>> getUserReservations(
            @RequestParam(name = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(name = "facilityId", required = false) Long facilityId,
            @RequestParam(name = "status", required = false) FacilityReservation.Status status
    ) {
        User user = SecurityUtil.getCurrentUser();
        List<FacilityReservationUserDto> reservations =
                facilityUserService.getUserReservationsWithFilter(user.getId(), date, facilityId, status);
        return ResponseEntity.ok(reservations);
    }

    // 내 예약 취소
    @Operation(
            summary = "유저 예약 취소",
            description = "유저가 예약한 공용시설을 예약 취소하기"
    )
    @PatchMapping("/{facilityReservationId}/cancel")
    public ResponseEntity<?> cancelReservation(
            @PathVariable(name = "facilityReservationId") Long facilityReservationId
    ) {
        User user = SecurityUtil.getCurrentUser();
        facilityUserService.cancelReservation(user.getId(), facilityReservationId);
        return ResponseEntity.ok("예약이 취소되었습니다");
    }
}
