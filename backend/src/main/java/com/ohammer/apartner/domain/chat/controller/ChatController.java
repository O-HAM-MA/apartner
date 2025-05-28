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
    public ResponseEntity<ApiResponse<ChatroomDto>> createChatroom(
            @RequestParam(name = "title") String title,
            @RequestParam(name = "category") String category,
            @RequestParam(name = "apartmentId") Long apartmentId) {
        User currentUser = SecurityUtil.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(HttpStatus.UNAUTHORIZED, "인증 정보가 유효하지 않습니다."));
        }

        ChatroomDto chatroom = chatService.createChatRoom(currentUser, title, category, apartmentId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(chatroom, "채팅방이 성공적으로 생성되었습니다."));
    }

    // 채팅방 참여
    @PostMapping("/{chatroomId}/users")
    public ResponseEntity<ApiResponse<Boolean>> joinChatroom(
            @PathVariable(name = "chatroomId") Long chatroomId,
            @RequestParam(name = "currentChatroomId", required = false) Long currentChatroomId) {
        User currentUser = SecurityUtil.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(HttpStatus.UNAUTHORIZED, "인증 정보가 유효하지 않습니다."));
        }
        
        Boolean result = chatService.joinChatroom(currentUser, chatroomId, currentChatroomId);
        return ResponseEntity.ok(ApiResponse.success(result, "채팅방에 성공적으로 참여했습니다."));
    }

    // 채팅방 나가기
    @DeleteMapping("/{chatroomId}/users")
    public ResponseEntity<ApiResponse<Boolean>> leaveChatroom(
            @PathVariable(name = "chatroomId") Long chatroomId) {
        User currentUser = SecurityUtil.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(HttpStatus.UNAUTHORIZED, "인증 정보가 유효하지 않습니다."));
        }
        
        Boolean result = chatService.leaveChatroom(currentUser, chatroomId);
        return ResponseEntity.ok(ApiResponse.success(result, "채팅방에서 성공적으로 나갔습니다."));
    }

    // User가 참여한 채팅방 목록 조회     
    @GetMapping
    public ResponseEntity<ApiResponse<List<ChatroomDto>>> getChatroomList() {
        try {
            User currentUser = SecurityUtil.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error(HttpStatus.UNAUTHORIZED, "인증 정보가 유효하지 않습니다."));
            }
            
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
        // 인증 확인 없이 모든 채팅방 목록 반환
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

    // 카테고리별 채팅방 조회
    @GetMapping("/category")
    public ResponseEntity<ApiResponse<List<ChatroomDto>>> getChatroomsByCategory(
            @RequestParam(name = "category") String category,
            @RequestParam(name = "apartmentId") Long apartmentId) {
        try {
            User currentUser = SecurityUtil.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error(HttpStatus.UNAUTHORIZED, "인증 정보가 유효하지 않습니다."));
            }
            
            List<ChatroomDto> chatroomList = chatService.getChatroomList(currentUser);
            // 카테고리와 아파트ID로 필터링
            chatroomList = chatroomList.stream()
                    .filter(chatroom -> category.equals(chatroom.category()) && apartmentId.equals(chatroom.apartmentId()))
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(ApiResponse.success(chatroomList, "카테고리별 채팅방 목록을 성공적으로 조회했습니다."));
        } catch (Exception e) {
            log.error("카테고리별 채팅방 목록 조회 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR, "채팅방 목록 조회 중 오류가 발생했습니다."));
        }
    }
}