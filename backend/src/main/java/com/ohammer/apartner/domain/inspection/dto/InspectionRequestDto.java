package com.ohammer.apartner.domain.inspection.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class InspectionRequestDto {
    private LocalDateTime startAt;
    private LocalDateTime finishAt;
    private String detail;
    private String type;
}
