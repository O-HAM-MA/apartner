package com.ohammer.apartner.domain.opinion.dto.request;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter@Setter@Builder
public class CreateOpinionReplyRequestDto {

    private String reply;
}
