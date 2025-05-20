package com.ohammer.apartner.domain.chat.controller;

import com.ohammer.apartner.domain.chat.entity.Chatroom;
import com.ohammer.apartner.domain.chat.service.ChatService;
import com.ohammer.apartner.security.utils.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.List;
import com.ohammer.apartner.domain.chat.dto.ChatroomDto;
import com.ohammer.apartner.domain.chat.dto.ChatMessageDto;
import java.util.stream.Collectors;
@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/chats")
public class ChatController {

    private final ChatService chatService;

    // 채팅방 생성
    @PostMapping
    public ChatroomDto createChatroom(SecurityUtil securityUtil,
                                  @RequestParam(name = "title") String title) {
        return ChatroomDto.from(chatService.createChatRoom(securityUtil.getCurrentUser(), title));
    }

    // 채팅방 참여
    @PostMapping("/{chatroomId}/users")
    public Boolean joinChatroom(SecurityUtil securityUtil,
                                @PathVariable(name = "chatroomId") Long chatroomId,
                                @RequestParam(name = "currentChatroomId", required = false) Long currentChatroomId) {
        return chatService.joinChatroom(securityUtil.getCurrentUser(), chatroomId, currentChatroomId);
    }

    // 채팅방 나가기
    @DeleteMapping("/{chatroomId}/users")
    public Boolean leaveChatroom(SecurityUtil securityUtil,
                                 @PathVariable(name = "chatroomId") Long chatroomId) {
        return chatService.leaveChatroom(securityUtil.getCurrentUser(), chatroomId);
    }

    // 채팅방 목록 조회     
    @GetMapping("/{chatroomId}/users")
    public List<ChatroomDto> getChatroomList(SecurityUtil securityUtil) {
        return chatService.getChatroomList(securityUtil.getCurrentUser()).stream()
            .map(ChatroomDto::from)
            .collect(Collectors.toList());
    }

    // 채팅방 메시지 조회
    @GetMapping("/{chatroomId}/messages")
    public List<ChatMessageDto> getMessageList(SecurityUtil securityUtil,
                                          @PathVariable(name = "chatroomId") Long chatroomId) {
        return chatService.getMessageList(chatroomId).stream()
            .map(ChatMessageDto::from)
            .collect(Collectors.toList());
    }




}