package com.ohammer.apartner.domain.opinion.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter@Setter@Builder
public class OpinionReplyResponseDto {

    private Long id;
    private String userName;
    private String reply;
    private LocalDateTime createdAt;
    private String userRole;

}
