package com.ohammer.apartner.global.dto;

import com.ohammer.apartner.global.entity.Notification;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
public class NotificationResponseDto {
    private Long userId;
    private Long apartmentId;
    private Long buildingId;
    private String title;
    private String message;
    private String type;
    private String businessType;
    private String status;
    private Boolean isRead;
    private LocalDateTime readAt;
    private String linkUrl;
    private Long entityId;
    private String extra;
    private Boolean pushSent;
    private LocalDateTime pushSentAt;
    private String category;
    private Long senderId;
    private LocalDateTime expiredAt;
    private LocalDateTime createdAt;

    public static NotificationResponseDto from(Notification n) {
        return NotificationResponseDto.builder()
                .userId(n.getUserId())
                .apartmentId(n.getApartmentId())
                .buildingId(n.getBuildingId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .businessType(n.getBusinessType())
                .status(n.getStatus().name())
                .isRead(n.getIsRead())
                .readAt(n.getReadAt())
                .linkUrl(n.getLinkUrl())
                .entityId(n.getEntityId())
                .extra(n.getExtra())
                .pushSent(n.getPushSent())
                .pushSentAt(n.getPushSentAt())
                .category(n.getCategory())
                .senderId(n.getSenderId())
                .expiredAt(n.getExpiredAt())
                .createdAt(n.getCreatedAt())
                .build();
    }
} 