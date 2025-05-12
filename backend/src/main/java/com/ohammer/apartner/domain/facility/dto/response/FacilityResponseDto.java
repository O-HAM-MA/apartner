package com.ohammer.apartner.domain.facility.dto;

import com.ohammer.apartner.domain.facility.entity.Facility;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FacilityResponseDto {

    private String name;

    private String description;

    public static FacilityResponseDto fromEntity(Facility facility) {
        return FacilityResponseDto.builder()
                .name(facility.getName())
                .description(facility.getDescription())
                .build();
    }
}
