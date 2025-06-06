package com.ohammer.apartner.domain.facility.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import java.time.LocalTime;
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

    @Schema(description = "공용시설 이름", example = "헬스장")
    @Size(max = 50, message = "시설명은 50자 이하여야 합니다.")
    private String name;

    @Schema(description = "공용시설 설명", example = "강습도 가능한 아주 좋은 피트니스 센터")
    private String description;

    @Schema(description = "공용시설 운영 시작 시간", example = "06:00")
    private LocalTime openTime;

    @Schema(description = "공용시설 운영 종료 시간", example = "23:00")
    private LocalTime closeTime;

}