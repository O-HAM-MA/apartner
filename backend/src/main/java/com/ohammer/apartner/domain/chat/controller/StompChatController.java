package com.ohammer.apartner.domain.chat.controller;

import com.ohammer.apartner.security.utils.SecurityUtil;
import org.springframework.stereotype.Controller;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.handler.annotation.Payload;
import java.util.Map;
import com.ohammer.apartner.domain.chat.dto.ChatMessageDto;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import lombok.RequiredArgsConstructor;
import com.ohammer.apartner.domain.chat.entity.Message;
import com.ohammer.apartner.domain.chat.service.ChatService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
// STOMP 프로토콜을 이용한 채팅 메시지 송수신 컨트롤러
// 클라이언트가 채팅 메시지를 보내면, 서버가 메시지를 저장하고 구독자에게 전달한다.
@Slf4j
@RequiredArgsConstructor
@Controller
public class StompChatController { 

    private final ChatService chatService; // 채팅 메시지 저장 및 조회 서비스
    private final SimpMessagingTemplate simpMessagingTemplate; // 메시지 전송 템플릿 : 서버에서 클라이언트로 메시지를 보낼 때 사용하는 경로

    @MessageMapping("/chats/{chatroomId}") // 클라이언트에서 메시지를 보낼 때 사용하는 경로
    @SendTo("/sub/chats/{chatroomId}") // 서버에서 클라이언트로 메시지를 보낼 때 사용하는 경로
    public ChatMessageDto handleChatMessage( // 채팅 메시지 수신 및 저장, 구독자에게 전달
                                         SecurityUtil securityUtil, // 현재 인증된 사용자 정보
                                         @Payload Map<String, String> payload, // 클라이언트에서 보낸 메시지 데이터
                                         @DestinationVariable Long chatroomId // 채팅방 ID
                                         ) {
        // 인증된 사용자, 메시지, 채팅방 ID 로그 출력
        log.info("securityUtil: {}", securityUtil.getCurrentUser().getId());
        log.info("payload: {}", payload);
        log.info("chatroomId: {}", chatroomId);
        
        // 메시지 db에 저장
        Message message = chatService.saveMessage(securityUtil.getCurrentUser(), chatroomId, payload.get("message"));

        simpMessagingTemplate.convertAndSend("/sub/chats/news" , chatroomId); // 새로운 메시지 알림 전송

        return new ChatMessageDto(securityUtil.getCurrentUser().getId(), payload.get("message"));
    }

}
