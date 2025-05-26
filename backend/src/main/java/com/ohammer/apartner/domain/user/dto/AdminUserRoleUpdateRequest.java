package com.ohammer.apartner.domain.user.dto;

import com.ohammer.apartner.domain.user.entity.Role;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Set;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserRoleUpdateRequest {
    @NotEmpty(message = "권한은 최소 하나 이상 필요합니다")
    private Set<Role> roles;
}