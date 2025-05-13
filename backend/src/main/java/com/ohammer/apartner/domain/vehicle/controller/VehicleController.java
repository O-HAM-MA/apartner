package com.ohammer.apartner.domain.vehicle.controller;


import com.ohammer.apartner.domain.vehicle.service.VehicleService;
import com.ohammer.apartner.domain.vehicle.dto.ResidentVehicleRequestDto;
import com.ohammer.apartner.domain.vehicle.dto.ForeignVehicleRequestDto;
import com.ohammer.apartner.domain.vehicle.dto.VehicleRegistrationInfoDto;
import com.ohammer.apartner.domain.vehicle.dto.VehicleResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    // 입주민 차량 등록
    @PostMapping("/residents")
    public ResponseEntity<VehicleResponseDto> registerResidentVehicle(@RequestBody ResidentVehicleRequestDto dto) {
        VehicleResponseDto response = vehicleService.registerResidentVehicle(dto);
        return ResponseEntity.ok(response);
    }

    // 외부 차량 등록
    @PostMapping("/foreigns")
    public ResponseEntity<VehicleResponseDto> registerForeignVehicle(@RequestBody ForeignVehicleRequestDto dto) {
        VehicleResponseDto response = vehicleService.registerForeignVehicle(dto);
        return ResponseEntity.ok(response);
    }


    @GetMapping("/resident")
    public ResponseEntity<List<VehicleResponseDto>> getResidentVehicles() {
        return ResponseEntity.ok(vehicleService.getResidentVehicles());
    }

    @GetMapping("/foreign")
    public ResponseEntity<List<VehicleResponseDto>> getForeignVehicles() {
        return ResponseEntity.ok(vehicleService.getForeignVehicles());
    }

    @GetMapping("/registrations")
    public ResponseEntity<List<VehicleRegistrationInfoDto>> getVehicleRegistrations(
            @RequestParam(name = "isForeign",  required = false) Boolean isForeign) {
        List<VehicleRegistrationInfoDto> registrations = vehicleService.getVehicleRegistrationInfo(isForeign);
        return ResponseEntity.ok(registrations);
    }




}
