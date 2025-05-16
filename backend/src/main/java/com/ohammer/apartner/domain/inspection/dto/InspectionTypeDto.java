package com.ohammer.apartner.domain.inspection.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "점검 분류를 지정해서 추가/수정을 위한 DTO")
public class InspectionTypeDto {

    @NotBlank(message = "점검 분류는 필수 요소 입니다")
    @Schema(description = "추가/수정할 점검 분류", example = "차량")
    private String name;
}
