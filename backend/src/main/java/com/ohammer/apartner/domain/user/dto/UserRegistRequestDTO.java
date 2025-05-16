package com.ohammer.apartner.domain.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "회원가입 시 입력하는 사용자 정보 DTO")
public class UserRegistRequestDTO {

    @NotBlank(message = "이메일은 필수 입력값입니다.")
    @Email(message = "유효한 이메일 형식이 아닙니다.")
    @Schema(description = "사용자 이메일", example = "user@example.com")
    private String email;

    @Size(min = 8, message = "비밀번호는 8자 이상이어야 합니다.")
    @Pattern(regexp = "^(?=.*[a-zA-Z])(?=.*\\d)(?=.*[!@#$%^&*(),.?\":{}|<>]).*$", 
             message = "비밀번호는 영문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.")
    @Schema(description = "비밀번호 (8자 이상, 영문자, 숫자, 특수문자 포함)", example = "password123!")
    private String password;

    @NotBlank(message = "이름은 필수 입력값입니다.")
    @Schema(description = "사용자 이름", example = "홍길동")
    private String userName;

    @NotNull(message = "아파트 정보는 필수 입력값입니다.")
    @Schema(description = "아파트 ID", example = "1")
    private Long apartmentId;

    @NotNull(message = "동 정보는 필수 입력값입니다.")
    @Schema(description = "동 ID", example = "1")
    private Long buildingId;

    @NotNull(message = "호 정보는 필수 입력값입니다.")
    @Schema(description = "호 ID", example = "1")
    private Long unitId;

    @Pattern(
            regexp = "^01[0-9]{8,9}$",
            message = "전화번호는 10~11자리 숫자만 입력 가능합니다."
    )
    @Schema(description = "휴대폰 번호", example = "01012345678")
    private String phoneNum;


    // 소셜 로그인 관련 정보
    @Schema(description = "소셜 로그인 제공자", example = "kakao")
    private String socialProvider; // "kakao", "google" 등

    @Schema(description = "소셜 로그인 아이디", example = "1234567890")
    private String socialId;

    @Schema(description = "프로필 이미지", example = "https://example.com/profile.jpg")
    private String profileImage;
}
