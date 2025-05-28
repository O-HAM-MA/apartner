package com.ohammer.apartner.domain.chat.controller;

import org.springframework.stereotype.Controller;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.handler.annotation.Payload;
import java.util.Map;
import com.ohammer.apartner.domain.chat.dto.ChatMessageDto;
import com.ohammer.apartner.domain.chat.exception.ChatException;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.messaging.MessageDeliveryException;
import lombok.RequiredArgsConstructor;
import com.ohammer.apartner.domain.chat.service.ChatService;

// STOMP 프로토콜을 이용한 채팅 메시지 송수신 컨트롤러
// 클라이언트가 채팅 메시지를 보내면, 서버가 메시지를 저장하고 구독자에게 전달한다.
@Slf4j
@RequiredArgsConstructor
@Controller
public class StompChatController { 

    private final ChatService chatService;

    @MessageMapping("/chats/{chatroomId}") // 클라이언트에서 메시지를 보낼 때 사용하는 경로
    @SendTo("/sub/chats/{chatroomId}") // 서버에서 클라이언트로 메시지를 보낼 때 사용하는 경로
    public ChatMessageDto handleChatMessage( // 채팅 메시지 수신 및 저장, 구독자에게 전달
                                        @Payload Map<String, String> payload, // 클라이언트에서 보낸 메시지 데이터
                                        @DestinationVariable("chatroomId") Long chatroomId,
                                        SimpMessageHeaderAccessor headerAccessor
                                        ) {
        try {
            // 채팅방 활성화 상태 확인 - INACTIVE 상태이면 거부
            if (!chatService.isChatroomActive(chatroomId)) {
                String errorMessage = "비활성화된 채팅방입니다. 메시지를 보낼 수 없습니다.";
                log.warn("STOMP 메시지 거부: chatroomId={}, 사유={}", chatroomId, errorMessage);
                
                return new ChatMessageDto(
                    0L, 
                    errorMessage,
                    "시스템",
                    null,
                    null,
                    null,
                    null,
                    java.time.LocalDateTime.now().toString(),
                    null,
                    null
                );
            }
            
            return chatService.handleChatMessage(payload, chatroomId);
        } catch (ChatException e) {
            log.error("채팅 메시지 처리 오류: {}", e.getMessage());
            
            return new ChatMessageDto(
                0L,
                e.getMessage(),
                "시스템",
                null,
                null,
                null,
                null,
                java.time.LocalDateTime.now().toString(),
                null,
                null
            );
        } catch (Exception e) {
            log.error("예상치 못한 STOMP 메시지 처리 오류: {}", e.getMessage(), e);
            
            return new ChatMessageDto(
                0L,
                "메시지 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
                "시스템",
                null,
                null,
                null,
                null,
                java.time.LocalDateTime.now().toString(),
                null,
                null
            );
        }
    }
}
