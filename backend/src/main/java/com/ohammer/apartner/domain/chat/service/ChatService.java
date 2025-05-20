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
import com.ohammer.apartner.domain.chat.entity.Message;
import com.ohammer.apartner.domain.chat.repository.MessageRepository;
import com.ohammer.apartner.domain.chat.dto.ChatroomDto;
import com.ohammer.apartner.domain.chat.dto.ChatMessageDto;

@Slf4j
@RequiredArgsConstructor
@Service
public class ChatService {

private final ChatroomRepository chatroomRepository;
private final UserChatroomMappingRepository userChatroomMappingRepository;
private final MessageRepository messageRepository;

// 채팅방 생성
@Transactional
public ChatroomDto createChatRoom(User user, String title){
    if(title == null || title.trim().isEmpty()) {
        throw new BadRequestException("채팅방 제목은 비워둘 수 없습니다.");
    }

    Chatroom chatroom = Chatroom.builder()
            .title(title)
            .createdAt(LocalDateTime.now())
            .build();

    chatroom = chatroomRepository.save(chatroom);

    UserChatroomMapping userChatroomMapping = chatroom.addUser(user);
    userChatroomMapping.updateLastCheckAt(LocalDateTime.now());

    userChatroomMapping = userChatroomMappingRepository.save(userChatroomMapping);

    return new ChatroomDto(
        chatroom.getId(),
        chatroom.getTitle(),
        chatroom.getHasNewMessage(),
        chatroom.getUserChatroomMappingSet().size(),
        chatroom.getCreatedAt()
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
                chatroom.getHasNewMessage(),
                chatroom.getUserChatroomMappingSet().size(),
                chatroom.getCreatedAt()
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
            chatroom.getHasNewMessage(),
            chatroom.getUserChatroomMappingSet().size(),
            chatroom.getCreatedAt()
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
        chatroom.getHasNewMessage(),
        chatroom.getUserChatroomMappingSet().size(),
        chatroom.getCreatedAt()
    );
}
}
