package com.ohammer.apartner.domain.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "휴대폰 번호 중복 확인 요청 DTO")
public class PhoneCheckRequestDto {
    
    @NotBlank(message = "휴대폰 번호는 필수 입력값입니다.")
    @Pattern(regexp = "^01[0-9]{8,9}$", message = "유효한 휴대폰 번호 형식이 아닙니다.")
    @Schema(description = "확인할 휴대폰 번호", example = "01012345678")
    private String phoneNumber;
} 