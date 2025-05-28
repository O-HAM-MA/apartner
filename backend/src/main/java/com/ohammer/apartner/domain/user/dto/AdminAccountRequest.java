package com.ohammer.apartner.domain.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAccountRequest {
    
    @NotBlank(message = "이름은 필수 입력값입니다")
    private String name;
    
    @NotBlank(message = "이메일은 필수 입력값입니다")
    private String email;
    
    @NotBlank(message = "역할은 필수 입력값입니다")
    private String role;
    
    private Long apartmentId;
    
    private Long buildingId;
    
    private String password;
    
    private Long gradeId;
    
    @Builder.Default
    private boolean active = true;
}