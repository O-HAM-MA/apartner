package com.ohammer.apartner.domain.opinion.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;


@Getter@Setter@Builder
public class CreateOpinionReplyResponseDto {

    private Long id;
    private Long userId;
    private String reply;
    private LocalDateTime createdAt;

}
