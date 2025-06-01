package com.ohammer.apartner.global.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;
import com.ohammer.apartner.global.Status;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

@Getter
@Setter
@Entity
@Table(name = "notifications")
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Notification extends BaseEntity {
    @Id @GeneratedValue
    @Column(name = "id")
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "apartment_id")
    private Long apartmentId;

    @Column(name = "building_id")
    private Long buildingId;

    @Column(name = "title")
    private String title;

    @Column(name = "message")
    private String message;

    @Column(name = "type")
    private String type; // info, success, warning, error 등

    @Column(name = "business_type")
    private String businessType; // 비즈니스 이벤트 타입 (예: INSPECTION_NEW 등)

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status; // ACTIVE, INACTIVE

    @Column(name = "is_read")
    private Boolean isRead;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "link_url")
    private String linkUrl;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(columnDefinition = "TEXT")
    private String extra; // 알림 추가 정보, JSON 형식으로 저장

    @Column(name = "push_sent")
    private Boolean pushSent;

    @Column(name = "push_sent_at")
    private LocalDateTime pushSentAt;

    @Column(name = "category")
    private String category;

    @Column(name = "sender_id")
    private Long senderId;

    @Column(name = "expired_at")
    private LocalDateTime expiredAt; // 알림 만료 시간
}
