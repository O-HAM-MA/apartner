package com.ohammer.apartner.security.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;


@Getter
@AllArgsConstructor
@Schema(description = "me DTO")
public class MeDto {
    private Long id;
    private String userName;
    private String email;
    private String phoneNum;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    private String profileImageUrl;
    private String apartmentName;
    private String buildingName;
    private String unitNumber;
    private String socialProvider;
    private String zipcode;
    private String address;
    private Long apartmentId;

    public MeDto(Long id, String userName, String email, String phoneNum, LocalDateTime createdAt,
                 LocalDateTime modifiedAt, String profileImageUrl, String apartmentName, Long apartmentId,
                 String buildingName, String unitNumber, String socialProvider, String zipcode, String address) {
        this.id = id;
        this.userName = userName;
        this.email = email;
        this.phoneNum = phoneNum;
        this.createdAt = createdAt;
        this.modifiedAt = modifiedAt;
        this.profileImageUrl = profileImageUrl;
        this.apartmentName = apartmentName;
        this.buildingName = buildingName;
        this.unitNumber = unitNumber;
        this.socialProvider = socialProvider;
        this.zipcode = zipcode;
        this.address = address;
        this.apartmentId = apartmentId;
    }
}
