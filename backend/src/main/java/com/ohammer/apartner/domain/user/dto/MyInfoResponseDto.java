package com.ohammer.apartner.domain.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Schema(description = "사용자 정보 응답 DTO")
public class MyInfoResponseDto { //사용자 정보 조회용

    @Schema(description = "사용자 ID", example = "1")
    private Long id;

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

    @Schema(description = "아파트 이름", example = "행복 아파트")
    private String apartmentName;

    @Schema(description = "아파트 동", example = "101동")
    private String buildingName;

    @Schema(description = "아파트 호수", example = "1004호")
    private String unitNumber;

    @Schema(description = "소셜 로그인 제공자", example = "Google")
    private String socialProvider;

    @Builder
    public MyInfoResponseDto(Long id, String userName, String email, String phoneNum, String profileImageUrl, String apartmentName, String buildingName, String unitNumber, String socialProvider, LocalDateTime createdAt, LocalDateTime modifiedAt) {
        this.id = id;
        this.userName = userName;
        this.email = email;
        this.phoneNum = phoneNum;
        this.profileImageUrl = profileImageUrl;
        this.apartmentName = apartmentName;
        this.buildingName = buildingName;
        this.unitNumber = unitNumber;
        this.socialProvider = socialProvider;
        this.createdAt = createdAt;
        this.modifiedAt = modifiedAt;
    }
}
