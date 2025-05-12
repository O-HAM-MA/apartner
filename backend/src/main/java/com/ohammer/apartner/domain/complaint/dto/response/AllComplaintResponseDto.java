package com.ohammer.apartner.domain.complaint.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter@Setter@Builder
public class AllComplaintResponseDto {
    private Long id;
    private String title;
    private String category;
    private String status;
    private LocalDateTime createdAt;
}
