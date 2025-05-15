package com.ohammer.apartner.domain.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "사용자 정보 응답 DTO")
public class MyInfoResponseDto { //사용자 정보 조회용


    @Schema(description = "계정 이메일", example = "lion@gmail.com")
    private String email;

    @Schema(description = "사용자 이름", example = "홍길동")
    private String userName;

    @Schema(description = "사용자 전화번호", example = "010-1234-5678")
    private String phoneNum;

    @Schema(description = "계정 생성 시각")
    private LocalDateTime createdAt;

    @Schema(description = "계정 수정 시각")
    private LocalDateTime modifiedAt;

    @Schema(description = "프로필 이미지 url")
    private String profileImageUrl;
}
