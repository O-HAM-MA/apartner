package com.ohammer.apartner.domain.apartment.controller;

import com.ohammer.apartner.domain.apartment.dto.ApartmentRequestDto;
import com.ohammer.apartner.domain.apartment.dto.ApartmentResponseDto;
import com.ohammer.apartner.domain.apartment.dto.BuildingRequestDto;
import com.ohammer.apartner.domain.apartment.dto.BuildingResponseDto;
import com.ohammer.apartner.domain.apartment.dto.UnitRequestDto;
import com.ohammer.apartner.domain.apartment.dto.UnitResponseDto;
import com.ohammer.apartner.domain.apartment.service.AdminApartmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/apartments")
@Tag(name = "[관리자] 아파트 API", description = "아파트, 동, 호수 정보 관리 API (관리자 전용)")
public class AdminApartmentController {

    private final AdminApartmentService adminApartmentService;

    @Operation(summary = "[관리자] 아파트 목록 조회 (페이징 및 검색)", description = "모든 아파트 목록을 페이징 처리하여 조회하고, 이름, 주소, 우편번호로 검색합니다.")
    @ApiResponse(responseCode = "200", description = "아파트 목록 조회 성공",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Page.class)))
    @GetMapping
    public ResponseEntity<Page<ApartmentResponseDto>> getAllApartments(
            @Parameter(description = "아파트 이름 검색어") @RequestParam(required = false) String name,
            @Parameter(description = "아파트 주소 검색어") @RequestParam(required = false) String address,
            @Parameter(description = "우편번호 검색어") @RequestParam(required = false) String zipcode,
            @PageableDefault(size = 10, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(adminApartmentService.getAllApartments(name, address, zipcode, pageable));
    }

    @Operation(summary = "[관리자] 아파트 상세 조회", description = "특정 아파트 정보를 ID로 조회합니다.")
    @GetMapping("/{apartmentId}")
    public ResponseEntity<ApartmentResponseDto> getApartmentById(@PathVariable Long apartmentId) {
        return ResponseEntity.ok(adminApartmentService.getApartmentById(apartmentId));
    }

    @Operation(summary = "[관리자] 아파트 생성", description = "새로운 아파트를 생성합니다.")
    @PostMapping
    public ResponseEntity<ApartmentResponseDto> createApartment(@Valid @RequestBody ApartmentRequestDto requestDto) {
        ApartmentResponseDto createdApartment = adminApartmentService.createApartment(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdApartment);
    }

    @Operation(summary = "[관리자] 아파트 수정", description = "기존 아파트 정보를 수정합니다.")
    @PutMapping("/{apartmentId}")
    public ResponseEntity<ApartmentResponseDto> updateApartment(@PathVariable Long apartmentId,
                                                                @Valid @RequestBody ApartmentRequestDto requestDto) {
        return ResponseEntity.ok(adminApartmentService.updateApartment(apartmentId, requestDto));
    }

    @Operation(summary = "[관리자] 아파트 삭제", description = "특정 아파트를 삭제합니다.")
    @DeleteMapping("/{apartmentId}")
    public ResponseEntity<Void> deleteApartment(@PathVariable Long apartmentId) {
        adminApartmentService.deleteApartment(apartmentId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "[관리자] 특정 아파트의 동 목록 조회 (페이징)", description = "특정 아파트에 속한 모든 동 목록을 페이징 처리하여 조회합니다.")
    @GetMapping("/{apartmentId}/buildings")
    @Transactional(readOnly = true)
    public ResponseEntity<Page<BuildingResponseDto>> getBuildingsByApartment(
            @PathVariable(name = "apartmentId") Long apartmentId,
            @PageableDefault(size = 10, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(adminApartmentService.getBuildingsByApartmentId(apartmentId, pageable));
    }

    @Operation(summary = "[관리자] 동 상세 조회", description = "특정 동 정보를 ID로 조회합니다.")
    @GetMapping("/buildings/{buildingId}")
    public ResponseEntity<BuildingResponseDto> getBuildingById(@PathVariable(name = "buildingId") Long buildingId) {
        return ResponseEntity.ok(adminApartmentService.getBuildingById(buildingId));
    }

    @Operation(summary = "[관리자] 동 생성", description = "새로운 동을 생성합니다.")
    @PostMapping("/buildings")
    public ResponseEntity<BuildingResponseDto> createBuilding(@Valid @RequestBody BuildingRequestDto requestDto) {
        BuildingResponseDto createdBuilding = adminApartmentService.createBuilding(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdBuilding);
    }

    @Operation(summary = "[관리자] 동 수정", description = "기존 동 정보를 수정합니다.")
    @PutMapping("/buildings/{buildingId}")
    public ResponseEntity<BuildingResponseDto> updateBuilding(@PathVariable Long buildingId,
                                                              @Valid @RequestBody BuildingRequestDto requestDto) {
        return ResponseEntity.ok(adminApartmentService.updateBuilding(buildingId, requestDto));
    }

    @Operation(summary = "[관리자] 동 삭제", description = "특정 동을 삭제합니다.")
    @DeleteMapping("/buildings/{buildingId}")
    public ResponseEntity<Void> deleteBuilding(@PathVariable Long buildingId) {
        adminApartmentService.deleteBuilding(buildingId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "[관리자] 특정 동의 호수 목록 조회 (페이징)", description = "특정 동에 속한 모든 호수 목록을 페이징 처리하여 조회합니다.")
    @GetMapping("/buildings/{buildingId}/units")
    public ResponseEntity<Page<UnitResponseDto>> getUnitsByBuilding(
            @PathVariable Long buildingId,
            @PageableDefault(size = 10, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(adminApartmentService.getUnitsByBuildingId(buildingId, pageable));
    }

    @Operation(summary = "[관리자] 호수 상세 조회", description = "특정 호수 정보를 ID로 조회합니다.")
    @GetMapping("/units/{unitId}")
    public ResponseEntity<UnitResponseDto> getUnitById(@PathVariable Long unitId) {
        return ResponseEntity.ok(adminApartmentService.getUnitById(unitId));
    }

    @Operation(summary = "[관리자] 호수 생성", description = "새로운 호수를 생성합니다.")
    @PostMapping("/units")
    public ResponseEntity<UnitResponseDto> createUnit(@Valid @RequestBody UnitRequestDto requestDto) {
        UnitResponseDto createdUnit = adminApartmentService.createUnit(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUnit);
    }

    @Operation(summary = "[관리자] 호수 수정", description = "기존 호수 정보를 수정합니다.")
    @PutMapping("/units/{unitId}")
    public ResponseEntity<UnitResponseDto> updateUnit(@PathVariable Long unitId,
                                                      @Valid @RequestBody UnitRequestDto requestDto) {
        return ResponseEntity.ok(adminApartmentService.updateUnit(unitId, requestDto));
    }

    @Operation(summary = "[관리자] 호수 삭제", description = "특정 호수를 삭제합니다.")
    @DeleteMapping("/units/{unitId}")
    public ResponseEntity<Void> deleteUnit(@PathVariable Long unitId) {
        adminApartmentService.deleteUnit(unitId);
        return ResponseEntity.noContent().build();
    }
}
