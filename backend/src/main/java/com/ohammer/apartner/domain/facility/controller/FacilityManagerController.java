package com.ohammer.apartner.domain.facility.controller;

import com.ohammer.apartner.domain.facility.dto.request.FacilityCreateRequestDto;
import com.ohammer.apartner.domain.facility.dto.request.FacilityUpdateRequestDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityManagerDetailResponseDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityManagerSimpleResponseDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityReservationManagerDto;
import com.ohammer.apartner.domain.facility.service.FacilityManagerService;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.security.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/facilities")
@Tag(name = "공용시설 예약 - 관리자")
public class FacilityManagerController {

    private final FacilityManagerService facilityManagerService;

    // 공용시설 등록
    @PostMapping("/new")
    @Operation(summary = "공용시설 등록")
    public ResponseEntity<Long> createFacility(@RequestBody @Valid FacilityCreateRequestDto facilityCreateRequestDto) {
        User user = SecurityUtil.getCurrentUser();
        Long apartmentId = user.getApartment().getId();
        Long facilityId = facilityManagerService.createFacility(facilityCreateRequestDto, apartmentId);
        return ResponseEntity.ok(facilityId);
    }

    // 공용시설 수정
    @PutMapping("/{facilityId}")
    @Operation(summary = "공용시설 수정")
    public ResponseEntity<Void> updateFacility(@PathVariable(name = "facilityId") Long facilityId,
                                               @RequestBody @Valid FacilityUpdateRequestDto facilityUpdateRequestDto) {
        User user = SecurityUtil.getCurrentUser();
        Long apartmentId = user.getApartment().getId();
        facilityManagerService.updateFacility(facilityId, facilityUpdateRequestDto, apartmentId);
        return ResponseEntity.ok().build();
    }

    // 공용시설 삭제 (비활성화)
    @DeleteMapping("/{facilityId}")
    @Operation(summary = "시설 삭제(비활성화)")
    public ResponseEntity<Void> deleteFacility(@PathVariable(name = "facilityId") Long facilityId) {
        facilityManagerService.deleteFacility(facilityId);
        return ResponseEntity.ok().build();
    }

    // 공용시설 목록 조회
    @GetMapping
    @Operation(summary = "공용시설 목록 조회 [관리자]")
    public ResponseEntity<List<FacilityManagerSimpleResponseDto>> getFacilityList() {
        User user = SecurityUtil.getCurrentUser();
        Long apartmentId = user.getApartment().getId();
        return ResponseEntity.ok(facilityManagerService.getFacilityList(apartmentId));
    }

    // 상세 조회
    @GetMapping("/{facilityId}")
    @Operation(summary = "공용시설 상세 조회 [관리자]")
    public ResponseEntity<FacilityManagerDetailResponseDto> getFacilityDetail(@PathVariable Long facilityId) {
        return ResponseEntity.ok(facilityManagerService.getFacilityDetail(facilityId));
    }

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