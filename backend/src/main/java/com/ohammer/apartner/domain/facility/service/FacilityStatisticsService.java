package com.ohammer.apartner.domain.facility.service;

import com.ohammer.apartner.domain.facility.dto.statistics.BuildingUsageCountDto;
import com.ohammer.apartner.domain.facility.dto.statistics.CancellationRatioDto;
import com.ohammer.apartner.domain.facility.dto.statistics.DayOfWeekUsageDto;
import com.ohammer.apartner.domain.facility.dto.statistics.FacilityUsageCountDto;
import com.ohammer.apartner.domain.facility.dto.statistics.ReservationStatusCountDto;
import com.ohammer.apartner.domain.facility.dto.statistics.TimePeriodUsageDto;
import com.ohammer.apartner.domain.facility.dto.statistics.UserUsageCountDto;
import com.ohammer.apartner.domain.facility.repository.FacilityReservationRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FacilityStatisticsService {

    private final FacilityReservationRepository facilityReservationRepository;

    // 시설별 이용 횟수
    public List<FacilityUsageCountDto> getTopFacilityUsage() {
        return facilityReservationRepository.findFacilityUsageCountTop();
    }

    // 사용자별 이용 횟수
    public List<UserUsageCountDto> getUserUsageCounts() {
        return facilityReservationRepository.findUserUsageCounts();
    }

    // 동별 이용 횟수
    public List<BuildingUsageCountDto> getBuildingUsageCounts() {
        return facilityReservationRepository.findBuildingUsageCounts();
    }

    // 요일별 이용 횟수
    public List<DayOfWeekUsageDto> getDayOfWeekUsageCounts() {
        List<Object[]> rawData = facilityReservationRepository.findUsageCountGroupedByDayOfWeek();

        return rawData.stream()
                .map(obj -> {
                    Integer dow = ((Number) obj[0]).intValue(); // 1(일) ~ 7(토)
                    Long count = (Long) obj[1];
                    String dayName = convertDayNumberToKorean(dow);
                    return new DayOfWeekUsageDto(dayName, count);
                })
                .toList();
    }

    private String convertDayNumberToKorean(int dow) {
        return switch (dow) {
            case 1 -> "일요일";
            case 2 -> "월요일";
            case 3 -> "화요일";
            case 4 -> "수요일";
            case 5 -> "목요일";
            case 6 -> "금요일";
            case 7 -> "토요일";
            default -> "알 수 없음";
        };
    }

    // 시간대별 이용 횟수
    public List<TimePeriodUsageDto> getTimePeriodUsageCounts() {
        List<Object[]> rawData = facilityReservationRepository.findUsageCountGroupedByTimePeriod();

        return rawData.stream()
                .map(obj -> new TimePeriodUsageDto(
                        (String) obj[0],
                        ((Number) obj[1]).longValue()
                ))
                .toList();
    }

    // 예약 상태 비율
    public List<ReservationStatusCountDto> getReservationStatusCounts() {
        return facilityReservationRepository.findReservationStatusCounts();
    }

    // 취소율
    public CancellationRatioDto getCancellationRatio() {
        Long total = facilityReservationRepository.countTotalReservations();
        Long cancelled = facilityReservationRepository.countCancelledReservations();

        double rate = (total == 0) ? 0.0 :
                BigDecimal.valueOf((double) cancelled / total)
                        .setScale(4, RoundingMode.HALF_UP)
                        .doubleValue();

        return new CancellationRatioDto(total, cancelled, rate);
    }

}
