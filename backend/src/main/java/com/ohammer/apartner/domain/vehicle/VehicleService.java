package com.ohammer.apartner.domain.vehicle;

import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.vehicle.dto.ForeignVehicleRequestDto;
import com.ohammer.apartner.domain.vehicle.dto.ResidentVehicleRequestDto;
import com.ohammer.apartner.domain.vehicle.dto.VehicleRegistrationInfoDto;
import com.ohammer.apartner.domain.vehicle.dto.VehicleResponseDto;
import com.ohammer.apartner.domain.vehicle.entity.Vehicle;
//import jakarta.transaction.Transactional;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.ohammer.apartner.domain.user.entity.UserRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    // 입주민 차량 등록
    @Transactional
    public VehicleResponseDto registerResidentVehicle(ResidentVehicleRequestDto dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        Vehicle vehicle = Vehicle.builder()
                .user(user)
                .vehicleNum(dto.getVehicleNum())
                .type(dto.getType())
                .isForeign(false)
                .status(Vehicle.Status.ACTIVE)
                .build();

        vehicleRepository.save(vehicle);

        return VehicleResponseDto.from(vehicle);
    }

    // 외부 차량 등록
    @Transactional
    public VehicleResponseDto registerForeignVehicle(ForeignVehicleRequestDto dto) {
        Vehicle vehicle = Vehicle.builder()
                .vehicleNum(dto.getVehicleNum())
                .type(dto.getType())
                .isForeign(true)
                .status(Vehicle.Status.ACTIVE)
                .reason(dto.getReason())
                .build();

        vehicleRepository.save(vehicle);

        return VehicleResponseDto.fromForeign(vehicle, dto.getPhone());
    }



    public List<VehicleResponseDto> getResidentVehicles() {
        List<Vehicle> vehicles = vehicleRepository.findByIsForeignFalse();

        return vehicles.stream()
                .map(VehicleResponseDto::from)
                .collect(Collectors.toList());
    }

    public List<VehicleResponseDto> getForeignVehicles() {
        List<Vehicle> vehicles = vehicleRepository.findByIsForeignTrue();

        return vehicles.stream()
                .map(v -> VehicleResponseDto.fromForeign(v, v.getUser() != null ? v.getUser().getPhone() : v.getPhone()))
                .collect(Collectors.toList());
    }


    @Transactional(readOnly = true)
    public List<VehicleRegistrationInfoDto> getVehicleRegistrationInfo(Boolean isForeign) {


        List<Vehicle> vehicles = vehicleRepository.findByIsForeign(isForeign);
        return vehicles.stream()
                .map(vehicle -> convertToDto(vehicle))
                .collect(Collectors.toList());

//        List<Vehicle> vehicles;
//
//        if (isForeign == null) {
//            vehicles = vehicleRepository.findAll();  // 전체 조회
//        } else {
//            vehicles = vehicleRepository.findByIsForeign(isForeign);  // 조건 조회
//        }
//
//        return vehicles.stream()
//                .map(this::toDto)
//                .collect(Collectors.toList());


    }

    private VehicleRegistrationInfoDto convertToDto(Vehicle vehicle) {
        // 외부인과 거주자의 구분에 따라 DTO를 매핑
        if (vehicle.getIsForeign()) {
            return VehicleRegistrationInfoDto.builder()
                    .vehicleNum(vehicle.getVehicleNum())
                    .type(vehicle.getType())
                    .reason(vehicle.getReason()) // 외부인만 reason
                    .phone(vehicle.getPhone()) // 외부인만 phone
                    .build();
        } else {
            User user = vehicle.getUser();
            return VehicleRegistrationInfoDto.builder()
                    .vehicleNum(vehicle.getVehicleNum())
                    .type(vehicle.getType())
                    .userPhone(user.getPhone()) // 거주자일 경우 phone은 user에서 가져옴
                    .buildingName(user.getBuilding().getBuildingNumber())
                    .unitName(user.getUnit().getUnitNumber())
                    .build();
        }
    }








}
