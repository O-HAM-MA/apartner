package com.ohammer.apartner.domain.apartment.controller;

import com.ohammer.apartner.domain.apartment.dto.ApartmentResponseDto;
import com.ohammer.apartner.domain.apartment.dto.BuildingResponseDto;
import com.ohammer.apartner.domain.apartment.dto.UnitResponseDto;
import com.ohammer.apartner.domain.apartment.service.ApartmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/apartments")
@Tag(name = "아파트 API", description = "아파트, 동, 호수 정보 API")
public class ApartmentController {

    private final ApartmentService apartmentService;

    @Operation(summary = "아파트 목록 조회", description = "모든 아파트 목록을 조회합니다.")
    @GetMapping
    public ResponseEntity<List<ApartmentResponseDto>> getAllApartments() {
        return ResponseEntity.ok(apartmentService.getAllApartments());
    }

    @Operation(summary = "동 목록 조회", description = "특정 아파트의 모든 동 목록을 조회합니다.")
    @GetMapping("/{apartmentId}/buildings")
    public ResponseEntity<List<BuildingResponseDto>> getBuildingsByApartment(@PathVariable(name = "apartmentId") Long apartmentId) {
        return ResponseEntity.ok(apartmentService.getBuildingsByApartmentId(apartmentId));
    }

    @Operation(summary = "호수 목록 조회", description = "특정 동의 모든 호수 목록을 조회합니다.")
    @GetMapping("/buildings/{buildingId}/units")
    public ResponseEntity<List<UnitResponseDto>> getUnitsByBuilding(@PathVariable(name = "buildingId") Long buildingId) {
        return ResponseEntity.ok(apartmentService.getUnitsByBuildingId(buildingId));
    }
} 