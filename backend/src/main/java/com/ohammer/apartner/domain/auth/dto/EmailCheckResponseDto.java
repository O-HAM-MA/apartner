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
@Schema(description = "이메일 중복 확인 응답 DTO")
public class EmailCheckResponseDto {
    
    @Schema(description = "이메일 중복 확인 결과 메시지", example = "사용 가능한 이메일입니다.")
    private String message;
    
    @Schema(description = "이메일 사용 가능 여부", example = "true")
    private boolean available;
} 