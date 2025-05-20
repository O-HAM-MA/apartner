package com.ohammer.apartner.domain.chat.repository;

import com.ohammer.apartner.domain.chat.entity.Chatroom;
import com.ohammer.apartner.domain.chat.entity.UserChatroomMapping;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
public interface UserChatroomMappingRepository extends JpaRepository<UserChatroomMapping, Long> {
    Boolean existsByUserIdAndChatroomId(Long userId, Long chatroomId);

    void deleteByUserIdAndChatroomId(Long userId, Long chatroomId);

    List<UserChatroomMapping> findAllByUserId(Long userId);

    Optional<UserChatroomMapping> findByUserIdAndChatroomId(Long userId, Long chatroomId);
}
