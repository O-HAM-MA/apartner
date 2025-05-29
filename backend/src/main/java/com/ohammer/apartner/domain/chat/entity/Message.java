package com.ohammer.apartner.domain.chat.entity;

import com.ohammer.apartner.global.entity.BaseEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Column;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.ohammer.apartner.domain.chat.entity.Chatroom;
import com.ohammer.apartner.domain.user.entity.User;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Message extends BaseEntity {

    @Column(nullable = false, length = 1000, columnDefinition = "TEXT")
    private String content; 

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chatroom_id")
    private Chatroom chatroom; 

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    @Column(name = "client_id", length = 100)
    private String clientId; // 클라이언트에서 생성한 고유 ID
}
