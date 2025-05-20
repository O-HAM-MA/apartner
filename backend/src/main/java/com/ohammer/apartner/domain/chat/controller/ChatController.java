package com.ohammer.apartner.domain.chat.controller;

import com.ohammer.apartner.domain.chat.dto.ChatMessageDto;
import com.ohammer.apartner.domain.chat.dto.ChatroomDto;
import com.ohammer.apartner.domain.chat.service.ChatService;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.dto.ApiResponse;
import com.ohammer.apartner.security.utils.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/chats")
public class ChatController {

    private final ChatService chatService;

    // 채팅방 생성
    @PostMapping
    public ResponseEntity<ApiResponse<ChatroomDto>> createChatroom(SecurityUtil securityUtil,
            @RequestParam(name = "title") String title) {
        User currentUser = securityUtil.getCurrentUser();

        ChatroomDto chatroom = chatService.createChatRoom(currentUser, title);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(chatroom, "채팅방이 성공적으로 생성되었습니다."));
    }

    // 채팅방 참여
    @PostMapping("/{chatroomId}/users")
    public ResponseEntity<ApiResponse<Boolean>> joinChatroom(SecurityUtil securityUtil,
            @PathVariable(name = "chatroomId") Long chatroomId,
            @RequestParam(name = "currentChatroomId", required = false) Long currentChatroomId) {
        User currentUser = securityUtil.getCurrentUser();
        Boolean result = chatService.joinChatroom(currentUser, chatroomId, currentChatroomId);
        return ResponseEntity.ok(ApiResponse.success(result, "채팅방에 성공적으로 참여했습니다."));
    }

    // 채팅방 나가기
    @DeleteMapping("/{chatroomId}/users")
    public ResponseEntity<ApiResponse<Boolean>> leaveChatroom(SecurityUtil securityUtil,
            @PathVariable(name = "chatroomId") Long chatroomId) {
        User currentUser = securityUtil.getCurrentUser();
        Boolean result = chatService.leaveChatroom(currentUser, chatroomId);
        return ResponseEntity.ok(ApiResponse.success(result, "채팅방에서 성공적으로 나갔습니다."));
    }

    // User가 참여한 채팅방 목록 조회     
    @GetMapping
    public ResponseEntity<ApiResponse<List<ChatroomDto>>> getChatroomList(SecurityUtil securityUtil) {
        try {
            User currentUser = securityUtil.getCurrentUser();
            List<ChatroomDto> chatroomList = chatService.getChatroomList(currentUser);
            return ResponseEntity.ok(ApiResponse.success(chatroomList, "채팅방 목록을 성공적으로 조회했습니다."));
        } catch (Exception e) {
            log.error("채팅방 목록 조회 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(HttpStatus.UNAUTHORIZED, "인증 정보가 유효하지 않습니다."));
        }
    }

    // 채팅방 메시지 조회
    @GetMapping("/{chatroomId}/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> getMessageList(
            @PathVariable(name = "chatroomId") Long chatroomId) {
        List<ChatMessageDto> messageList = chatService.getMessageList(chatroomId);
        return ResponseEntity.ok(ApiResponse.success(messageList, "채팅 메시지 목록을 성공적으로 조회했습니다."));
    }

    // 모든 채팅방 조회
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<ChatroomDto>>> getAllChatrooms() {
        List<ChatroomDto> allChatrooms = chatService.getAllChatrooms();
        return ResponseEntity.ok(ApiResponse.success(allChatrooms, "모든 채팅방 목록을 성공적으로 조회했습니다."));
    }

    // 채팅방 상세 조회
    @GetMapping("/{chatroomId}")
    public ResponseEntity<ApiResponse<ChatroomDto>> getChatroomById(
            @PathVariable(name = "chatroomId") Long chatroomId) {
        ChatroomDto chatroomDto = chatService.getChatroomById(chatroomId);
        return ResponseEntity.ok(ApiResponse.success(chatroomDto, "채팅방 정보를 성공적으로 조회했습니다."));
    }
}