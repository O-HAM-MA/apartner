package com.ohammer.apartner.domain.facility.controller;

import com.ohammer.apartner.domain.facility.dto.request.FacilityCreateRequestDto;
import com.ohammer.apartner.domain.facility.dto.request.FacilityReservationStatusUpdateDto;
import com.ohammer.apartner.domain.facility.dto.request.FacilityUpdateRequestDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityReservationManagerDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityReservationSimpleManagerDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilitySimpleResponseDto;
import com.ohammer.apartner.domain.facility.service.FacilityManagerService;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.security.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/facilities")
@Tag(name = "공용시설 - 관리자")
public class FacilityManagerController {

    private final FacilityManagerService facilityManagerService;

    // 공용시설 등록
    @PostMapping
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
    public ResponseEntity<List<FacilitySimpleResponseDto>> getFacilityList() {
        User user = SecurityUtil.getCurrentUser();
        Long apartmentId = user.getApartment().getId();
        return ResponseEntity.ok(facilityManagerService.getFacilityList(apartmentId));
    }

    // 공용시설 단건 조회
    @GetMapping("/{facilityId}")
    @Operation(summary = "공용시설 단건 조회 [관리자]")
    public ResponseEntity<FacilitySimpleResponseDto> getFacility(
            @PathVariable(name = "facilityId") Long facilityId) {
        User user = SecurityUtil.getCurrentUser();
        Long apartmentId = user.getApartment().getId();
        return ResponseEntity.ok(facilityManagerService.getFacility(facilityId, apartmentId));
    }

//    // 상세 조회
//    @GetMapping("/{facilityId}")
//    @Operation(summary = "공용시설 상세 조회 [관리자]")
//    public ResponseEntity<FacilityManagerDetailResponseDto> getFacilityDetail(
//            @PathVariable(name = "facilityId") Long facilityId) {
//        User user = SecurityUtil.getCurrentUser();
//        Long apartmentId = user.getApartment().getId();
//        return ResponseEntity.ok(facilityManagerService.getFacilityDetail(facilityId, apartmentId));
//    }

    // ----- 예약 관리
    // 예약 목록 조회
    @GetMapping("/reservations")
    @Operation(summary = "유저들의 예약 목록 조회")
    public ResponseEntity<List<FacilityReservationSimpleManagerDto>> getReservationsByApartment(
    ) {
        User user = SecurityUtil.getCurrentUser();
        Long apartmentId = user.getApartment().getId();
        List<FacilityReservationSimpleManagerDto> list = facilityManagerService.getReservationsByApartment(apartmentId);
        return ResponseEntity.ok(list);
    }

    // 예약 상세 조회
    @GetMapping("/reservations/{reservationId}")
    @Operation(summary = "유저들의 예약 상세 조회")
    public ResponseEntity<FacilityReservationManagerDto> getReservationDetail(
            @PathVariable(name = "reservationId") Long reservationId
    ) {
        FacilityReservationManagerDto dto = facilityManagerService.getReservationDetail(reservationId);
        return ResponseEntity.ok(dto);
    }

    // 예약 상태 변경
    @PatchMapping("/reservations/{reservationId}/status")
    @Operation(
            summary = "유저들의 예약 상태 변경",
            description = "유저들의 예약 상태 pending/agree/reject로 변경하기 "
    )
    public ResponseEntity<Void> updateReservationStatus(
            @PathVariable(name = "reservationId") Long reservationId,
            @RequestBody FacilityReservationStatusUpdateDto requestDto
    ) {
        facilityManagerService.updateReservationStatus(reservationId, requestDto.getStatus());
        return ResponseEntity.ok().build();
    }

}