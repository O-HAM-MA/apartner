package com.ohammer.apartner.domain.complaint.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Getter@Setter@Builder
public class AllComplaintResponseDto {
    private Long id;
    private String title;
    private String category;
    private String status;
    private LocalDateTime createdAt;
}
