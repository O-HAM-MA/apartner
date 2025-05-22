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
@Schema(description = "공용시설 수정 요청 DTO")
public class FacilityUpdateRequestDto {

    @Schema(description = "등록할 공용시설 이름", example = "헬스장")
    private String name;

    @Schema(description = "공용시설 설명", example = "24시간 이용가능한 피트니스 센터")
    private String description;
}
