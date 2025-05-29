package com.ohammer.apartner.domain.apartment.dto;

import com.ohammer.apartner.domain.apartment.entity.Building;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.Hibernate;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "건물(동) 정보 응답 DTO")
public class BuildingResponseDto {
    
    @Schema(description = "건물 ID", example = "1")
    private Long id;
    
    @Schema(description = "건물 번호(동)", example = "101동")
    private String buildingNumber;
    
    @Schema(description = "아파트 ID", example = "1")
    private Long apartmentId;
    
    public static BuildingResponseDto fromEntity(Building building, Long apartmentId) {
        return new BuildingResponseDto(
            building.getId(),
            building.getBuildingNumber(),
            apartmentId
        );
    }
    
 
    public static BuildingResponseDto safeFromEntity(Building building) {
        if (building == null) {
            return null;
        }
        
        Long apartmentId = null;
        
        if (building.getApartment() != null) {
            if (Hibernate.isInitialized(building.getApartment())) {
                apartmentId = building.getApartment().getId();
            }
        }
        
        return new BuildingResponseDto(
            building.getId(),
            building.getBuildingNumber(),
            apartmentId
        );
    }
} 