package com.ohammer.apartner.domain.opinion.dto.response;

import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter@Setter@Builder
public class AllManagerOpinionResponseDto {
    private Long id;
    private String title;

    // 필요시에
    private String userName;
}
