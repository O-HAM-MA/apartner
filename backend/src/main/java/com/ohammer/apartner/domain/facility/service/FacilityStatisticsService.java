package com.ohammer.apartner.domain.facility.service;

import com.ohammer.apartner.domain.facility.dto.statistics.BuildingUsageCountDto;
import com.ohammer.apartner.domain.facility.dto.statistics.FacilityUsageCountDto;
import com.ohammer.apartner.domain.facility.dto.statistics.UserUsageCountDto;
import com.ohammer.apartner.domain.facility.repository.FacilityReservationRepository;
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

}
