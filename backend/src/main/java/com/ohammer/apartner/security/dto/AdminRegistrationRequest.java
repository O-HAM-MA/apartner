package com.ohammer.apartner.security.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "관리자 등록 요청 DTO")
public class AdminRegistrationRequest {
    @Schema(description = "관리자 아이디", example = "newadmin")
    private String username;

    @Schema(description = "관리자 비밀번호", example = "newpassword123")
    private String password;

    @Schema(description = "관리자 이메일", example = "admin@example.com")
    private String email;
    // 추가적인 관리자 정보 필드들
} 