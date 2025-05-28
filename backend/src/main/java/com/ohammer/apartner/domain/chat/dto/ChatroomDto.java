package com.ohammer.apartner.domain.chat.dto;

import java.time.LocalDateTime;


public record ChatroomDto(
    Long id,
    String title,
    String category,
    Long apartmentId,
    Boolean hasNewMessage,
    Integer userCount,
    LocalDateTime createdAt,
    String status
) {

}
