package com.ohammer.apartner.domain.chat.entity;

import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import java.time.LocalDateTime;
import jakarta.persistence.Column;

@Entity
@Table(name = "userChatroomMapping")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@SuperBuilder
public class UserChatroomMapping extends BaseEntity {

    @JoinColumn(name = "user_id")
    @ManyToOne
    User user; // 채팅방 참여자


    @JoinColumn(name = "chatroom_id")
    @ManyToOne
    Chatroom chatroom; // 채팅방

    @Column(name = "last_check_at")
    LocalDateTime lastCheckAt; // 채팅방 조회 시간

    public void updateLastCheckAt(LocalDateTime lastCheckAt){
        this.lastCheckAt = lastCheckAt;
    }
}
