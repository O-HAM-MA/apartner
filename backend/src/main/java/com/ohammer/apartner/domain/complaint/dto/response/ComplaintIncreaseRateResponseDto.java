package com.ohammer.apartner.domain.complaint.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter@Builder
public class ComplaintIncreaseRateResponseDto {
    private Long todayCount;
    private Long yesterdayCount;
    private double increaseRate;
}
