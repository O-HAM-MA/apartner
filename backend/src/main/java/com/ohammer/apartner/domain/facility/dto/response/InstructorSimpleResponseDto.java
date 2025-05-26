package com.ohammer.apartner.domain.facility.dto.response;

import com.ohammer.apartner.domain.facility.entity.FacilityInstructor;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "공용시설 강사 목록 조회 응답 DTO")
public class InstructorSimpleResponseDto {

    @Schema(description = "강사 ID", example = "1")
    private Long instructorId;

    @Schema(description = "강사 이름", example = "박태환")
    private String name;

    @Schema(description = "강사 소개/설명", example = "올림픽 메달리스트의 차원이 다른 수영 강습을 받아보세요")
    private String description;

    public static InstructorSimpleResponseDto from(FacilityInstructor entity) {
        return InstructorSimpleResponseDto.builder()
                .instructorId(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .build();
    }
}