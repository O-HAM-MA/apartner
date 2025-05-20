package com.ohammer.apartner.domain.complaint.dto.response;

import com.ohammer.apartner.domain.complaint.entity.Complaint;
import com.ohammer.apartner.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter@Setter@Builder
public class UpdateComplaintFeedbackResponseDto {

    private Long id;
    private Long userId;
    private String content;
    private LocalDateTime createdAt;
}
