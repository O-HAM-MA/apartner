package com.ohammer.apartner.domain.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "인증번호 확인 응답 DTO")
public class VerifyCodeResponseDto {
    
    @Schema(description = "인증번호 확인 결과 메시지", example = "인증이 완료되었습니다.")
    private String message;
    
    @Schema(description = "인증번호 확인 성공 여부", example = "true") 
    private boolean verified;
} 