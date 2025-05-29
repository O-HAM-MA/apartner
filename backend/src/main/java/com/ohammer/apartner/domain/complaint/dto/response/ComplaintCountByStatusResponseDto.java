package com.ohammer.apartner.domain.complaint.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter@Builder
public class ComplaintCountByStatusResponseDto {

    private String status;
    private Long count;

}
