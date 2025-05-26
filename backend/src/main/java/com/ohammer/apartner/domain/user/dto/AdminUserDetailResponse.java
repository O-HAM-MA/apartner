package com.ohammer.apartner.domain.user.dto;

import com.ohammer.apartner.domain.user.entity.Role;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDetailResponse {
    private Long id;
    private String userName;
    private String email;
    private String phoneNum;
    private String socialProvider;
    private String socialId;
    private Long apartmentId;
    private String apartmentName;
    private Long buildingId;
    private String buildingNumber;
    private Long unitId;
    private String unitNumber;
    private Set<String> roles;
    private Status status;
    private String leaveReason;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
    private LocalDateTime lastLoginAt;
    private LocalDateTime deletedAt;
    private String profileImageUrl;
    
    public static AdminUserDetailResponse from(User user) {
        String apartmentName = user.getApartment() != null ? user.getApartment().getName() : null;
        Long apartmentId = user.getApartment() != null ? user.getApartment().getId() : null;
        
        String buildingNumber = user.getBuilding() != null ? user.getBuilding().getBuildingNumber() : null;
        Long buildingId = user.getBuilding() != null ? user.getBuilding().getId() : null;
        
        String unitNumber = user.getUnit() != null ? user.getUnit().getUnitNumber() : null;
        Long unitId = user.getUnit() != null ? user.getUnit().getId() : null;
        
        String profileImageUrl = user.getProfileImage() != null ? user.getProfileImage().getFilePath() : null;
        
        Set<String> roles = (user.getRoles() != null) ? 
            user.getRoles().stream()
                .map(Role::name)
                .collect(Collectors.toSet()) : 
            new HashSet<>();
        
        return AdminUserDetailResponse.builder()
                .id(user.getId())
                .userName(user.getUserName())
                .email(user.getEmail())
                .phoneNum(user.getPhoneNum())
                .socialProvider(user.getSocialProvider())
                .socialId(user.getSocialId())
                .apartmentId(apartmentId)
                .apartmentName(apartmentName)
                .buildingId(buildingId)
                .buildingNumber(buildingNumber)
                .unitId(unitId)
                .unitNumber(unitNumber)
                .roles(roles)
                .status(user.getStatus())
                .leaveReason(user.getLeaveReason())
                .createdAt(user.getCreatedAt())
                .modifiedAt(user.getModifiedAt())
                .lastLoginAt(user.getLastLoginAt())
                .deletedAt(user.getDeletedAt())
                .profileImageUrl(profileImageUrl)
                .build();
    }
}