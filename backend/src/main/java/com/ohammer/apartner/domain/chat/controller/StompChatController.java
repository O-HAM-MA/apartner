package com.ohammer.apartner.domain.chat.controller;

import com.ohammer.apartner.security.utils.SecurityUtil;
import org.springframework.stereotype.Controller;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.handler.annotation.Payload;
import java.util.Map;
import com.ohammer.apartner.domain.chat.dto.ChatMessageDto;
import com.ohammer.apartner.domain.chat.dto.ChatroomDto;
import com.ohammer.apartner.domain.user.entity.User;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import lombok.RequiredArgsConstructor;
import com.ohammer.apartner.domain.chat.entity.Message;
import com.ohammer.apartner.domain.chat.service.ChatService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import com.ohammer.apartner.domain.user.repository.UserRepository;
import com.ohammer.apartner.domain.chat.exception.ChatException;

// STOMP 프로토콜을 이용한 채팅 메시지 송수신 컨트롤러
// 클라이언트가 채팅 메시지를 보내면, 서버가 메시지를 저장하고 구독자에게 전달한다.
@Slf4j
@RequiredArgsConstructor
@Controller
public class StompChatController { 

    private final ChatService chatService; // 채팅 메시지 저장 및 조회 서비스
    private final SimpMessagingTemplate simpMessagingTemplate; // 메시지 전송 템플릿 : 서버에서 클라이언트로 메시지를 보낼 때 사용하는 경로
    private final UserRepository userRepository; // 임시 방편으로 사용자 ID를 직접 찾기 위해 추가
    private final SecurityUtil securityUtil; // 현재 인증된 사용자 정보

    @MessageMapping("/chats/{chatroomId}") // 클라이언트에서 메시지를 보낼 때 사용하는 경로
    @SendTo("/sub/chats/{chatroomId}") // 서버에서 클라이언트로 메시지를 보낼 때 사용하는 경로
    public ChatMessageDto handleChatMessage( // 채팅 메시지 수신 및 저장, 구독자에게 전달
                                         @Payload Map<String, String> payload, // 클라이언트에서 보낸 메시지 데이터
                                         @DestinationVariable("chatroomId") Long chatroomId // 채팅방 ID
                                         ) {
        
        try {
            // 1. 사용자 확인
            User currentUser = resolveCurrentUser(payload);
            
            // 2. 메시지 내용 확인
            String messageContent = validateAndGetMessage(payload);
            
            // 3. 채팅방 참여 확인 및 처리
            ensureUserInChatroom(currentUser, chatroomId);
            
            // 4. 메시지 저장 및 전송
            return processAndSendMessage(currentUser, chatroomId, messageContent);
        } catch (ChatException e) {
            log.error("메시지 처리 오류: {}", e.getMessage());
            return createErrorMessageDto(e.getMessage());
        } catch (Exception e) {
            log.error("예상치 못한 오류 발생: {}", e.getMessage(), e);
            return createErrorMessageDto("메시지 처리 중 오류가 발생했습니다.");
        }
    }
    
    /**
     * 현재 사용자 정보를 조회합니다. 
     * SecurityUtil에서 인증 정보가 없으면 payload의 userId로 조회합니다.
     */
    private User resolveCurrentUser(Map<String, String> payload) {
        // SecurityUtil로 현재 인증된 사용자 조회 시도
        User currentUser = securityUtil.getCurrentUser();
        
        if (currentUser != null) {
            return currentUser;
        }
        
        // 인증 정보가 없는 경우 payload에서 userId 추출하여 사용자 조회
        Long userId = getUserIdFromPayload(payload);
        return userRepository.findById(userId)
                .orElseThrow(() -> new ChatException("사용자를 찾을 수 없습니다: " + userId));
    }
    
    /**
     * payload에서 userId를 안전하게 추출합니다.
     */
    private Long getUserIdFromPayload(Map<String, String> payload) {
        if (!payload.containsKey("userId") || payload.get("userId") == null) {
            throw new ChatException("메시지에 userId가 포함되어 있지 않습니다.");
        }
        
        String userIdStr = payload.get("userId");
        if ("null".equalsIgnoreCase(userIdStr) || userIdStr.trim().isEmpty()) {
            throw new ChatException("유효하지 않은 userId 값입니다: " + userIdStr);
        }
        
        try {
            return Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            throw new ChatException("userId를 숫자로 변환할 수 없습니다: " + userIdStr);
        }
    }
    
    /**
     * payload에서 메시지 내용을 검증하고 가져옵니다.
     */
    private String validateAndGetMessage(Map<String, String> payload) {
        String message = payload.get("message");
        if (message == null || message.trim().isEmpty()) {
            throw new ChatException("메시지 내용이 비어있습니다.");
        }
        return message;
    }
    
    /**
     * 사용자가 채팅방에 참여 중인지 확인하고, 참여하지 않았다면 자동 참여시킵니다.
     */
    private void ensureUserInChatroom(User user, Long chatroomId) {
        try {
            if (!chatService.isUserInChatroom(user.getId(), chatroomId)) {
                chatService.joinChatroom(user, chatroomId, null);
            }
        } catch (Exception e) {
            throw new ChatException("채팅방 참여 처리 중 오류: " + e.getMessage());
        }
    }
    
    /**
     * 메시지를 저장하고 채팅방 업데이트 알림을 전송한 후 메시지 DTO를 반환합니다.
     */
    private ChatMessageDto processAndSendMessage(User user, Long chatroomId, String messageContent) {
        // 메시지 저장
        Message message = chatService.saveMessage(user, chatroomId, messageContent);
        
        // 채팅방 업데이트 알림 전송
        notifyChatroomUpdate(chatroomId);
        
        // 메시지 DTO 생성 및 반환
        return ChatMessageDto.from(message);
    }
    
    /**
     * 채팅방 업데이트 알림을 전송합니다.
     */
    private void notifyChatroomUpdate(Long chatroomId) {
        ChatroomDto chatroomDto = chatService.getChatroomById(chatroomId);
        simpMessagingTemplate.convertAndSend("/sub/chats/updates", chatroomDto);
    }
    
    /**
     * 오류 메시지를 담은 ChatMessageDto를 생성합니다.
     */
    private ChatMessageDto createErrorMessageDto(String errorMessage) {
        return new ChatMessageDto(
                1L, 
                errorMessage, 
                "시스템", 
                null, 
                null, 
                null, 
                null, 
                "", 
                0L
        );
    }
}
