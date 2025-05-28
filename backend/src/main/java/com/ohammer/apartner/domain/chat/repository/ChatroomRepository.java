package com.ohammer.apartner.domain.chat.repository;

import com.ohammer.apartner.domain.chat.entity.Chatroom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatroomRepository extends JpaRepository<Chatroom, Long> {
    List<Chatroom> findAllByOrderByCreatedAtDesc();
    
    // 카테고리와 아파트ID로 채팅방 조회
    Optional<Chatroom> findByCategoryAndApartmentId(String category, Long apartmentId);
    
    // 카테고리로 채팅방 목록 조회
    List<Chatroom> findByCategoryOrderByCreatedAtDesc(String category);
    
    // 아파트ID로 채팅방 목록 조회
    List<Chatroom> findByApartmentIdOrderByCreatedAtDesc(Long apartmentId);
}
