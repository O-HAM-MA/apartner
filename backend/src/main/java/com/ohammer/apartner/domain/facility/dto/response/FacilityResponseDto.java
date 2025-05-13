package com.ohammer.apartner.domain.facility.dto.response;

import com.ohammer.apartner.domain.facility.entity.Facility;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "공용시설 목록 응답 DTO")
public class FacilityResponseDto {

    @Schema(description = "공용시설 이름", example = "헬스장")
    private String name;

    @Schema(description = "공용시설 설명", example = "24시간 이용가능한 피트니스 센터")
    private String description;

    public static FacilityResponseDto fromEntity(Facility facility) {
        return FacilityResponseDto.builder()
                .name(facility.getName())
                .description(facility.getDescription())
                .build();
    }
}
