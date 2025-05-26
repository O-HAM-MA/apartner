package com.ohammer.apartner.domain.user.dto;

import com.ohammer.apartner.domain.apartment.entity.Apartment;
import com.ohammer.apartner.domain.apartment.entity.Building;
import com.ohammer.apartner.domain.user.entity.Role;
import com.ohammer.apartner.domain.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAccountResponse {
    
    private Long id;
    private String name;
    private String email;
    private String role;
    private Long apartmentId;
    private String apartmentName;
    private Long buildingId;
    private String buildingNumber;
    private LocalDateTime lastLogin;
    private String status;
    private Long gradeId;
    private String gradeName;
    private Integer gradeLevel; // 등급 레벨 추가
    
    public static AdminAccountResponse from(User user) {
        String roleName = null;
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            // ADMIN이나 MANAGER 역할이 있으면 우선적으로 표시
            if (user.getRoles().contains(Role.ADMIN)) {
                roleName = "ADMIN";
            } else if (user.getRoles().contains(Role.MANAGER)) {
                roleName = "MANAGER";
            } else {
                // 그 외의 경우 첫 번째 역할을 표시
                roleName = user.getRoles().iterator().next().name();
            }
        }

        // 등급 정보 설정
        if (user.getGradeId() != null) {
            // 등급 정보는 비동기로 가져오지 않고, AdminAccountService에서 처리하도록 함
            // 여기서는 gradeId만 설정하고 서비스 단에서 채워넣도록 구조 변경
        }
        
        return AdminAccountResponse.builder()
                .id(user.getId())
                .name(user.getUserName())
                .email(user.getEmail())
                .role(roleName)
                .apartmentId(user.getApartment() != null ? user.getApartment().getId() : null)
                .apartmentName(user.getApartment() != null ? user.getApartment().getName() : null)
                .buildingId(user.getBuilding() != null ? user.getBuilding().getId() : null)
                .buildingNumber(user.getBuilding() != null ? user.getBuilding().getBuildingNumber() : null)
                .lastLogin(user.getLastLoginAt())  // 마지막 로그인 시간 정보가 없어서 업데이트 시간으로 대체
                .status(user.getStatus().name())
                .gradeId(user.getGradeId())
                .gradeName(null)  // 서비스에서 채워줄 예정
                .gradeLevel(null) // 서비스에서 채워줄 예정
                .build();
    }
}