package com.ohammer.apartner.domain.user.dto;

import com.ohammer.apartner.domain.user.entity.Role;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserListResponse {
    private Long id;
    private String userName;
    private String email;
    private String phoneNum;
    private String socialProvider;
    private String apartmentName;
    private String buildingName;
    private String unitNumber;
    private Set<String> roles;
    private Status status;
    private LocalDateTime deletedAt;
    private LocalDateTime lastLoginAt;
    
    public static AdminUserListResponse from(User user) {
        String apartmentName = user.getApartment() != null ? user.getApartment().getName() : null;
        String buildingName = user.getBuilding() != null ? user.getBuilding().getBuildingNumber() : null;
        String unitNumber = user.getUnit() != null ? user.getUnit().getUnitNumber() : null;
        
        return AdminUserListResponse.builder()
                .id(user.getId())
                .userName(user.getUserName())
                .email(user.getEmail())
                .phoneNum(user.getPhoneNum())
                .socialProvider(user.getSocialProvider())
                .apartmentName(apartmentName)
                .buildingName(buildingName)
                .unitNumber(unitNumber)
                .roles(user.getRoles().stream()
                        .map(Role::name)
                        .collect(Collectors.toSet()))
                .status(user.getStatus())
                .deletedAt(user.getModifiedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }
}