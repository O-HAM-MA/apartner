package com.ohammer.apartner.domain.complaint.dto.request;

import com.ohammer.apartner.domain.complaint.entity.ComplaintFeedback;
import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter@Setter@Builder
public class CreateComplaintFeedbackRequestDto {
    private Long complaintId;
    private String content;
}
