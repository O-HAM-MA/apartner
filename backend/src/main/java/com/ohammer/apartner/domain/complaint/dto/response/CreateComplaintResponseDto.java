package com.ohammer.apartner.domain.complaint.dto.response;

import com.ohammer.apartner.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter@Setter@Builder
public class CreateComplaintResponseDto {

    private Long id;
    private Long userId;
    private String title;
    private String content;
    private String category;
    private LocalDateTime createdAt;


}
