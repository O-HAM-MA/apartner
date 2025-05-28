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
@Schema(description = "건물(동) 생성/수정 요청 DTO")
public class BuildingRequestDto {

    @NotNull(message = "아파트 ID는 필수입니다.")
    @Schema(description = "아파트 ID", example = "1")
    private Long apartmentId;

    @NotBlank(message = "건물 번호(동)는 필수입니다.")
    @Size(max = 10, message = "건물 번호(동)는 10자를 초과할 수 없습니다.")
    @Schema(description = "건물 번호(동)", example = "101동")
    private String buildingNumber;
} 