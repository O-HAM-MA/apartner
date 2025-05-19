package com.ohammer.apartner.domain.complaint.dto.response;

import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter@Setter@Builder
public class UpdateComplaintStatusResponseDto {
    private Long id;
    private String title;
    private String content;
}
