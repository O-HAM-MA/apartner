package com.ohammer.apartner.domain.chat.entity;

import com.ohammer.apartner.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import com.ohammer.apartner.domain.user.entity.User;
import java.util.Set;
import java.util.HashSet;

@Entity
@Table(name = "chatroom")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@SuperBuilder
public class Chatroom extends BaseEntity {

    @Column(name = "title", length = 50)
    String title; // 채팅방 제목

    @Column(name = "category_code", length = 10, nullable = false)
    String categoryCode; // 채팅 카테고리 코드 (A01, A02, A03, A04)

    @Column(name = "apartment_id")
    Long apartmentId; // 아파트 ID

    @Transient // 데이터베이스에 저장되지 않음
    Boolean hasNewMessage; // 새로운 메시지 여부 true, false

    @OneToMany(mappedBy = "chatroom")
    Set<UserChatroomMapping> userChatroomMappingSet; // 채팅방 참여자 목록

    public enum Status {
        ACTIVE, INACTIVE
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status = Status.ACTIVE;

    public UserChatroomMapping addUser(User user) {
        if (this.getUserChatroomMappingSet() == null) {
            this.userChatroomMappingSet = new HashSet<>();
        }

        UserChatroomMapping userChatroomMapping = UserChatroomMapping.builder()
                .chatroom(this)
                .user(user)
                .build();

        this.userChatroomMappingSet.add(userChatroomMapping);
        return userChatroomMapping;
    }
}
