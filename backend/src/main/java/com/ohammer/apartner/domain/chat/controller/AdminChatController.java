package com.ohammer.apartner.domain.chat.controller;

import com.ohammer.apartner.domain.chat.dto.ChatMessageDto;
import com.ohammer.apartner.domain.chat.dto.ChatroomDto;
import com.ohammer.apartner.domain.chat.enums.ChatCategory;
import com.ohammer.apartner.domain.chat.service.ChatService;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.user.entity.Role;
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
@RequestMapping("/api/v1/admin")
public class AdminChatController {

    private final ChatService chatService;
    private final ApartmentService apartmentService;
    private final SecurityUtil securityUtil;


    @GetMapping("/chats")
    public ResponseEntity<ApiResponse<List<ChatroomDto>>> getAdminChatroomList(
            @RequestParam(name = "apartmentId", required = false) Long requestedApartmentId,
            @RequestParam(name = "categoryCode", required = false) String categoryCode,
            @RequestParam(name = "status", required = false) String status) {
        User currentUser = securityUtil.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(HttpStatus.UNAUTHORIZED, "인증 정보가 유효하지 않습니다."));
        }
        
        if (!chatService.isAdminOrManager(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN, "관리자 권한이 필요합니다."));
        }
        
        try {
            List<ChatroomDto> chatrooms = chatService.getAllChatrooms();
            Long apartmentIdFilter = requestedApartmentId;
            
            if (currentUser.getRoles().contains(Role.MANAGER) && !currentUser.getRoles().contains(Role.ADMIN)) {
                if (currentUser.getApartment() != null) {
                    final Long managerApartmentId = currentUser.getApartment().getId();
                    chatrooms = chatrooms.stream()
                        .filter(chatroom -> managerApartmentId.equals(chatroom.apartmentId()))
                        .collect(Collectors.toList());
                    
                    apartmentIdFilter = null;
                }
            }
            
            final Long finalApartmentId = apartmentIdFilter;
            if (finalApartmentId != null) {
                chatrooms = chatrooms.stream()
                    .filter(chatroom -> finalApartmentId.equals(chatroom.apartmentId()))
                    .collect(Collectors.toList());
            }
            
            if (categoryCode != null && !categoryCode.isEmpty()) {
                chatrooms = chatrooms.stream()
                    .filter(chatroom -> categoryCode.equals(chatroom.categoryCode()))
                    .collect(Collectors.toList());
            }
            
            if (status != null && !status.isEmpty()) {
                chatrooms = chatrooms.stream()
                    .filter(chatroom -> status.equals(chatroom.status()))
                    .collect(Collectors.toList());
            }
            
            return ResponseEntity.ok(ApiResponse.success(chatrooms, "관리자용 채팅방 목록을 성공적으로 조회했습니다."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR, "채팅방 목록 조회 중 오류가 발생했습니다."));
        }
    }

    @GetMapping("/chats/{chatroomId}")
    public ResponseEntity<ApiResponse<ChatroomDto>> getAdminChatroomById(
            @PathVariable(name = "chatroomId") Long chatroomId) {
        User currentUser = securityUtil.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(HttpStatus.UNAUTHORIZED, "인증 정보가 유효하지 않습니다."));
        }
        
        if (!chatService.isAdminOrManager(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN, "관리자 권한이 필요합니다."));
        }
        
        try {
            ChatroomDto chatroomDto = chatService.getChatroomById(chatroomId);
            
            if (currentUser.getRoles().contains(Role.MANAGER) && !currentUser.getRoles().contains(Role.ADMIN)) {
                if (currentUser.getApartment() == null || 
                    !currentUser.getApartment().getId().equals(chatroomDto.apartmentId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(ApiResponse.error(HttpStatus.FORBIDDEN, "다른 아파트의 채팅방에 접근할 수 없습니다."));
                }
            }
            
            return ResponseEntity.ok(ApiResponse.success(chatroomDto, "채팅방 정보를 성공적으로 조회했습니다."));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR, "채팅방 정보 조회 중 오류가 발생했습니다."));
        }
    }

    @GetMapping("/chats/{chatroomId}/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> getAdminChatMessages(
            @PathVariable(name = "chatroomId") Long chatroomId) {
        User currentUser = securityUtil.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(HttpStatus.UNAUTHORIZED, "인증 정보가 유효하지 않습니다."));
        }
        
        if (!chatService.isAdminOrManager(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN, "관리자 권한이 필요합니다."));
        }
        
        try {
            ChatroomDto chatroomDto = chatService.getChatroomById(chatroomId);
            
            if (currentUser.getRoles().contains(Role.MANAGER) && !currentUser.getRoles().contains(Role.ADMIN)) {
                if (currentUser.getApartment() == null || 
                    !currentUser.getApartment().getId().equals(chatroomDto.apartmentId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(ApiResponse.error(HttpStatus.FORBIDDEN, "다른 아파트의 채팅방에 접근할 수 없습니다."));
                }
            }
            
            List<ChatMessageDto> messageList = chatService.getMessageList(chatroomId);
            return ResponseEntity.ok(ApiResponse.success(messageList, "채팅 메시지 목록을 성공적으로 조회했습니다."));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(HttpStatus.NOT_FOUND, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR, "채팅 메시지 조회 중 오류가 발생했습니다."));
        }
    }

    @PostMapping("/chats/{chatroomId}/close")
    public ResponseEntity<ApiResponse<Boolean>> closeChatroom(
            @PathVariable(name = "chatroomId") Long chatroomId,
            @RequestBody(required = false) Map<String, String> body) {
        User currentUser = securityUtil.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(HttpStatus.UNAUTHORIZED, "인증 정보가 유효하지 않습니다."));
        }
        
        if (!chatService.isAdminOrManager(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN, "관리자 권한이 필요합니다."));
        }
        
        String closeMessage = body != null ? body.get("message") : null;
        
        Boolean result = chatService.closeChatroom(currentUser, chatroomId, closeMessage);
        return ResponseEntity.ok(ApiResponse.success(result, "채팅방을 성공적으로 종료했습니다."));
    }

    @PostMapping("/chats/{chatroomId}/read")
    public ResponseEntity<ApiResponse<Boolean>> markMessagesAsRead(
            @PathVariable(name = "chatroomId") Long chatroomId) {
        User currentUser = securityUtil.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(HttpStatus.UNAUTHORIZED, "인증 정보가 유효하지 않습니다."));
        }

        if (!chatService.isAdminOrManager(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN, "관리자 권한이 필요합니다."));
        }
        
        Boolean result = chatService.markMessagesAsRead(currentUser, chatroomId);
        return ResponseEntity.ok(ApiResponse.success(result, "메시지를 읽음으로 표시했습니다."));
    }


    @PostMapping("/chats/{chatroomId}/assign")
    public ResponseEntity<ApiResponse<Boolean>> assignAdmin(
            @PathVariable(name = "chatroomId") Long chatroomId,
            @RequestBody Map<String, Long> body) {
        User currentUser = securityUtil.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(HttpStatus.UNAUTHORIZED, "인증 정보가 유효하지 않습니다."));
        }
        
        if (!chatService.isAdminOrManager(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN, "관리자 권한이 필요합니다."));
        }
        
        Long adminId = body.get("adminId");
        if (adminId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(HttpStatus.BAD_REQUEST, "담당자 ID가 필요합니다."));
        }
        
        Boolean result = chatService.assignAdmin(chatroomId, adminId);
        return ResponseEntity.ok(ApiResponse.success(result, "담당자가 성공적으로 지정되었습니다."));
    }


    @GetMapping("/chat/apartments")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getApartments() {
        User currentUser = SecurityUtil.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(HttpStatus.UNAUTHORIZED, "인증 정보가 유효하지 않습니다."));
        }
        
        if (!chatService.isAdminOrManager(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN, "관리자 권한이 필요합니다."));
        }
        
        try {
            List<Map<String, Object>> apartments = apartmentService.getApartmentListForAdmin(currentUser);
            return ResponseEntity.ok(ApiResponse.success(apartments, "아파트 목록을 성공적으로 조회했습니다."));
        } catch (Exception e) {
            log.error("아파트 목록 조회 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR, 
                          "아파트 목록 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }


    @GetMapping("/chat-categories")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> getChatCategories() {
        User currentUser = securityUtil.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(HttpStatus.UNAUTHORIZED, "인증 정보가 유효하지 않습니다."));
        }
        
        if (!chatService.isAdminOrManager(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error(HttpStatus.FORBIDDEN, "관리자 권한이 필요합니다."));
        }
        
        List<Map<String, String>> categories = Arrays.stream(ChatCategory.values())
            .map(category -> Map.of(
                "code", category.getCode(),
                "name", category.getDisplayName()
            ))
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.success(categories, "채팅 카테고리 목록을 성공적으로 조회했습니다."));
    }
} 