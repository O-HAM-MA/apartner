package com.ohammer.apartner.domain.complaint.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter@Setter@Builder
public class AllComplaintFeedbackResponseDto {

    private Long feedbackId;

    // 변경에 따라
    private String userName;

    private String content;

    private LocalDateTime createAt;
}
