package com.ohammer.apartner.domain.opinion.dto.response;

import com.ohammer.apartner.global.Status;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Builder
@Getter
@Setter
public class UpdateOpinionStatsResponseDto {

    private Long opinionId;
    private String opinionTitle;
    private String content;
    private Status state;

}
