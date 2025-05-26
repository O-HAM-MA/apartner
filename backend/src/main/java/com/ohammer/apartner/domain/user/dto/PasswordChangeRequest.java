package com.ohammer.apartner.domain.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordChangeRequest {
    
    @NotBlank(message = "비밀번호는 필수 입력값입니다")
    private String password;
    
    @NotBlank(message = "비밀번호 확인은 필수 입력값입니다")
    private String confirmPassword;
}