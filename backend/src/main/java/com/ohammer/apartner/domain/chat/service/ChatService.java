package com.ohammer.apartner.domain.chat.service;

import com.ohammer.apartner.domain.chat.entity.Chatroom;
import com.ohammer.apartner.domain.chat.entity.UserChatroomMapping;
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
import com.ohammer.apartner.domain.chat.entity.Message;
import com.ohammer.apartner.domain.chat.repository.MessageRepository;
import com.ohammer.apartner.domain.chat.dto.ChatroomDto;
import com.ohammer.apartner.domain.chat.dto.ChatMessageDto;
import com.ohammer.apartner.domain.chat.exception.ChatException;
import com.ohammer.apartner.domain.user.repository.UserRepository;
import com.ohammer.apartner.security.utils.SecurityUtil;
import org.springframework.messaging.simp.SimpMessagingTemplate;

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
public ChatroomDto createChatRoom(User user, String title, String category, Long apartmentId){
    if(title == null || title.trim().isEmpty()) {
        throw new BadRequestException("채팅방 제목은 비워둘 수 없습니다.");
    }
    
    if(category == null || category.trim().isEmpty()) {
        throw new BadRequestException("카테고리는 비워둘 수 없습니다.");
    }
    
    if(apartmentId == null) {
        throw new BadRequestException("아파트 ID는 비워둘 수 없습니다.");
    }

    // 이미 존재하는 같은 카테고리의 채팅방이 있는지 확인
    List<UserChatroomMapping> userChatroomMappings = userChatroomMappingRepository.findAllByUserId(user.getId());
    for (UserChatroomMapping mapping : userChatroomMappings) {
        Chatroom existingChatroom = mapping.getChatroom();
        if (existingChatroom.getCategory() != null && 
            existingChatroom.getCategory().equals(category) && 
            existingChatroom.getApartmentId() != null && 
            existingChatroom.getApartmentId().equals(apartmentId)) {
            
            // 이미 존재하는 채팅방 반환
            return new ChatroomDto(
                existingChatroom.getId(),
                existingChatroom.getTitle(),
                existingChatroom.getCategory(),
                existingChatroom.getApartmentId(),
                existingChatroom.getHasNewMessage(),
                null,
                existingChatroom.getCreatedAt(),
                existingChatroom.getStatus().name()
            );
        }
    }

    Chatroom chatroom = Chatroom.builder()
            .title(title)
            .category(category)
            .apartmentId(apartmentId)
            .status(Chatroom.Status.ACTIVE)
            .createdAt(LocalDateTime.now())
            .build();

    chatroom = chatroomRepository.save(chatroom);

    UserChatroomMapping userChatroomMapping = chatroom.addUser(user);
    userChatroomMapping.updateLastCheckAt(LocalDateTime.now());

    userChatroomMapping = userChatroomMappingRepository.save(userChatroomMapping);

    return new ChatroomDto(
        chatroom.getId(),
        chatroom.getTitle(),
        chatroom.getCategory(),
        chatroom.getApartmentId(),
        chatroom.getHasNewMessage(),
        null,
        chatroom.getCreatedAt(),
        chatroom.getStatus().name()
    );
}


// 채팅방 참여
@Transactional
public Boolean joinChatroom(User user, Long newChatroomId, Long currentChatroomId){
    if (user == null) {
        throw new BadRequestException("인증된 사용자만 채팅방에 참여할 수 있습니다.");
    }

    if(currentChatroomId != null){ // 현재 참여한 채팅방이 있으면 조회 시간 업데이트
        updateUserCheckedAt(user, currentChatroomId); 
    }

    if(userChatroomMappingRepository.existsByUserIdAndChatroomId(user.getId(), newChatroomId)){
        log.info("이미 참여한 채팅방입니다.");
        throw new BadRequestException("이미 참여한 채팅방입니다.");
    }

    Chatroom chatroom = chatroomRepository.findById(newChatroomId)
            .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 채팅방입니다. ID: " + newChatroomId));

    UserChatroomMapping userChatroomMapping = UserChatroomMapping.builder()
            .user(user)
            .chatroom(chatroom)
            .build();
    
    userChatroomMapping.updateLastCheckAt(LocalDateTime.now());
    
    userChatroomMapping = userChatroomMappingRepository.save(userChatroomMapping);

    return true;
}

// 채팅방 조회 시간 업데이트
private void updateUserCheckedAt(User user, Long currentChatroomId){
    UserChatroomMapping userChatroomMapping = userChatroomMappingRepository
            .findByUserIdAndChatroomId(user.getId(), currentChatroomId)
            .orElseThrow(() -> new ResourceNotFoundException("사용자가 참여하지 않은 채팅방입니다. ID: " + currentChatroomId));
    
    userChatroomMapping.updateLastCheckAt(LocalDateTime.now());
    userChatroomMappingRepository.save(userChatroomMapping);
}

// 채팅방 나가기
@Transactional
public Boolean leaveChatroom(User user, Long chatroomId){
    if (user == null) {
        throw new BadRequestException("인증된 사용자만 채팅방에서 나갈 수 있습니다.");
    }

    if(!userChatroomMappingRepository.existsByUserIdAndChatroomId(user.getId(), chatroomId)){
        log.info("참여하지 않는 방입니다");
        throw new BadRequestException("참여하지 않은 채팅방은 나갈 수 없습니다.");
    }

    userChatroomMappingRepository.deleteByUserIdAndChatroomId(user.getId(), chatroomId);

    // 채팅방 상태를 INACTIVE로 변경
    Chatroom chatroom = chatroomRepository.findById(chatroomId)
            .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 채팅방입니다. ID: " + chatroomId));
    chatroom.setStatus(Chatroom.Status.INACTIVE);
    chatroomRepository.save(chatroom);

    return true;
}

// 사용자가 참여한 채팅방 목록
@Transactional
public List<ChatroomDto> getChatroomList(User user){
    if (user == null) {
        throw new BadRequestException("인증된 사용자만 채팅방 목록을 조회할 수 있습니다.");
    }

    List<UserChatroomMapping> userChatroomMappingList = userChatroomMappingRepository.findAllByUserId(user.getId());

    return userChatroomMappingList.stream()
        .map(userChatroomMapping ->
        {
            Chatroom chatroom = userChatroomMapping.getChatroom();
            LocalDateTime lastCheckTime = userChatroomMapping.getLastCheckAt();
            if (lastCheckTime == null) {
                chatroom.setHasNewMessage(true);
            } else {
                chatroom.setHasNewMessage(
                    messageRepository.existsByChatroomIdAndCreatedAtAfter(
                        chatroom.getId(), lastCheckTime));
            }
            
            return new ChatroomDto(
                chatroom.getId(),
                chatroom.getTitle(),
                chatroom.getCategory(),
                chatroom.getApartmentId(),
                chatroom.getHasNewMessage(),
                null,
                chatroom.getCreatedAt(),
                chatroom.getStatus().name()
            );
        })
        .toList();
}

// 메세지 저장
@Transactional
public Message saveMessage(User user, Long chatroomId, String content){
    if (user == null) {
        throw new BadRequestException("인증된 사용자만 메시지를 보낼 수 있습니다.");
    }

    if (content == null || content.trim().isEmpty()) {
        throw new BadRequestException("메시지 내용은 비워둘 수 없습니다.");
    }

    Chatroom chatroom = chatroomRepository.findById(chatroomId)
            .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 채팅방입니다. ID: " + chatroomId));
    
    if(!userChatroomMappingRepository.existsByUserIdAndChatroomId(user.getId(), chatroomId)){
        throw new ForbiddenAccessException("채팅방에 참여하지 않은 사용자는 메시지를 보낼 수 없습니다.");
    }

    Message message = Message.builder()
            .user(user)
            .chatroom(chatroom)
            .content(content)
            .build();

    return messageRepository.save(message);
}

// 메세지 조회
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

// 모든 채팅방 조회
@Transactional(readOnly = true)
public List<ChatroomDto> getAllChatrooms(){
    List<Chatroom> chatrooms = chatroomRepository.findAllByOrderByCreatedAtDesc();
    return chatrooms.stream()
        .map(chatroom -> new ChatroomDto(
            chatroom.getId(),
            chatroom.getTitle(),
            chatroom.getCategory(),
            chatroom.getApartmentId(),
            chatroom.getHasNewMessage(),
            null,
            chatroom.getCreatedAt(),
            chatroom.getStatus().name()
        ))
        .toList();
}

// 채팅방 상세 조회
@Transactional(readOnly = true)
public ChatroomDto getChatroomById(Long chatroomId){
    Chatroom chatroom = chatroomRepository.findById(chatroomId)
            .orElseThrow(() -> new ResourceNotFoundException("존재하지 않는 채팅방입니다. ID: " + chatroomId));
    
    return new ChatroomDto(
        chatroom.getId(),
        chatroom.getTitle(),
        chatroom.getCategory(),
        chatroom.getApartmentId(),
        chatroom.getHasNewMessage(),
        null,
        chatroom.getCreatedAt(),
        chatroom.getStatus().name()
    );
}

// 사용자가 채팅방에 참여했는지 확인
@Transactional(readOnly = true)
public boolean isUserInChatroom(Long userId, Long chatroomId) {
    if (userId == null || chatroomId == null) {
        return false;
    }
    return userChatroomMappingRepository.existsByUserIdAndChatroomId(userId, chatroomId);
}

// 채팅 메시지를 처리하고 저장한 후 구독자에게 전달합니다.
public ChatMessageDto handleChatMessage(Map<String, String> payload, Long chatroomId) {
    try {
        User currentUser = resolveCurrentUser(payload);
        
        String messageContent = validateAndGetMessage(payload);
        
        ensureUserInChatroom(currentUser, chatroomId);
        
        return processAndSendMessage(currentUser, chatroomId, messageContent);
    } catch (ChatException e) {
        log.error("메시지 처리 오류: {}", e.getMessage());
        return createErrorMessageDto(e.getMessage());
    } catch (Exception e) {
        log.error("예상치 못한 오류 발생: {}", e.getMessage(), e);
        return createErrorMessageDto("메시지 처리 중 오류가 발생했습니다.");
    }
}

// 현재 사용자 정보를 조회합니다. 
// SecurityUtil에서 인증 정보가 없으면 payload의 userId로 조회합니다.
private User resolveCurrentUser(Map<String, String> payload) {
    User currentUser = securityUtil.getCurrentUser();
    
    if (currentUser != null) {
        return currentUser;
    }
    
    Long userId = getUserIdFromPayload(payload);
    return userRepository.findById(userId)
            .orElseThrow(() -> new ChatException("사용자를 찾을 수 없습니다: " + userId));
}

// payload에서 userId를 안전하게 추출합니다.
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

// payload에서 메시지 내용을 검증하고 가져옵니다.
private String validateAndGetMessage(Map<String, String> payload) {
    String message = payload.get("message");
    if (message == null || message.trim().isEmpty()) {
        throw new ChatException("메시지 내용이 비어있습니다.");
    }
    return message;
}

// 사용자가 채팅방에 참여 중인지 확인하고, 참여하지 않았다면 자동 참여시킵니다.
private void ensureUserInChatroom(User user, Long chatroomId) {
    try {
        if (!isUserInChatroom(user.getId(), chatroomId)) {
            joinChatroom(user, chatroomId, null);
        }
    } catch (Exception e) {
        throw new ChatException("채팅방 참여 처리 중 오류: " + e.getMessage());
    }
}

// 메시지를 저장하고 채팅방 업데이트 알림을 전송한 후 메시지 DTO를 반환합니다.
private ChatMessageDto processAndSendMessage(User user, Long chatroomId, String messageContent) {
    Message message = saveMessage(user, chatroomId, messageContent);
    
    notifyChatroomUpdate(chatroomId);
    
    return ChatMessageDto.from(message);
}

// 채팅방 업데이트 알림을 전송합니다.
private void notifyChatroomUpdate(Long chatroomId) {
    ChatroomDto chatroomDto = getChatroomById(chatroomId);
    simpMessagingTemplate.convertAndSend("/sub/chats/updates", chatroomDto);
}

// 오류 메시지를 담은 ChatMessageDto를 생성합니다.
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
