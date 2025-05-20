package com.ohammer.apartner.domain.opinion.dto.request;


import lombok.*;

@NoArgsConstructor
@AllArgsConstructor
@Getter@Setter@Builder
public class CreateManagerOpinionRequestDto {
    private String title;
    private String content;
}
