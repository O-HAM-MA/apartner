package com.ohammer.apartner.domain.chat.service;

import com.ohammer.apartner.domain.chat.entity.Chatroom;
import com.ohammer.apartner.domain.chat.entity.UserChatroomMapping;
import com.ohammer.apartner.domain.chat.enums.ChatCategory;
import com.ohammer.apartner.domain.chat.repository.ChatroomRepository;
import com.ohammer.apartner.domain.chat.repository.UserChatroomMappingRepository;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.exception.BadRequestException;
import com.ohammer.apartner.global.exception.ForbiddenAccessException;
import com.ohammer.apartner.global.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.ohammer.apartner.domain.chat.entity.Message;
import com.ohammer.apartner.domain.chat.repository.MessageRepository;
import com.ohammer.apartner.domain.chat.dto.ChatroomDto;
import com.ohammer.apartner.domain.chat.dto.ChatMessageDto;
import com.ohammer.apartner.domain.chat.exception.ChatException;
import com.ohammer.apartner.domain.user.repository.UserRepository;
import com.ohammer.apartner.security.utils.SecurityUtil;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import com.ohammer.apartner.domain.user.entity.Role;

@Slf4j
@RequiredArgsConstructor
@Service
public class ChatService {

private final ChatroomRepository chatroomRepository;
private final UserChatroomMappingRepository userChatroomMappingRepository;
private final MessageRepository messageRepository;
private final UserRepository userRepository;
private final SecurityUtil securityUtil;
private final SimpMessagingTemplate simpMessagingTemplate;

// 채팅방 생성
@Transactional
public ChatroomDto createChatRoom(User user, String title, String categoryCode, Long apartmentId, Long prevRoomId){
    if(title == null || title.trim().isEmpty()) {
        throw new BadRequestException("채팅방 제목은 비워둘 수 없습니다.");
    }
    
    if(categoryCode == null || categoryCode.trim().isEmpty()) {
        throw new BadRequestException("카테고리 코드는 비워둘 수 없습니다.");
    }
    
    if(apartmentId == null) {
        throw new BadRequestException("아파트 ID는 비워둘 수 없습니다.");
    }

    if (prevRoomId != null) {
        log.info("이전 채팅방 ID가 있습니다: {}", prevRoomId);
        
        Chatroom prevChatroom = chatroomRepository.findById(prevRoomId)
                .orElse(null);
        
        if (prevChatroom != null && prevChatroom.getStatus() == Chatroom.Status.INACTIVE) {
            log.info("이전 채팅방({})은 INACTIVE 상태입니다. 새 채팅방을 생성합니다.", prevRoomId);
        } else if (prevChatroom != null && prevChatroom.getStatus() == Chatroom.Status.ACTIVE) {
            log.info("이전 채팅방({})은 ACTIVE 상태입니다. 기존 채팅방을 반환합니다.", prevRoomId);
            return createChatroomDto(prevChatroom);
        }
    } else {
        List<UserChatroomMapping> userChatroomMappings = userChatroomMappingRepository.findAllByUserId(user.getId());
        for (UserChatroomMapping mapping : userChatroomMappings) {
            Chatroom existingChatroom = mapping.getChatroom();
            boolean isSameCategory = false;
            
            if (existingChatroom.getCategoryCode() != null) {
                isSameCategory = categoryCode.equals(existingChatroom.getCategoryCode());
            }
            
            if (isSameCategory && 
                existingChatroom.getApartmentId() != null && 
                existingChatroom.getApartmentId().equals(apartmentId)) {
                
                if (existingChatroom.getStatus() == Chatroom.Status.ACTIVE) {
                    log.info("이미 존재하는 ACTIVE 채팅방 반환: {}", existingChatroom.getId());
                    return createChatroomDto(existingChatroom);
                } else {
                    log.info("이미 존재하지만 INACTIVE 상태인 채팅방이 있습니다. 새로운 채팅방을 생성합니다.");
                    break;
                }
            }
        }
    }

    Chatroom chatroom = Chatroom.builder()
            .title(title)
            .categoryCode(categoryCode)
            .apartmentId(apartmentId)
            .status(Chatroom.Status.ACTIVE)
            .createdAt(LocalDateTime.now())
            .build();

    chatroom = chatroomRepository.save(chatroom);

    UserChatroomMapping userChatroomMapping = chatroom.addUser(user);
    userChatroomMapping.updateLastCheckAt(LocalDateTime.now());

    userChatroomMapping = userChatroomMappingRepository.save(userChatroomMapping);

    return createChatroomDto(chatroom);
}

private ChatroomDto createChatroomDto(Chatroom chatroom) {
    return new ChatroomDto(
        chatroom.getId(),
        chatroom.getTitle(),
        chatroom.getCategoryCode(),
        chatroom.getApartmentId(),
        chatroom.getHasNewMessage(),
        null,
        chatroom.getCreatedAt(),
        chatroom.getStatus().name()
    );
}

@Transactional
public Boolean joinChatroom(User user, Long newChatroomId, Long currentChatroomId){
    if (user == null) {
        throw new BadRequestException("인증된 사용자만 채팅방에 참여할 수 있습니다.");
    }

    if(currentChatroomId != null){ 
        updateUserCheckedAt(user, currentChatroomId); 
    }

    if(userChatroomMappingRepository.existsByUserIdAndChatroomId(user.getId(), newChatroomId)){
        log.info("이미 참여한 채팅방입니다.");
        throw new BadRequestException("이미 참여한 채팅방입니다.");
    }

    Chatroom chatroom = chatroomRepository.findById(newChatroomId)
            .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 채팅방입니다. ID: " + newChatroomId));
    
    if (Chatroom.Status.INACTIVE.equals(chatroom.getStatus())) {
        log.warn("비활성화된 채팅방({})에 참여 시도. 사용자: {}", newChatroomId, user.getId());
        throw new ForbiddenAccessException("비활성화된 채팅방에는 참여할 수 없습니다.");
    }

    UserChatroomMapping userChatroomMapping = UserChatroomMapping.builder()
            .user(user)
            .chatroom(chatroom)
            .build();
    
    userChatroomMapping.updateLastCheckAt(LocalDateTime.now());
    
    userChatroomMapping = userChatroomMappingRepository.save(userChatroomMapping);

    return true;
}

private void updateUserCheckedAt(User user, Long currentChatroomId){
    UserChatroomMapping userChatroomMapping = userChatroomMappingRepository
            .findByUserIdAndChatroomId(user.getId(), currentChatroomId)
            .orElseThrow(() -> new ResourceNotFoundException("사용자가 참여하지 않은 채팅방입니다. ID: " + currentChatroomId));
    
    userChatroomMapping.updateLastCheckAt(LocalDateTime.now());
    userChatroomMappingRepository.save(userChatroomMapping);
}

@Transactional
public Boolean leaveChatroom(User user, Long chatroomId){
    if (user == null) {
        throw new BadRequestException("인증된 사용자만 채팅방에서 나갈 수 있습니다.");
    }

    if(!userChatroomMappingRepository.existsByUserIdAndChatroomId(user.getId(), chatroomId)){
        log.info("참여하지 않는 방입니다");
        throw new BadRequestException("참여하지 않은 채팅방은 나갈 수 없습니다.");
    }

    Chatroom chatroom = chatroomRepository.findById(chatroomId)
            .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 채팅방입니다. ID: " + chatroomId));
    chatroom.setStatus(Chatroom.Status.INACTIVE);
    chatroomRepository.save(chatroom);

    return true;
}

@Transactional
public List<ChatroomDto> getChatroomList(User user){
    if (user == null) {
        throw new BadRequestException("인증된 사용자만 채팅방 목록을 조회할 수 있습니다.");
    }

    List<UserChatroomMapping> userChatroomMappingList = userChatroomMappingRepository.findAllByUserId(user.getId());

    return userChatroomMappingList.stream()
        .map(userChatroomMapping -> {
            Chatroom chatroom = userChatroomMapping.getChatroom();
            LocalDateTime lastCheckTime = userChatroomMapping.getLastCheckAt();
            if (lastCheckTime == null) {
                chatroom.setHasNewMessage(true);
            } else {
                chatroom.setHasNewMessage(
                    messageRepository.existsByChatroomIdAndCreatedAtAfter(
                        chatroom.getId(), lastCheckTime));
            }
            
            return createChatroomDto(chatroom);
        })
        .collect(Collectors.toList());
}

@Transactional
public Message saveMessage(User user, Long chatroomId, String content){
    return saveMessage(user, chatroomId, content, null); 
}

@Transactional
public Message saveMessage(User user, Long chatroomId, String content, String clientId){
    if (user == null) {
        throw new BadRequestException("인증된 사용자만 메시지를 보낼 수 있습니다.");
    }

    if (content == null || content.trim().isEmpty()) {
        throw new BadRequestException("메시지 내용은 비워둘 수 없습니다.");
    }

    Chatroom chatroom = chatroomRepository.findById(chatroomId)
            .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 채팅방입니다. ID: " + chatroomId));
    
    if (Chatroom.Status.INACTIVE.equals(chatroom.getStatus())) {
        throw new ForbiddenAccessException("비활성화된 채팅방입니다. 메시지를 보낼 수 없습니다.");
    }
    
    if(!userChatroomMappingRepository.existsByUserIdAndChatroomId(user.getId(), chatroomId)){
        throw new ForbiddenAccessException("채팅방에 참여하지 않은 사용자는 메시지를 보낼 수 없습니다.");
    }

    Message message = Message.builder()
            .user(user)
            .chatroom(chatroom)
            .content(content)
            .clientId(clientId)
            .build();

    return messageRepository.save(message);
}

@Transactional(readOnly = true)
public List<ChatMessageDto> getMessageList(Long chatroomId){
    if (!chatroomRepository.existsById(chatroomId)) {
        throw new ResourceNotFoundException("존재하지 않는 채팅방입니다. ID: " + chatroomId);
    }
    
    List<Message> messages = messageRepository.findAllByChatroomIdOrderByCreatedAtAsc(chatroomId);
    return messages.stream()
        .map(ChatMessageDto::from)
        .toList();
}

@Transactional(readOnly = true)
public List<ChatroomDto> getAllChatrooms() {
    User currentUser = securityUtil.getCurrentUser();
    if (currentUser == null) {
        throw new BadRequestException("인증된 사용자만 채팅방 목록을 조회할 수 있습니다.");
    }

    List<UserChatroomMapping> userChatroomMappingList = userChatroomMappingRepository.findAllByUserId(currentUser.getId());

    return userChatroomMappingList.stream()
        .map(userChatroomMapping -> {
            Chatroom chatroom = userChatroomMapping.getChatroom();
            LocalDateTime lastCheckTime = userChatroomMapping.getLastCheckAt();
            if (lastCheckTime == null) {
                chatroom.setHasNewMessage(true);
            } else {
                chatroom.setHasNewMessage(
                    messageRepository.existsByChatroomIdAndCreatedAtAfter(
                        chatroom.getId(), lastCheckTime));
            }
            return createChatroomDto(chatroom);
        })
        .collect(Collectors.toList());
}

@Transactional(readOnly = true)
public ChatroomDto getChatroomById(Long chatroomId){
    Chatroom chatroom = chatroomRepository.findById(chatroomId)
            .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 채팅방입니다. ID: " + chatroomId));
    
    User currentUser = securityUtil.getCurrentUser();
    if (currentUser != null) {
        UserChatroomMapping mapping = userChatroomMappingRepository
                .findByUserIdAndChatroomId(currentUser.getId(), chatroomId)
                .orElse(null);
        
        if (mapping != null) {
            LocalDateTime lastCheckTime = mapping.getLastCheckAt();
            if (lastCheckTime == null) {
                chatroom.setHasNewMessage(true);
            } else {
                chatroom.setHasNewMessage(
                    messageRepository.existsByChatroomIdAndCreatedAtAfter(
                        chatroomId, lastCheckTime));
            }
        } else {
            chatroom.setHasNewMessage(false);
        }
    } else {
        chatroom.setHasNewMessage(false);
    }
    
    return createChatroomDto(chatroom);
}

@Transactional(readOnly = true)
public boolean isUserInChatroom(Long userId, Long chatroomId) {
    if (userId == null || chatroomId == null) {
        return false;
    }
    return userChatroomMappingRepository.existsByUserIdAndChatroomId(userId, chatroomId);
}

@Transactional(readOnly = true)
public boolean isChatroomActive(Long chatroomId) {
    Chatroom chatroom = chatroomRepository.findById(chatroomId)
            .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 채팅방입니다. ID: " + chatroomId));
    
    return Chatroom.Status.ACTIVE.equals(chatroom.getStatus());
}

public ChatMessageDto handleChatMessage(Map<String, String> payload, Long chatroomId) {
    try {
        User currentUser = resolveCurrentUser(payload);
        
        String messageContent = validateAndGetMessage(payload);
        
        if (!isChatroomActive(chatroomId)) {
            throw new ChatException("비활성화된 채팅방입니다. 메시지를 보낼 수 없습니다.");
        }
        
        ensureUserInChatroom(currentUser, chatroomId);
        
        String clientId = payload.get("clientId");
        
        return processAndSendMessage(currentUser, chatroomId, messageContent, clientId);
    } catch (ChatException e) {
        log.error("메시지 처리 오류: {}", e.getMessage());
        return createErrorMessageDto(e.getMessage());
    } catch (Exception e) {
        log.error("예상치 못한 오류 발생: {}", e.getMessage(), e);
        return createErrorMessageDto("메시지 처리 중 오류가 발생했습니다.");
    }
}

private User resolveCurrentUser(Map<String, String> payload) {
    User currentUser = securityUtil.getCurrentUser();
    
    if (currentUser != null) {
        return currentUser;
    }
    
    Long userId = getUserIdFromPayload(payload);
    return userRepository.findById(userId)
            .orElseThrow(() -> new ChatException("사용자를 찾을 수 없습니다: " + userId));
}

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

private String validateAndGetMessage(Map<String, String> payload) {
    String message = payload.get("message");
    if (message == null || message.trim().isEmpty()) {
        throw new ChatException("메시지 내용이 비어있습니다.");
    }
    return message;
}

private void ensureUserInChatroom(User user, Long chatroomId) {
    try {
        if (!isUserInChatroom(user.getId(), chatroomId)) {
            joinChatroom(user, chatroomId, null);
        }
    } catch (Exception e) {
        throw new ChatException("채팅방 참여 처리 중 오류: " + e.getMessage());
    }
}

private ChatMessageDto processAndSendMessage(User user, Long chatroomId, String messageContent, String clientId) {
    Message message = saveMessage(user, chatroomId, messageContent, clientId);
    
    notifyChatroomUpdate(chatroomId);
    
    return ChatMessageDto.from(message);
}

private void notifyChatroomUpdate(Long chatroomId) {
    ChatroomDto chatroomDto = getChatroomById(chatroomId);
    
    ChatroomDto updatedDto = new ChatroomDto(
        chatroomDto.id(),
        chatroomDto.title(),
        chatroomDto.categoryCode(),
        chatroomDto.apartmentId(),
        true,
        chatroomDto.userCount(),
        chatroomDto.createdAt(),
        chatroomDto.status()
    );
    
    log.info("채팅방 업데이트 알림 전송: 채팅방 ID={}, hasNewMessage=true", chatroomId);
    simpMessagingTemplate.convertAndSend("/sub/chats/updates", updatedDto);
}

private ChatMessageDto createErrorMessageDto(String errorMessage) {
    return new ChatMessageDto(
            0L, 
            errorMessage, 
            "시스템", 
            null, 
            null, 
            null, 
            null, 
            java.time.LocalDateTime.now().toString(), 
            0L,
            null // clientId 필드 추가
    );
}

public boolean isAdminOrManager(User user) {
    if (user == null) {
        return false;
    }
    return user.getRoles().contains(Role.ADMIN) || user.getRoles().contains(Role.MANAGER);
}

@Transactional
public Boolean closeChatroom(User user, Long chatroomId, String closeMessage) {
    Chatroom chatroom = chatroomRepository.findById(chatroomId)
            .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 채팅방입니다. ID: " + chatroomId));
    
    if (!isAdminOrManager(user)) {
        throw new ForbiddenAccessException("관리자 권한이 필요합니다.");
    }
    
    if (user.getRoles().contains(Role.MANAGER) && !user.getRoles().contains(Role.ADMIN)) {
        if (user.getApartment() == null || !user.getApartment().getId().equals(chatroom.getApartmentId())) {
            throw new ForbiddenAccessException("다른 아파트의 채팅방에 접근할 수 없습니다.");
        }
    }
    
    chatroom.setStatus(Chatroom.Status.INACTIVE);
    chatroomRepository.save(chatroom);

    if (closeMessage != null && !closeMessage.trim().isEmpty()) {
        Message systemMessage = Message.builder()
                .chatroom(chatroom)
                .user(user)
                .content(closeMessage)
                .build();
        messageRepository.save(systemMessage);
    }
    
    return true;
}

@Transactional
public Boolean markMessagesAsRead(User user, Long chatroomId) {
    Chatroom chatroom = chatroomRepository.findById(chatroomId)
            .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 채팅방입니다. ID: " + chatroomId));
    
    if (!isAdminOrManager(user)) {
        throw new ForbiddenAccessException("관리자 권한이 필요합니다.");
    }
    
    if (user.getRoles().contains(Role.MANAGER) && !user.getRoles().contains(Role.ADMIN)) {
        if (user.getApartment() == null || !user.getApartment().getId().equals(chatroom.getApartmentId())) {
            throw new ForbiddenAccessException("다른 아파트의 채팅방에 접근할 수 없습니다.");
        }
    }
    
    UserChatroomMapping mapping = userChatroomMappingRepository.findByUserIdAndChatroomId(user.getId(), chatroomId)
            .orElse(null);
    
    if (mapping == null) {
        mapping = UserChatroomMapping.builder()
                .user(user)
                .chatroom(chatroom)
                .build();
    }
    
    mapping.updateLastCheckAt(LocalDateTime.now());
    userChatroomMappingRepository.save(mapping);
    
    return true;
}

@Transactional
public Boolean markMessagesAsReadUser(User user, Long chatroomId) {
    Chatroom chatroom = chatroomRepository.findById(chatroomId)
            .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 채팅방입니다. ID: " + chatroomId));

    if (!isUserInChatroom(user.getId(), chatroomId)) {
        throw new ForbiddenAccessException("채팅방에 참여하지 않은 사용자는 메시지를 읽을 수 없습니다.");
    }
    
    UserChatroomMapping mapping = userChatroomMappingRepository.findByUserIdAndChatroomId(user.getId(), chatroomId)
            .orElse(null);
    
    if (mapping == null) {
        mapping = UserChatroomMapping.builder()
                .user(user)
                .chatroom(chatroom)
                .build();
    }
    
    mapping.updateLastCheckAt(LocalDateTime.now());
    userChatroomMappingRepository.save(mapping);
    
    return true;
}

@Transactional
public Boolean assignAdmin(Long chatroomId, Long adminId) {
    Chatroom chatroom = chatroomRepository.findById(chatroomId)
            .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 채팅방입니다. ID: " + chatroomId));
    
    User admin = userRepository.findById(adminId)
            .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 사용자입니다. ID: " + adminId));
    
    if (!isAdminOrManager(admin)) {
        throw new BadRequestException("관리자 또는 매니저만 담당자로 지정할 수 있습니다.");
    }
    
    if (admin.getRoles().contains(Role.MANAGER) && !admin.getRoles().contains(Role.ADMIN)) {
        if (admin.getApartment() == null || !admin.getApartment().getId().equals(chatroom.getApartmentId())) {
            throw new BadRequestException("다른 아파트의 채팅방에 담당자로 지정할 수 없습니다.");
        }
    }
    
    UserChatroomMapping mapping = userChatroomMappingRepository.findByUserIdAndChatroomId(adminId, chatroomId)
            .orElse(null);
    
    if (mapping == null) {
        mapping = UserChatroomMapping.builder()
                .user(admin)
                .chatroom(chatroom)
                .build();
    }
    
    mapping.updateLastCheckAt(LocalDateTime.now());
    userChatroomMappingRepository.save(mapping);
    
    Message systemMessage = Message.builder()
            .chatroom(chatroom)
            .user(admin)
            .content(admin.getUserName() + "님이 담당자로 지정되었습니다.")
            .build();
    messageRepository.save(systemMessage);
    
    return true;
}
}
