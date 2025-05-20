package com.ohammer.apartner.domain.complaint.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter@Builder@AllArgsConstructor
public class ComplaintHandlingRateResponseDto {
    private long totalCount;
    private long handledCount;
    private double handlingRate;
}
