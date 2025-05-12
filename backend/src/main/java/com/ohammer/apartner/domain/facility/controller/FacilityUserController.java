package com.ohammer.apartner.domain.facility.controller;

import com.ohammer.apartner.domain.facility.dto.response.FacilityResponseDto;
import com.ohammer.apartner.domain.facility.service.FacilityUserService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/facilities")
public class FacilityController {

    private final FacilityUserService facilityUserService;

    @GetMapping
    public ResponseEntity<List<FacilityResponseDto>> getAllFacilities() {
        List<FacilityResponseDto> facilities = facilityUserService.getAllFacilities();
        return ResponseEntity.ok(facilities);
    }
}
