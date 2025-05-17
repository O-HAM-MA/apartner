package com.ohammer.apartner.domain.vehicle.dto;

import lombok.Getter;

@Getter
public class ForeignVehicleRequestDto {

    private String vehicleNum;
    private String type;
    private String phone;
    private String reason; // 외부 차량 사유: 예) 배달, 방문 등

    private String buildingNum; // 입력받는 동
    private String unitNum;     // 입력받는 호수
}
