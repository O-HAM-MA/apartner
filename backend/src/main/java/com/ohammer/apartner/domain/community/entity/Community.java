package com.ohammer.apartner.domain.community.entity;

import com.ohammer.apartner.domain.opinion.entity.Opinion;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.Status;
import com.ohammer.apartner.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.Builder;

@Entity
@Table(name = "communities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Community extends BaseEntity {

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Community parent; // null: root post, else reply

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status; // = Status.ACTIVE; // ACTIVE, INACTIVE for soft delete

    @Column(nullable = false)
    private boolean pinned;// = false; // 관리자 고정글용



}
