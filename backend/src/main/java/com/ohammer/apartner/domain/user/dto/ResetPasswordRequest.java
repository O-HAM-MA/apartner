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
@Schema(description = "비밀번호 재설정 요청 DTO")
public class ResetPasswordRequest {

    @NotBlank(message = "현재 비밀번호를 입력하세요.")
    @Schema(description = "현재 비밀번호", example = "currentPassword123!")
    private String currentPassword;

    @NotBlank(message = "새 비밀번호를 입력하세요.")
    @Size(min = 8, message = "새 비밀번호는 8자 이상이어야 합니다.")
    @Pattern(regexp = "^(?=.*[a-zA-Z])(?=.*\\d)(?=.*[!@#$%^&*(),.?\":{}|<>]).*$", 
             message = "새 비밀번호는 영문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.")
    @Schema(description = "새 비밀번호 (8자 이상, 영문자, 숫자, 특수문자 포함)", example = "newPassword123!")
    private String newPassword;

    @NotBlank(message = "새 비밀번호 확인을 입력하세요.")
    @Schema(description = "새 비밀번호 확인", example = "newPassword123!")
    private String newPasswordConfirm;
}

