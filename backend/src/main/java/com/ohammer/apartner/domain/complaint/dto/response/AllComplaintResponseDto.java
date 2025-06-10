package com.ohammer.apartner.domain.complaint.dto.response;

import com.ohammer.apartner.domain.user.entity.Role;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;

@NoArgsConstructor
@AllArgsConstructor
@Getter@Setter@Builder
public class AllComplaintResponseDto {
    private Long id;
    private String title;
    private String category;
    private String complaintStatus;
    private String status;
    private String userName;
    private String content;
    private String userRole;
    private LocalDateTime createdAt;
}
