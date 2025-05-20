package com.ohammer.apartner.domain.chat.dto;

import com.ohammer.apartner.domain.chat.entity.Message;

public record ChatMessageDto(
    Long userId,
    String message
) {
    public static ChatMessageDto from(Message message) {
        return new ChatMessageDto(
            message.getUser().getId(),
            message.getContent()
        );
    }
}
