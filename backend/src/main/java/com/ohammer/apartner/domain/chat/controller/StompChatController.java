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
            log.info("========== 메시지 처리 시작 - 채팅방: {} ==========", chatroomId);
            
            // 인증 사용자 정보 확인
            User currentUser = securityUtil.getCurrentUser();
            log.info("[메시지 처리] SecurityUtil로 얻은 현재 사용자: {}", currentUser != null ? currentUser.getId() + " / " + currentUser.getUserName() : "null");

            // 페이로드 디버깅 로그 추가
            log.info("[메시지 처리] 수신한 payload 전체 내용: {}", payload);
            log.info("[메시지 처리] payload에서 userId 유무: {}", payload.containsKey("userId"));
            
            if (payload.containsKey("userId")) {
                log.info("[메시지 처리] payload의 userId 값: {}", payload.get("userId"));
                try {
                    Long payloadUserId = Long.parseLong(payload.get("userId"));
                    log.info("[메시지 처리] payload의 userId를 Long으로 변환: {}", payloadUserId);
                } catch (NumberFormatException e) {
                    log.error("[메시지 처리] payload의 userId를 Long으로 변환 실패: {}", payload.get("userId"));
                }
            }

            if (currentUser == null) {
                log.warn("[메시지 처리] 현재 사용자 정보가 null이므로 payload에서 userId를 추출합니다");
                Long userId = getUserIdFromPayload(payload);
                log.info("[메시지 처리] 페이로드에서 추출한 userId: {}", userId);
                
                // 사용자 조회
                currentUser = userRepository.findById(userId).orElseThrow(() -> {
                    log.error("[메시지 처리] 사용자 ID {}를 찾을 수 없습니다", userId);
                    return new RuntimeException("사용자를 찾을 수 없습니다: " + userId);
                });
                log.info("[메시지 처리] 페이로드의 userId로 찾은 사용자: {} / {}", currentUser.getId(), currentUser.getUserName());
            }
            
            log.info("[메시지 처리] 최종 사용자 ID: {}, 이름: {}", currentUser.getId(), currentUser.getUserName());
            log.info("[메시지 처리] 메시지 내용: {}", payload.get("message"));
            log.info("[메시지 처리] 채팅방 ID: {}", chatroomId);
            
            // 채팅방 참여 여부 확인 및 자동 참여 처리
            try {
                if (!chatService.isUserInChatroom(currentUser.getId(), chatroomId)) {
                    log.info("[메시지 처리] 사용자가 채팅방에 참여하지 않았으므로 자동 참여 처리를 시도합니다. 사용자 ID: {}, 채팅방 ID: {}", 
                            currentUser.getId(), chatroomId);
                    chatService.joinChatroom(currentUser, chatroomId, null);
                    log.info("[메시지 처리] 사용자의 채팅방 자동 참여 처리 완료");
                } else {
                    log.info("[메시지 처리] 사용자가 이미 채팅방에 참여 중입니다. 사용자 ID: {}, 채팅방 ID: {}", 
                            currentUser.getId(), chatroomId);
                }
            } catch (Exception e) {
                log.error("[메시지 처리] 채팅방 참여 여부 확인 또는 자동 참여 중 오류 발생: {}", e.getMessage(), e);
                // 오류가 발생해도 메시지 처리는 계속 진행
            }
            
            // 메시지 db에 저장
            Message message = chatService.saveMessage(currentUser, chatroomId, payload.get("message"));
            log.info("[메시지 처리] 메시지 DB 저장 완료, 메시지 ID: {}", message.getId());

            // 채팅방 상세 조회
            ChatroomDto chatroomDto = chatService.getChatroomById(chatroomId);
            log.info("[메시지 처리] 채팅방 정보 조회 완료: {}", chatroomDto.title());

            // 새로운 메시지 알림 전송
            simpMessagingTemplate.convertAndSend("/sub/chats/updates", chatroomDto);
            log.info("[메시지 처리] 새 메시지 알림 전송 완료");

            // 메시지 DTO 생성 및 반환
            ChatMessageDto messageDto = ChatMessageDto.from(message);
            log.info("[메시지 처리] 반환할 ChatMessageDto 생성 완료: userId={}, userName={}", 
                    messageDto.userId(), messageDto.userName());
            log.info("========== 메시지 처리 종료 ==========");
            
            return messageDto;
        } catch (Exception e) {
            log.error("[메시지 처리 오류] 메시지 처리 중 오류 발생: {}", e.getMessage(), e);
            return new ChatMessageDto(1L, "메시지 처리 중 오류가 발생했습니다.", "오류", null, null, null, null, "", 0L);
        }
    }
    
    // payload에서 안전하게 userId를 추출하는 메서드
    private Long getUserIdFromPayload(Map<String, String> payload) {
        if (!payload.containsKey("userId") || payload.get("userId") == null) {
            log.error("userId 필드가 payload에 없습니다: {}", payload);
            throw new RuntimeException("메시지에 userId가 포함되어 있지 않습니다.");
        }
        
        String userIdStr = payload.get("userId");
        if ("null".equalsIgnoreCase(userIdStr) || userIdStr.trim().isEmpty()) {
            log.error("잘못된 userId 값: {}", userIdStr);
            throw new RuntimeException("유효하지 않은 userId 값입니다: " + userIdStr);
        }
        
        try {
            return Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            log.error("userId를 숫자로 변환할 수 없습니다: {}", userIdStr);
            throw new RuntimeException("userId를 숫자로 변환할 수 없습니다: " + userIdStr);
        }
    }
}
