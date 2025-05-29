package com.ohammer.apartner.domain.inspection.entity;

import com.ohammer.apartner.domain.opinion.entity.Opinion;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.Status;
import com.ohammer.apartner.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Entity
@Table(name = "inspections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Inspection extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "start_at")
    private LocalDateTime startAt;

    @Column(name = "finish_at")
    private LocalDateTime finishAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn (name = "type_id")
    private InspectionType type;

    @Column(name = "title")
    private String title;

    @Column(name = "detail", columnDefinition = "TEXT")
    private String detail;

    @Enumerated(EnumType.STRING)
    @Column(name = "result")
    private Result result;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status;

} 