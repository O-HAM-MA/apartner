package com.ohammer.apartner.domain.complaint.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import com.ohammer.apartner.global.Status;

@Getter@Setter@Builder
public class UpdateStateResponseDto {

    private Long id;
    private String title;
    private Status state;

}
