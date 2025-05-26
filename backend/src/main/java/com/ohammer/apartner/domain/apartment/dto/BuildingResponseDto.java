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
    
    /**
     * Building 엔티티로부터 DTO를 생성합니다.
     * 이 메서드는 프록시 객체를 안전하게 처리합니다.
     * 
     * @param building 건물 엔티티
     * @return BuildingResponseDto 인스턴스
     */
    public static BuildingResponseDto safeFromEntity(Building building) {
        if (building == null) {
            return null;
        }
        
        Long apartmentId = null;
        
        // 아파트 객체가 있고 초기화되었는지 확인
        if (building.getApartment() != null) {
            if (Hibernate.isInitialized(building.getApartment())) {
                apartmentId = building.getApartment().getId();
            }
            // 프록시 객체이고 초기화되지 않은 경우 apartmentId는 null로 유지
        }
        
        return new BuildingResponseDto(
            building.getId(),
            building.getBuildingNumber(),
            apartmentId
        );
    }
} 