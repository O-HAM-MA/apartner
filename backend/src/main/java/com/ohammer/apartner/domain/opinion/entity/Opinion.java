package com.ohammer.apartner.domain.opinion.entity;

import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.Status;
import com.ohammer.apartner.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "opinions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Opinion extends BaseEntity {


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "title")
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private Type type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status;

    // Enum for type
    public enum Type {
        RESIDENT, REPRESENTATIVE
    }
} 