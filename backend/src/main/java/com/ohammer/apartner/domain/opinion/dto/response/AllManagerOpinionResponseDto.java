package com.ohammer.apartner.domain.opinion.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Getter@Setter@Builder
public class AllManagerOpinionResponseDto {
    private Long id;
    private String title;
    private String content;
    private String status;
    private LocalDateTime createdAt;

    // 필요시에
    private String userName;
}
