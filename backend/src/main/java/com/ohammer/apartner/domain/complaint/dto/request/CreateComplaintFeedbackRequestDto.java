package com.ohammer.apartner.domain.complaint.dto.request;

import com.ohammer.apartner.domain.complaint.entity.ComplaintFeedback;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter@Setter@Builder
public class CreateComplaintFeedbackRequestDto {
    private Long complaintId;
    private String content;
}
