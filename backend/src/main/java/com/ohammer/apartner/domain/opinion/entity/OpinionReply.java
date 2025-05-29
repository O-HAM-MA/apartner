package com.ohammer.apartner.domain.opinion.entity;

import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "opinion_replies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OpinionReply extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "opinion_id")
    private Opinion opinion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "reply", columnDefinition = "TEXT")
    private String reply;
} 