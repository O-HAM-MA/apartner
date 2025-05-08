package com.ohammer.apartner.domain.inspection.entity;

import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "inspections")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inspection extends BaseEntity {



    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "start_at")
    private LocalDateTime startAt;

    @Column(name = "finish_at")
    private LocalDateTime finishAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "field")
    private Field field;

    @Column(name = "field2", columnDefinition = "TEXT")
    private String field2;

    @Enumerated(EnumType.STRING)
    @Column(name = "field3")
    private Field3 field3;

    // Enum for field
    public enum Field {
        수도, 청소, 소방, 가스
    }

    // Enum for field3
    public enum Field3 {
        CHECKED, PENDING, NOTYET
    }
} 