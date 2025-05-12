package com.ohammer.apartner.domain.facility.controller;

import com.ohammer.apartner.domain.facility.dto.request.FacilityReservationRequestDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityResponseDto;
import com.ohammer.apartner.domain.facility.entity.FacilityReservation;
import com.ohammer.apartner.domain.facility.service.FacilityUserService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
public class FacilityUserController {

    private final FacilityUserService facilityUserService;

    @GetMapping
    public ResponseEntity<List<FacilityResponseDto>> getAllFacilities() {
        List<FacilityResponseDto> facilities = facilityUserService.getAllFacilities();
        return ResponseEntity.ok(facilities);
    }

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


}
