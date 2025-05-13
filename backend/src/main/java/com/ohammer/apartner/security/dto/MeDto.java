package com.ohammer.apartner.security.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.NonNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
public class MeDto {
    private final Long id;
    private final String userName;
    private final LocalDateTime createdAt;
    private final LocalDateTime modifiedAt;
    private final String profileImageUrl;
    private final String apartmentName;
    private final String buildingName;
    private final String unitNumber;

    public MeDto(Long id, String userName, LocalDateTime createdAt, LocalDateTime modifiedAt, String profileImageUrl, String apartmentName, String buildingName, String unitNumber) {
        this.id = id;
        this.userName = userName;
        this.createdAt = createdAt;
        this.modifiedAt = modifiedAt;
        this.profileImageUrl = profileImageUrl;
        this.apartmentName = apartmentName;
        this.buildingName = buildingName;
        this.unitNumber = unitNumber;
    }
}
