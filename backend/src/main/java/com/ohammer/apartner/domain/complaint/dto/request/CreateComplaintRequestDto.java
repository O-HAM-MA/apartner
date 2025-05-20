package com.ohammer.apartner.domain.complaint.dto.request;

import com.ohammer.apartner.domain.complaint.entity.Complaint;
import lombok.*;

import static com.ohammer.apartner.domain.complaint.entity.Complaint.Status.PENDING;

@NoArgsConstructor
@AllArgsConstructor
@Getter@Setter@Builder
public class CreateComplaintRequestDto {
    private String title;
    private String content;
    private String category;
}
