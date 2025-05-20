package com.ohammer.apartner.domain.chat.dto;

import java.time.LocalDateTime;


public record ChatroomDto(
    Long id,
    String title,
    Boolean hasNewMessage,
    Integer userCount,
    LocalDateTime createdAt
) {

}
