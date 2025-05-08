package com.ohammer.apartner.domain.opinion.entity;

import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "opinions")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Opinion extends BaseEntity {


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private Type type;

    // Enum for type
    public enum Type {
        RESIDENT, REPRESENTATIVE
    }
} 