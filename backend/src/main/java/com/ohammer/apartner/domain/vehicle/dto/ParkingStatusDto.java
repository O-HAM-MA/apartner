package com.ohammer.apartner.domain.vehicle.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParkingStatusDto {
    private int totalCapacity;   // 총 주차 가능 수
    private long activeCount;    // 현재 ACTIVE 차량 수
    private int remainingSpace;  // 남은 자리 수
}
