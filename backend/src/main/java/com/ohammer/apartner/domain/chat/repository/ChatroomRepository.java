package com.ohammer.apartner.domain.chat.repository;

import com.ohammer.apartner.domain.chat.entity.Chatroom;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatroomRepository extends JpaRepository<Chatroom, Long> {
}
