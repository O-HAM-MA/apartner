package com.ohammer.apartner.domain.facility.entity;

import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum FacilityReservationStatus {
    AGREE("승인 완료"),
    PENDING("승인 대기"),
    REJECT("승인 거절"),
    CANCEL("예약 취소");

    private final String description;

    @JsonValue  // JSON 변환 시 description이 나가도록 설정
    public String getDescription() {
        return description;
    }
}