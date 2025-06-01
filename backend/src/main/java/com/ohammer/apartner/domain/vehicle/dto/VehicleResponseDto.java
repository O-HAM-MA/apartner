package com.ohammer.apartner.domain.vehicle.dto;


import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.vehicle.entity.Vehicle;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Builder
@Setter
public class VehicleResponseDto {

    private String vehicleNum;
    private String type;
    private String userPhone; // 거주자일 경우
    private String buildingName;
    private String unitName;
    private String reason; // 외부차량용: 방문 사유




    // 입주민 차량 등록용
    public static VehicleResponseDto from(Vehicle vehicle) {
        User user = vehicle.getUser();

        return VehicleResponseDto.builder()
                .vehicleNum(vehicle.getVehicleNum())
                .type(vehicle.getType())
                .userPhone(user != null ? user.getPhoneNum() : null)
                .buildingName(user != null && user.getBuilding() != null ? user.getBuilding().getBuildingNumber() : null)
                .unitName(user != null && user.getUnit() != null ? user.getUnit().getUnitNumber() : null)
                .build();
    }

    // 외부 차량 등록용
    public static VehicleResponseDto fromForeign(Vehicle vehicle, String phone) {
        return VehicleResponseDto.builder()
                .vehicleNum(vehicle.getVehicleNum())
                .type(vehicle.getType())
                .userPhone(phone)
                .reason(vehicle.getReason())
                .build();
    }


}
