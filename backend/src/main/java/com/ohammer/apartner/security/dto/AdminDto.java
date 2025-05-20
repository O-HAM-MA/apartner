package com.ohammer.apartner.security.dto;

import com.ohammer.apartner.domain.user.entity.Role;

import java.time.LocalDateTime;
import java.util.Set;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AdminDto {
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
    private Set<Role> roles;
    private Long gradeId;
}
