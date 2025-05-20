package com.ohammer.apartner.domain.chat.repository;

import java.util.List;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;

import com.ohammer.apartner.domain.chat.entity.Message;

public interface MessageRepository extends JpaRepository<Message, Long> {
    boolean existsByChatroomIdAndCreatedAtAfter(Long chatroomId, LocalDateTime lastCheckAt);

    List<Message> findAllByChatroomId(Long chatroomId);

    List<Message> findAllByChatroomIdOrderByCreatedAtAsc(Long chatroomId);
}
