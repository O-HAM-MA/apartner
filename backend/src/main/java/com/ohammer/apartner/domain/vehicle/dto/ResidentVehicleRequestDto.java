package com.ohammer.apartner.domain.vehicle.dto;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class ResidentVehicleRequestDto {

    private Long userId;
    private String vehicleNum;
    private String type;
}
