package com.ohammer.apartner.domain.community.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
@Getter
@Builder
public class CommunityResponseDto {

    private Long id;
    private String content;
    private UserBasicDto author; // null for user-facing API
    private Long parentId;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    private String status;
    private boolean pinned;
}
