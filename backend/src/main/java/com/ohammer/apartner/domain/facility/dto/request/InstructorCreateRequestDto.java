package com.ohammer.apartner.domain.facility.dto.request;

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
@Schema(description = "공용시설 강사 등록 요청 DTO")
public class InstructorCreateRequestDto {

    @Schema(description = "강사 이름", example = "박태환")
    private String name;

    @Schema(description = "강사 소개/설명", example = "올림픽 메달리스트의 차원이 다른 수영 강습을 받아보세요")
    private String description;

}
