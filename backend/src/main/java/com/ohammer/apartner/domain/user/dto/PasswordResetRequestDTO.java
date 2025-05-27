package com.ohammer.apartner.domain.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import io.swagger.v3.oas.annotations.media.Schema;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "비밀번호 재설정 요청 DTO2")
public class PasswordResetRequestDTO {

    @NotBlank(message = "이메일을 입력하세요.")
    @Schema(description = "사용자 이메일", example = "user@example.com")
    private String email;
    
    @NotBlank(message = "인증번호를 입력하세요.")
    @Schema(description = "이메일 인증번호", example = "123456")
    private String verificationCode;

    @NotBlank(message = "새 비밀번호를 입력하세요.")
    @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다.")
    @Pattern(regexp = "^(?=.*[a-zA-Z])(?=.*\\d)(?=.*[!@#$%^&*(),.?\":{}|<>]).*$", 
             message = "비밀번호는 영문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.")
    @Schema(description = "새 비밀번호", example = "newPassword123!")
    private String password;

    @NotBlank(message = "새 비밀번호 확인을 입력하세요.")
    @Schema(description = "새 비밀번호 확인", example = "newPassword123!")
    private String confirmPassword;
} 