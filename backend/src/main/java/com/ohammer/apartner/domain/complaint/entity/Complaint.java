package com.ohammer.apartner.domain.complaint.entity;

import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "complaints")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Complaint extends BaseEntity {


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "category", length = 50)
    private String category;

    @Column(name = "title", length = 50)
    private String title;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status;

    // Enum for status
    public enum Status {
        PENDING, IN_PROGRESS, COMPLETED, REJECTED
    }
} 