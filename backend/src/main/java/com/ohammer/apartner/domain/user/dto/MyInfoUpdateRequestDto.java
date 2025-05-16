package com.ohammer.apartner.domain.user.dto;

import com.ohammer.apartner.domain.apartment.entity.Apartment;
import com.ohammer.apartner.domain.apartment.entity.Building;
import com.ohammer.apartner.domain.apartment.entity.Unit;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(description = "학원 정보 요청 DTO")
public class MyInfoUpdateRequestDto { //사용자 정보 수정용

    @Schema(description = "수정할 이름", example = "홍길동")
    private String userName;

    @Schema(description = "수정할 전화번호", example = "01012345678")
    private String phoneNum;

    @Schema(description = "수정할 아파트", example = "홍길동")
    private Apartment apartment;

    @Schema(description = "수정할 건물", example = "101동")
    private Building building;

    @Schema(description = "수정할 호수", example = "101호")
    private Unit unit;

}
