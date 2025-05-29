package com.ohammer.apartner.domain.vehicle.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Setter
public class VehicleUpdateRequestDto {

    private String vehicleNum;
    private String type;


}
