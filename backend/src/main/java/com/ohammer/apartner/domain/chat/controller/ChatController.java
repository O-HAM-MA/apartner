package com.ohammer.apartner.domain.chat.controller;

import com.ohammer.apartner.domain.chat.dto.ChatMessageDto;
import com.ohammer.apartner.domain.chat.dto.ChatroomDto;
import com.ohammer.apartner.domain.chat.enums.ChatCategory;
import com.ohammer.apartner.domain.chat.service.ChatService;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.user.entity.Role;
import com.ohammer.apartner.domain.apartment.entity.Apartment;
import com.ohammer.apartner.domain.apartment.service.ApartmentService;
import com.ohammer.apartner.global.dto.ApiResponse;
import com.ohammer.apartner.global.exception.BadRequestException;
import com.ohammer.apartner.global.exception.ForbiddenAccessException;
import com.ohammer.apartner.global.exception.ResourceNotFoundException;
import com.ohammer.apartner.security.utils.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/chats")
public class ChatController {

    private final ChatService chatService;
    private final ApartmentService apartmentService;
    private final SecurityUtil securityUtil;

    // 채팅방 생성
    @PostMapping
    public ResponseEntity<ApiResponse<ChatroomDto>> createChatroom(
            @RequestParam(name = "title") String title,
            @RequestParam(name = "categoryCode", required = false) String categoryCode,
            @RequestParam(name = "apartmentId", required = false) Long apartmentId,
            @RequestParam(name = "prevRoomId", required = false) Long prevRoomId) {
        User currentUser = securityUtil.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(HttpStatus.UNAUTHORIZED, "인증 정보가 유효하지 않습니다."));
        }

        log.info("채팅방 생성 요청: title={}, categoryCode={}, apartmentId={}, prevRoomId={}", 
            title, categoryCode, apartmentId, prevRoomId);

        if (categoryCode == null || categoryCode.isEmpty()) {
            categoryCode = ChatCategory.COMPLAINT.getCode(); 
        }
        
        if (apartmentId == null) {
            apartmentId = currentUser.getApartment() != null ? currentUser.getApartment().getId() : 1L;
        }
        
        try {
            ChatroomDto chatroom = chatService.createChatRoom(currentUser, title, categoryCode, apartmentId, prevRoomId);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(chatroom, "채팅방이 성공적으로 생성되었습니다."));
        } catch (BadRequestException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(HttpStatus.BAD_REQUEST, e.getMessage()));
        } catch (Exception e) {
            log.error("채팅방 생성 중 오류 발생", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR, "채팅방 생성 중 오류가 발생했습니다."));
        }
    }

    // 채팅방 참여
    @PostMapping("/{chatroomId}/users")
    public ResponseEntity<ApiResponse<Boolean>> joinChatroom(
            @PathVariable(name = "chatroomId") Long chatroomId,
            @RequestParam(name = "currentChatroomId", required = false) Long currentChatroomId) {
        User currentUser = securityUtil.getCurrentUser();
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
        User currentUser = securityUtil.getCurrentUser();
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
            User currentUser = securityUtil.getCurrentUser();
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

    // 현재 사용자의 채팅방 목록만 조회
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<ChatroomDto>>> getMyChatrooms() {
        User currentUser = securityUtil.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(HttpStatus.UNAUTHORIZED, "인증 정보가 유효하지 않습니다."));
        }
        
        List<ChatroomDto> myChatrooms = chatService.getChatroomList(currentUser);
        return ResponseEntity.ok(ApiResponse.success(myChatrooms, "내 채팅방 목록을 성공적으로 조회했습니다."));
    }

    // 채팅방 상세 조회
    @GetMapping("/{chatroomId}")
    public ResponseEntity<ApiResponse<ChatroomDto>> getChatroomById(
            @PathVariable(name = "chatroomId") Long chatroomId) {
        ChatroomDto chatroomDto = chatService.getChatroomById(chatroomId);
        return ResponseEntity.ok(ApiResponse.success(chatroomDto, "채팅방 정보를 성공적으로 조회했습니다."));
    }

    // 카테고리코드별 채팅방 조회
    @GetMapping("/filter")
    public ResponseEntity<ApiResponse<List<ChatroomDto>>> getChatroomsByFilter(
            @RequestParam(name = "categoryCode", required = false) String categoryCode,
            @RequestParam(name = "apartmentId", required = false) Long apartmentId,
            @RequestParam(name = "status", required = false) String status) {
        
        List<ChatroomDto> chatrooms = chatService.getAllChatrooms();
        
        // 필터링 적용
        if (categoryCode != null && !categoryCode.isEmpty()) {
            chatrooms = chatrooms.stream()
                .filter(chatroom -> categoryCode.equals(chatroom.categoryCode()))
                .collect(Collectors.toList());
        }
        
        if (apartmentId != null) {
            chatrooms = chatrooms.stream()
                .filter(chatroom -> apartmentId.equals(chatroom.apartmentId()))
                .collect(Collectors.toList());
        }
        
        if (status != null && !status.isEmpty()) {
            chatrooms = chatrooms.stream()
                .filter(chatroom -> status.equals(chatroom.status()))
                .collect(Collectors.toList());
        }
        
        return ResponseEntity.ok(ApiResponse.success(chatrooms, "필터링된 채팅방 목록을 성공적으로 조회했습니다."));
    }
}