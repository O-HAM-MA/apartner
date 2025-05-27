package com.ohammer.apartner.security.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FindEmailRequest {
    private String userName;
    private String phoneNum;
}
