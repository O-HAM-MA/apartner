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
@Schema(description = "사용자 정보 요청 DTO")
public class MyInfoUpdateRequestDto { //사용자 정보 수정용

    @Schema(description = "수정할 이름", example = "홍길동")
    private String userName;

    @Schema(description = "수정할 전화번호", example = "01012345678")
    private String phoneNum;

    @Schema(description = "사용자 이메일", example = "test@example.com")
    private String email;

    @Schema(description = "아파트 ID", example = "1")
    private Long apartmentId;

    @Schema(description = "동 ID", example = "1")
    private Long buildingId;

    @Schema(description = "호수 ID", example = "1")
    private Long unitId;

}
