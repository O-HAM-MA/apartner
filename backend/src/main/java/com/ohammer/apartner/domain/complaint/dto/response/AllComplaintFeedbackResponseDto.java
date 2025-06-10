package com.ohammer.apartner.domain.complaint.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Getter@Setter@Builder
public class AllComplaintFeedbackResponseDto {

    private Long feedbackId;

    // 변경에 따라
    private String userName;

    private String content;

    private String userRole;

    private LocalDateTime createAt;
}
