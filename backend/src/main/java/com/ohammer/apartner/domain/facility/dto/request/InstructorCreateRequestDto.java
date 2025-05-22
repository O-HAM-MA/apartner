package com.ohammer.apartner.domain.facility.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "공용시설 강사 등록 요청 DTO")
public class InstructorCreateRequestDto {

    @Schema(description = "강사 이름", example = "박태환")
    @NotBlank(message = "강사 이름은 필수 입력값입니다.")
    private String name;

    @Schema(description = "강사 설명", example = "올림픽 메달리스트의 차원이 다른 수영 강습을 받아보세요")
    private String description;

    @Schema(description = "공용시설 운영 시작 시간", example = "06:00")
    @NotNull(message = "운영 시작 시간은 필수입니다.")
    private LocalTime openTime;
}
