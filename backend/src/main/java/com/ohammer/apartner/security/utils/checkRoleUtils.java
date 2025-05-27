package com.ohammer.apartner.security.utils;

import com.ohammer.apartner.domain.user.entity.Role;
import com.ohammer.apartner.domain.user.entity.User;

import java.util.Set;


public class checkRoleUtils {

    public static void validateAdminAccess() {
        User currentUser = SecurityUtil.getCurrentUser();
        if (currentUser == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Set<Role> roles = currentUser.getRoles();

        System.out.println("현재 유저 role들: ");
        roles.forEach(role -> System.out.println(" - " + role.getValue()));


        boolean isManagerOrModerator = roles.stream().anyMatch(role ->
                role.equals(Role.MANAGER) || role.equals(Role.MODERATOR));

        if (!isManagerOrModerator) {
            throw new RuntimeException("매니저만 접근할 수 있습니다.");
        }
    }

}
