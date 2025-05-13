package com.ohammer.apartner.domain.facility.controller;

import com.ohammer.apartner.domain.facility.dto.statistics.BuildingUsageCountDto;
import com.ohammer.apartner.domain.facility.dto.statistics.DayOfWeekUsageDto;
import com.ohammer.apartner.domain.facility.dto.statistics.FacilityUsageCountDto;
import com.ohammer.apartner.domain.facility.dto.statistics.ReservationStatusRatioDto;
import com.ohammer.apartner.domain.facility.dto.statistics.TimePeriodUsageDto;
import com.ohammer.apartner.domain.facility.dto.statistics.UserUsageCountDto;
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

    @GetMapping("/user-usage")
    @Operation(
            summary = "사용자별 이용 횟수 통계",
            description = "사용자 기준으로 이용 횟수를 집계하여 순위별로 제공합니다."
    )
    public List<UserUsageCountDto> getUserUsageCount() {
        return facilityStatisticsService.getUserUsageCounts();
    }

    @GetMapping("/building-usage")
    @Operation(
            summary = "동별 이용 횟수 통계",
            description = "동(건물번호) 기준으로 이용 횟수를 집계하여 제공합니다."
    )
    public List<BuildingUsageCountDto> getBuildingUsageCount() {
        return facilityStatisticsService.getBuildingUsageCounts();
    }

    @GetMapping("/day-of-week")
    @Operation(summary = "요일별 이용 통계", description = "요일 기준으로 이용 건수를 분석합니다.")
    public List<DayOfWeekUsageDto> getDayOfWeekCount() {
        return facilityStatisticsService.getDayOfWeekUsageCounts();
    }

    @GetMapping("/time-period")
    @Operation(summary = "시간대별 이용 통계",
            description = "시간대(오전/오후/저녁/야간) 기준으로 이용 건수를 분석합니다. "
                    + "시간대 기준::: 오전: 05~12시, 오후: 12~17시, 저녁: 17~23시, 야간: 23~05시")
    public List<TimePeriodUsageDto> getTimePeriodCount() {
        return facilityStatisticsService.getTimePeriodUsageCounts();
    }

    @GetMapping("/reservation-status")
    @Operation(summary = "예약 상태별 비율", description = "AGREE, REJECT, CANCEL, PENDING 상태별 예약 건수를 조회합니다.")
    public List<ReservationStatusRatioDto> getReservationStatusStats() {
        return facilityStatisticsService.getReservationStatusRatios();
    }
}
