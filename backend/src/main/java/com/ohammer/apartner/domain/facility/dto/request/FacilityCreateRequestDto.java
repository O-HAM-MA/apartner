package com.ohammer.apartner.domain.facility.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "공용시설 등록 요청 DTO")
public class FacilityCreateRequestDto {

    @Schema(description = "등록할 공용시설 이름", example = "헬스장")
    private String name;

    @Schema(description = "공용시설 설명", example = "24시간 이용가능한 피트니스 센터")
    private String description;

    @Schema(description = "공용시설이 등록될 아파트", example = "1")
    private Long apartmentId;
}
