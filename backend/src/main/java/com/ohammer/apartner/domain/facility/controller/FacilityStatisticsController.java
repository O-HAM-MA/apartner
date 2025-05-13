package com.ohammer.apartner.domain.facility.controller;

import com.ohammer.apartner.domain.facility.dto.statistics.FacilityUsageCountDto;
import com.ohammer.apartner.domain.facility.dto.statistics.UserReservationCountDto;
import com.ohammer.apartner.domain.facility.service.FacilityStatisticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/facilities/statistics")
@Tag(name = "공용시설 이용 통계")
public class FacilityStatisticsController {

    private final FacilityStatisticsService facilityStatisticsService;

    @GetMapping("/facility-usage")
    @Operation(
            summary = "시설별 이용 횟수 통계",
            description = "가장 많이 이용된 시설부터 순위대로 반환합니다."
    )
    public List<FacilityUsageCountDto> getFacilityUsageCount() {
        return facilityStatisticsService.getTopFacilityUsage();
    }

    @GetMapping("/user-reservations")
    @Operation(
            summary = "사용자별 이용 횟수 통계",
            description = "사용자 기준으로 이용 횟수를 집계하여 순위별로 제공합니다."
    )
    public List<UserReservationCountDto> getUserReservationStats() {
        return facilityStatisticsService.getUserReservationCounts();
    }

}
