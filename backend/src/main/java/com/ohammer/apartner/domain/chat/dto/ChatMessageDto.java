package com.ohammer.apartner.domain.chat.dto;

import com.ohammer.apartner.domain.chat.entity.Message;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.apartment.entity.Apartment;
import com.ohammer.apartner.domain.apartment.entity.Building;
import com.ohammer.apartner.domain.apartment.entity.Unit;
import com.ohammer.apartner.domain.image.entity.Image;

public record ChatMessageDto(
    Long userId,
    String message,
    String userName,
    String profileImageUrl,
    String apartmentName,
    String buildingName,
    String unitNumber,
    String timestamp,
    Long messageId
) {
    public static ChatMessageDto from(Message message) {
        User user = message.getUser();
        String profileUrl = null;
        if (user.getProfileImage() != null) {
            profileUrl = user.getProfileImage().getFilePath();
        }

        String aptName = null;
        if (user.getApartment() != null) {
            aptName = user.getApartment().getName();
        }

        String bldgName = null;
        if (user.getBuilding() != null) {
            bldgName = user.getBuilding().getBuildingNumber();
        }

        String unitNum = null;
        if (user.getUnit() != null) {
            unitNum = user.getUnit().getUnitNumber();
        }

        return new ChatMessageDto(
            user.getId(),
            message.getContent(),
            user.getUserName(),
            profileUrl,
            aptName,
            bldgName,
            unitNum,
            message.getCreatedAt().toString(),
            message.getId()
        );
    }
}
