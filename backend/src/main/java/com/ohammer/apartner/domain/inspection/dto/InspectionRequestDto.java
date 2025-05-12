package com.ohammer.apartner.domain.inspection.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Getter
@RequiredArgsConstructor
public class InspectionRequestDto {
    private LocalDateTime startAt;
    private LocalDateTime finishAt;
    private String detail;
    private String type;
}
