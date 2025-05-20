package com.ohammer.apartner.domain.chat.dto;

import java.time.LocalDateTime;
import com.ohammer.apartner.domain.chat.entity.Chatroom;

public record ChatroomDto(
    Long id,
    String title,
    Boolean hasNewMessage,
    Integer userCount,
    LocalDateTime createdAt
) {

    public static ChatroomDto from(Chatroom chatroom) {
        return new ChatroomDto(
        chatroom.getId(), 
        chatroom.getTitle(),
        chatroom.getHasNewMessage(),
        chatroom.getUserChatroomMappingSet().size(),
        chatroom.getCreatedAt());
    }
}
