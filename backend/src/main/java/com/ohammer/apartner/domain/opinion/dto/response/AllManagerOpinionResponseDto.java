package com.ohammer.apartner.domain.opinion.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter@Setter@Builder
public class AllManagerOpinionResponseDto {
    private Long id;
    private String title;

    // 필요시에
//    private String userName;
}
