package com.ohammer.apartner.domain.community.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserBasicDto {

    private Long id;
    private String username;
    //private String email;
}
