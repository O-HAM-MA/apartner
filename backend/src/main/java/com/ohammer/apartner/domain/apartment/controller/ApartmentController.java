package com.ohammer.apartner.domain.apartment.controller;

import com.ohammer.apartner.domain.apartment.dto.ApartmentResponseDto;
import com.ohammer.apartner.domain.apartment.dto.BuildingResponseDto;
import com.ohammer.apartner.domain.apartment.dto.UnitResponseDto;
import com.ohammer.apartner.domain.apartment.service.ApartmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/apartments")
@Tag(name = "[사용자] 아파트 API", description = "아파트, 동, 호수 정보 조회 API")
public class ApartmentController {

    private final ApartmentService userApartmentService;

    @Operation(summary = "아파트 목록 조회 (검색)", description = "모든 아파트 목록을 조회하고, 이름, 주소, 우편번호로 검색합니다.")
    @ApiResponse(responseCode = "200", description = "아파트 목록 조회 성공",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = List.class)))
    @GetMapping
    public ResponseEntity<List<ApartmentResponseDto>> getAllApartments(
            @Parameter(description = "아파트 이름 검색어") @RequestParam(required = false) String name,
            @Parameter(description = "아파트 주소 검색어") @RequestParam(required = false) String address,
            @Parameter(description = "우편번호 검색어") @RequestParam(required = false) String zipcode) {
        return ResponseEntity.ok(userApartmentService.getAllApartments(name, address, zipcode));
    }

    @Operation(summary = "아파트 상세 조회", description = "특정 아파트 정보를 ID로 조회합니다.")
    @GetMapping("/{apartmentId}")
    public ResponseEntity<ApartmentResponseDto> getApartmentById(@PathVariable Long apartmentId) {
        return ResponseEntity.ok(userApartmentService.getApartmentById(apartmentId));
    }

    @Operation(summary = "특정 아파트의 동 목록 조회", description = "특정 아파트에 속한 모든 동 목록을 조회합니다.")
    @ApiResponse(responseCode = "200", description = "동 목록 조회 성공",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = List.class)))
    @GetMapping("/{apartmentId}/buildings")
    public ResponseEntity<List<BuildingResponseDto>> getBuildingsByApartment(
            @PathVariable Long apartmentId) {
        return ResponseEntity.ok(userApartmentService.getBuildingsByApartmentId(apartmentId));
    }

    @Operation(summary = "동 상세 조회", description = "특정 동 정보를 ID로 조회합니다.")
    @GetMapping("/buildings/{buildingId}")
    public ResponseEntity<BuildingResponseDto> getBuildingById(@PathVariable Long buildingId) {
        return ResponseEntity.ok(userApartmentService.getBuildingById(buildingId));
    }

    @Operation(summary = "특정 동의 호수 목록 조회", description = "특정 동에 속한 모든 호수 목록을 조회합니다.")
    @ApiResponse(responseCode = "200", description = "호수 목록 조회 성공",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = List.class)))
    @GetMapping("/buildings/{buildingId}/units")
    public ResponseEntity<List<UnitResponseDto>> getUnitsByBuilding(
            @PathVariable Long buildingId) {
        return ResponseEntity.ok(userApartmentService.getUnitsByBuildingId(buildingId));
    }

    @Operation(summary = "호수 상세 조회", description = "특정 호수 정보를 ID로 조회합니다.")
    @GetMapping("/units/{unitId}")
    public ResponseEntity<UnitResponseDto> getUnitById(@PathVariable Long unitId) {
        return ResponseEntity.ok(userApartmentService.getUnitById(unitId));
    }
}
