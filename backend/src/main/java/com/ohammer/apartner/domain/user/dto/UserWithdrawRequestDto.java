package com.ohammer.apartner.domain.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "회원 탈퇴 요청 DTO")
public class UserWithdrawRequestDto {

    @Schema(description = "사용자 비밀번호", example = "password123!")
    private String password;

    @NotBlank(message = "탈퇴 사유는 필수입니다.")
    @Schema(description = "탈퇴 사유", example = "서비스 불만")
    private String leaveReason;
    
    @Schema(description = "소셜 로그인 제공자", example = "kakao")
    private String socialProvider;
    
    @Schema(description = "소셜 로그인 사용자 여부", example = "true")
    private Boolean isSocialUser;
} 