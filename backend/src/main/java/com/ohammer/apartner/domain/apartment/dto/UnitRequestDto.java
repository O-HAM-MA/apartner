package com.ohammer.apartner.domain.apartment.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "호수 생성/수정 요청 DTO")
public class UnitRequestDto {

    @NotNull(message = "건물 ID는 필수입니다.")
    @Schema(description = "건물 ID", example = "1")
    private Long buildingId;

    @NotBlank(message = "호수는 필수입니다.")
    @Size(max = 10, message = "호수는 10자를 초과할 수 없습니다.")
    @Schema(description = "호수", example = "101호")
    private String unitNumber;
} 