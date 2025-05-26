package com.ohammer.apartner.domain.apartment.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "아파트 생성/수정 요청 DTO")
public class ApartmentRequestDto {

    @NotBlank(message = "아파트 이름은 필수입니다.")
    @Size(max = 50, message = "아파트 이름은 50자를 초과할 수 없습니다.")
    @Schema(description = "아파트 이름", example = "현대아파트")
    private String name;

    @Schema(description = "아파트 주소", example = "서울특별시 강남구 역삼동 123")
    private String address;

    @Size(max = 10, message = "우편번호는 10자를 초과할 수 없습니다.")
    @Schema(description = "우편번호", example = "12345")
    private String zipcode;
} 