package com.ohammer.apartner.domain.vehicle.controller;


import com.ohammer.apartner.domain.vehicle.dto.*;
import com.ohammer.apartner.domain.vehicle.service.VehicleService;
import com.ohammer.apartner.security.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "차량 관리 api")
@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    // 입주민 차량 등록
    @Tag(name = "입주민이 주차장에 주차하러 차량 등록")
    @PostMapping("/residents")
    public ResponseEntity<VehicleResponseDto> registerResidentVehicle(@RequestBody ResidentVehicleRequestDto dto) {
        VehicleResponseDto response = vehicleService.registerResidentVehicle(dto);
        return ResponseEntity.ok(response);
    }

    // 외부 차량 등록
    @Tag(name = "외부 손님이 주차장에 주차하러 차량 등록")
    @PostMapping("/foreigns")
    public ResponseEntity<VehicleResponseDto> registerForeignVehicle(@RequestBody ForeignVehicleRequestDto dto) {
        VehicleResponseDto response = vehicleService.registerForeignVehicle(dto);
        return ResponseEntity.ok(response);
    }


//    @GetMapping("/resident")
//    public ResponseEntity<List<VehicleResponseDto>> getResidentVehicles() {
//        return ResponseEntity.ok(vehicleService.getResidentVehicles());
//    }
//
//    @GetMapping("/foreign")
//    public ResponseEntity<List<VehicleResponseDto>> getForeignVehicles() {
//        return ResponseEntity.ok(vehicleService.getForeignVehicles());
//    }

//    @GetMapping("/registrations")
//    public ResponseEntity<List<VehicleRegistrationInfoDto>> getVehicleRegistrations(
//            @RequestParam(name = "isForeign",  required = false) Boolean isForeign) {
//        List<VehicleRegistrationInfoDto> registrations = vehicleService.getVehicleRegistrationInfo(isForeign);
//        return ResponseEntity.ok(registrations);
//    }

    @Tag(name = "등록된 모든 차량 조회")
    @GetMapping("/registrationsWithStatus")
    public ResponseEntity<List<VehicleRegistrationInfoDto>> getRegistrations(
            @RequestParam(value = "isForeign", required = false) Boolean isForeign
    ) {
        List<VehicleRegistrationInfoDto> registrations = vehicleService.getVehicleRegistrationInfo(isForeign);
        return ResponseEntity.ok(registrations);
    }


    @Tag(name = "등록된 차량을 수정")
    @PatchMapping("/update/{vehicleId}")
    public void updateVehicle(@PathVariable(value = "vehicleId") Long vehicleId,
                              @RequestBody VehicleUpdateRequestDto dto) {
        vehicleService.updateVehicle(vehicleId, dto);
    }

    @Tag(name = "등록된 차량을 삭제")
    @DeleteMapping("/delete/{vehicleId}")
    public ResponseEntity<String> deleteVehicle(@PathVariable(value = "vehicleId") Long vehicleId) {
        try {
            vehicleService.deleteVehicle(vehicleId);
            return new ResponseEntity<>("차량이 삭제되었습니다.", HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }


    @Tag(name = "주차 권한을 가진 차량들만 조회")
    @GetMapping("/approved")
    public ResponseEntity<List<VehicleRegistrationInfoDto>> getApprovedVehicles() {
        List<VehicleRegistrationInfoDto> approvedVehicles = vehicleService.getApprovedVehicles();
        return ResponseEntity.ok(approvedVehicles);
    }

    @Tag(name = "주차 승인을 받지 못해 대기하고 있는 외부 차량 리스트 조회")
    @GetMapping("/visitors/pending")
    public ResponseEntity<List<VehicleRegistrationInfoDto>> getMyRequests() {
        Long inviterId = SecurityUtil.getCurrentUserId();
        if (inviterId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok(
                vehicleService.getMyVisitorRequests(inviterId)
        );
    }

    @Tag(name = "입주민의 허가는 받았지만 관리자의 최종 승인은 받지 못해 대기하는 외부 차량 리스트 조회")
    @GetMapping("/invited-approved")
    public ResponseEntity<List<VehicleRegistrationInfoDto>> getInvitedApprovedVehicles() {
        List<VehicleRegistrationInfoDto> approvedVehicles = vehicleService.getInvitedApprovedVehicles();
        return ResponseEntity.ok(approvedVehicles);
    }

    @Tag(name = "현재 주차 중인 차량 리스트 조회")
    @GetMapping("/active")
    public ResponseEntity<List<VehicleRegistrationInfoDto>> getActiveVehicles() {
        List<VehicleRegistrationInfoDto> list = vehicleService.getActiveVehicles();
        return ResponseEntity.ok(list);
    }

    @Tag(name = "주차랑 수용 공간과 현재 주차된 차량 수, 그리고 남은 주차 공간")
    @GetMapping("/status")
    public ResponseEntity<ParkingStatusDto> getParkingStatus() {
        return ResponseEntity.ok(vehicleService.getParkingStatus());
    }

    @Tag(name = "입주민이 자신 앞으로 등록된 차량 리스트 조회")
    @GetMapping("/mine")
    public ResponseEntity<List<VehicleRegistrationInfoDto>> getMyVehicles() {
        List<VehicleRegistrationInfoDto> list = vehicleService.getMyVehicleRegistrations();
        return ResponseEntity.ok(list);
    }








}
