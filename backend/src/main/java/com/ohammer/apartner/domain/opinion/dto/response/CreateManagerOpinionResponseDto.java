package com.ohammer.apartner.domain.opinion.dto.response;

import com.ohammer.apartner.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;


@Getter@Setter@Builder
public class CreateManagerOpinionResponseDto {

    private Long id;
    private Long userId;
    private String title;
    private String content;
    private LocalDateTime createdAt;

}
