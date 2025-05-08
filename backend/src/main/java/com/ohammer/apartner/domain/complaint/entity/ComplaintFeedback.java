package com.ohammer.apartner.domain.complaint.entity;

import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "complaint_feedback")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintFeedback extends BaseEntity {


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaints_id")
    private Complaint complaint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;
} 