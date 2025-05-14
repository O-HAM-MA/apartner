package com.ohammer.apartner.domain.apartment.dto;

import com.ohammer.apartner.domain.apartment.entity.Apartment;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "아파트 정보 응답 DTO")
public class ApartmentResponseDto {
    
    @Schema(description = "아파트 ID", example = "1")
    private Long id;
    
    @Schema(description = "아파트 이름", example = "현대아파트")
    private String name;
    
    @Schema(description = "아파트 주소", example = "서울특별시 강남구 역삼동 123")
    private String address;
    
    public static ApartmentResponseDto fromEntity(Apartment apartment) {
        return ApartmentResponseDto.builder()
                .id(apartment.getId())
                .name(apartment.getName())
                .address(apartment.getAddress())
                .build();
    }
} 