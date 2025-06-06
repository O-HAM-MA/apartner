package com.ohammer.apartner.domain.inspection.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class IssueResponseDetailDto {
    private Long inspectionId;
    private Long id;
    private Long userId;
    private String userName;
    private String title;
    private String typeName;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
