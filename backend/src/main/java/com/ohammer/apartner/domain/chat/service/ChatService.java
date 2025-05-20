package com.ohammer.apartner.domain.chat.service;

import com.ohammer.apartner.domain.chat.entity.Chatroom;
import com.ohammer.apartner.domain.chat.entity.UserChatroomMapping;
import com.ohammer.apartner.domain.chat.repository.ChatroomRepository;
import com.ohammer.apartner.domain.chat.repository.UserChatroomMappingRepository;
import com.ohammer.apartner.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import com.ohammer.apartner.domain.chat.entity.Message;
import com.ohammer.apartner.domain.chat.repository.MessageRepository;


@Slf4j
@RequiredArgsConstructor
@Service
public class ChatService {

private final ChatroomRepository chatroomRepository;
private final UserChatroomMappingRepository userChatroomMappingRepository;
private final MessageRepository messageRepository;

// 생성
@Transactional
public Chatroom createChatRoom(User user, String title){
    Chatroom chatroom = Chatroom.builder()
            .title(title)
            .createdAt(LocalDateTime.now())
            .build();

    chatroom = chatroomRepository.save(chatroom);

    UserChatroomMapping userChatroomMapping = chatroom.addUser(user);

    userChatroomMapping = userChatroomMappingRepository.save(userChatroomMapping);

    return  chatroom;
}


// 참여
@Transactional
    public Boolean joinChatroom(User user, Long newChatroomId, Long currentChatroomId){

if(currentChatroomId != null){ // 현재 참여한 채팅방이 있으면 조회 시간 업데이트
    updateUserCheckedAt(user, currentChatroomId); 
}


    if(userChatroomMappingRepository.existsByUserIdAndChatroomId(user.getId(), newChatroomId)){

        log.info("이미 참여한 채팅방입니다.");

        return  false;
    }

    Chatroom chatroom = chatroomRepository.findById(newChatroomId).get();

    UserChatroomMapping userChatroomMapping = UserChatroomMapping.builder()
            .user(user)
            .chatroom(chatroom)
            .build();
    
    userChatroomMapping = userChatroomMappingRepository.save(userChatroomMapping);

    return true;
}

private void updateUserCheckedAt(User user, Long currentChatroomId){
    UserChatroomMapping userChatroomMapping = userChatroomMappingRepository.findByUserIdAndChatroomId(user.getId(), currentChatroomId).get();
    userChatroomMapping.updateLastCheckAt(LocalDateTime.now());
    userChatroomMappingRepository.save(userChatroomMapping);
}



// 탈퇴
    @Transactional
    public Boolean leaveChatroom(User user, Long chatroomId){
        if(!userChatroomMappingRepository.existsByUserIdAndChatroomId(user.getId(), chatroomId)){
            log.info("참여하지 않는 방입니다");
                    return  false;
        }

        userChatroomMappingRepository.deleteByUserIdAndChatroomId(user.getId(), chatroomId);


return  true;
    }


    // 사용자가 참여한 채팅방 목록
    @Transactional(readOnly = true)
    public List<Chatroom> getChatroomList(User user){
List<UserChatroomMapping> userChatroomMappingList = userChatroomMappingRepository.findAllByUserId(user.getId());

return userChatroomMappingList.stream()
        .map(userChatroomMapping ->
        {
            Chatroom chatroom = userChatroomMapping.getChatroom();
            chatroom.setHasNewMessage(
                messageRepository.existsByChatroomIdAndCreatedAtAfter(chatroom.getId(), 
                userChatroomMapping.getLastCheckAt())); // 채팅방 새로운 메시지 여부 설정
            return chatroom; // 채팅방 반환
        })
        .toList(); // 채팅방 목록 반환

    }

    // 메세지 저장
    @Transactional
    public Message saveMessage(User user, Long chatroomId, String content){
        Chatroom chatroom = chatroomRepository.findById(chatroomId).get();

        Message message = Message.builder()
                .user(user)
                .chatroom(chatroom)
                .content(content)
                .build();

        return messageRepository.save(message);
    }

    // 메세지 조회
    @Transactional(readOnly = true)
    public List<Message> getMessageList(Long chatroomId){
        return messageRepository.findAllByChatroomId(chatroomId);
    }







}
