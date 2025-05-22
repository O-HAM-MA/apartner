package com.ohammer.apartner.domain.facility.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
@Schema(description = "공용시설 목록 조회 [관리자] 응답 DTO")
public class FacilityManagerSimpleResponseDto {

    @Schema(description = "공용시설 id", example = "1")
    private Long facilityId;

    @Schema(description = "공용시설 이름", example = "헬스장")
    private String facilityName;

    @Schema(description = "공용시설 운영 시작 시간", example = "06:00")
    private LocalTime openTime;

    @Schema(description = "공용시설 운영 종료 시간", example = "22:00")
    private LocalTime closeTime;
}
