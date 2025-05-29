package com.ohammer.apartner.domain.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "인증번호 확인 요청 DTO")
public class VerifyCodeRequestDto {
    
    @NotBlank(message = "이메일은 필수 입력값입니다.")
    @Email(message = "유효한 이메일 형식이 아닙니다.")
    @Schema(description = "인증번호를 확인할 이메일 주소", example = "user@example.com")
    private String email;
    
    @NotBlank(message = "인증번호는 필수 입력값입니다.")
    @Schema(description = "확인할 인증번호", example = "123456")
    private String code;
} 