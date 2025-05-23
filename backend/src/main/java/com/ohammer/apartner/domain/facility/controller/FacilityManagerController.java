package com.ohammer.apartner.domain.facility.controller;

import com.ohammer.apartner.domain.facility.dto.response.FacilityReservationManagerDto;
import com.ohammer.apartner.domain.facility.service.FacilityManagerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/facilities/manager")
@Tag(name = "공용시설 예약 - 관리자")
public class FacilityManagerController {

    private final FacilityManagerService facilityManagerService;

    // 예약 목록 조회
    @GetMapping("/reservations")
    @Operation(
            summary = "유저들의 예약 목록 조회",
            description = "유저들의 예약 목록 조희 - 전체보기, 시설별, 예약상태별, 날짜별"
    )
    public ResponseEntity<Page<FacilityReservationManagerDto>> getReservations(
            @RequestParam(name = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(name = "facilityId", required = false) Long facilityId,
            @RequestParam(name = "status", required = false) String status,
            Pageable pageable
    ) {
        Page<FacilityReservationManagerDto> result = facilityManagerService.getReservations(
                date, facilityId, status, pageable
        );

        return ResponseEntity.ok(result);
    }

    // 예약 상태 변경
    @PatchMapping("/reservations/{facilityReservationId}/status")
    @Operation(
            summary = "유저들의 예약 상태 변경",
            description = "유저들의 예약 상태 pending/agree/reject로 변경하기 "
    )
    public ResponseEntity<String> changeReservationStatus(
            @PathVariable(name = "facilityReservationId") Long facilityReservationId,
            @RequestParam(name = "status") String status
    ) {
        facilityManagerService.updateReservationStatus(facilityReservationId, status);
        return ResponseEntity.ok("예약 상태가 성공적으로 변경되었습니다:" + status);
    }


}