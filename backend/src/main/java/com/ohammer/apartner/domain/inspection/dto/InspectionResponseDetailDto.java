package com.ohammer.apartner.domain.inspection.dto;

import com.ohammer.apartner.domain.inspection.entity.InspectionType;
import com.ohammer.apartner.domain.inspection.entity.Result;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class InspectionResponseDetailDto {
    private Long inspectionId;
    private Long userId;
    private String userName;
    private LocalDateTime startAt;
    private LocalDateTime finishAt;
    private String title;
    private String detail;
    private Result result;
    private String typeName;
}
