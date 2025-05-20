package com.ohammer.apartner.security.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "관리자 로그인 요청 DTO")
public class AdminLoginRequest {
    @Schema(description = "관리자 아이디", example = "admin")
    private String username;

    @Schema(description = "관리자 비밀번호", example = "password123")
    private String password;
} 