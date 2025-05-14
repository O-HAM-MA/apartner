package com.ohammer.apartner.domain.apartment.dto;

import com.ohammer.apartner.domain.apartment.entity.Unit;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "호수 정보 응답 DTO")
public class UnitResponseDto {
    
    @Schema(description = "호수 ID", example = "1")
    private Long id;
    
    @Schema(description = "호수", example = "101호")
    private String unitNumber;
    
    @Schema(description = "건물 ID", example = "1")
    private Long buildingId;
    
    public static UnitResponseDto fromEntity(Unit unit) {
        return UnitResponseDto.builder()
                .id(unit.getId())
                .unitNumber(unit.getUnitNumber())
                .buildingId(unit.getBuilding().getId())
                .build();
    }
} 