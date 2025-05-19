package com.ohammer.apartner.domain.complaint.dto.response;


import lombok.*;

@Getter@Builder
public class TodayComplaintResponseDto {

    private String status;
    private Long count;

}
