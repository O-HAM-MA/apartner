package com.ohammer.apartner.domain.facility.repository;

import com.ohammer.apartner.domain.facility.dto.statistics.BuildingUsageCountDto;
import com.ohammer.apartner.domain.facility.dto.statistics.FacilityUsageCountDto;
import com.ohammer.apartner.domain.facility.dto.statistics.ReservationStatusCountDto;
import com.ohammer.apartner.domain.facility.dto.statistics.UserUsageCountDto;
import com.ohammer.apartner.domain.facility.entity.FacilityReservation;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FacilityReservationRepository extends JpaRepository<FacilityReservation, Long> {

    Long countByTimeSlot_IdAndStatus(Long timeSlotId, FacilityReservation.Status status);

    @Query("SELECT r FROM FacilityReservation r " +
            "JOIN FETCH r.user u " +
            "JOIN FETCH r.facility f " +
            "WHERE (:date IS NULL OR r.date = :date) AND " +
            "(:facilityId IS NULL OR f.id = :facilityId) AND " +
            "(:status IS NULL OR r.status = :status)")
    Page<FacilityReservation> findByManagerFilter(
            @Param("date") LocalDate date,
            @Param("facilityId") Long facilityId,
            @Param("status") FacilityReservation.Status status,
            Pageable pageable
    );

    // 시간대 중복 예약 체크
    @Query("""
                SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END
                FROM FacilityReservation r
                WHERE r.user.id = :userId
                  AND r.status IN (com.ohammer.apartner.domain.facility.entity.FacilityReservation.Status.AGREE, 
                              com.ohammer.apartner.domain.facility.entity.FacilityReservation.Status.PENDING)
                  AND (
                        (r.startTime < :endTime AND r.endTime > :startTime)
                  )
            """)
    boolean existsTimeConflict(@Param("userId") Long userId,
                               @Param("startTime") LocalDateTime startTime,
                               @Param("endTime") LocalDateTime endTime);

    // 슬롯 내 예약된 인원 수 체크
    Long countByTimeSlotIdAndStatus(Long timeSlotId, FacilityReservation.Status status);

    List<FacilityReservation> findByUserIdOrderByStartTimeDesc(Long userId);

    // 시설별 이용 횟수
    @Query("SELECT new com.ohammer.apartner.domain.facility.dto.statistics.FacilityUsageCountDto(fr.facility.name, COUNT(fr)) "
            +
            "FROM FacilityReservation fr " +
            "WHERE fr.status = 'AGREE' " +
            "GROUP BY fr.facility.name " +
            "ORDER BY COUNT(fr) DESC")
    List<FacilityUsageCountDto> findFacilityUsageCountTop();

    // 사용자별 이용 횟수
    @Query("SELECT new com.ohammer.apartner.domain.facility.dto.statistics.UserUsageCountDto(" +
            "u.userName, u.building.buildingNumber, u.unit.unitNumber, COUNT(fr)) " +
            "FROM FacilityReservation fr " +
            "JOIN fr.user u " +
            "WHERE fr.status = 'AGREE' " +
            "GROUP BY u.userName, u.building.buildingNumber, u.unit.unitNumber " +
            "ORDER BY COUNT(fr) DESC")
    List<UserUsageCountDto> findUserUsageCounts();

    // 동별 이용 횟수
    @Query("SELECT new com.ohammer.apartner.domain.facility.dto.statistics.BuildingUsageCountDto(" +
            "u.building.buildingNumber, COUNT(fr)) " +
            "FROM FacilityReservation fr " +
            "JOIN fr.user u " +
            "WHERE fr.status = 'AGREE' " +
            "GROUP BY u.building.buildingNumber " +
            "ORDER BY COUNT(fr) DESC")
    List<BuildingUsageCountDto> findBuildingUsageCounts();

    // 요일별 이용 횟수 (1:일요일, 7:토요일)
    @Query("SELECT FUNCTION('DAYOFWEEK', fr.date) AS dow, COUNT(fr) " +
            "FROM FacilityReservation fr " +
            "WHERE fr.status = 'AGREE' " +
            "GROUP BY FUNCTION('DAYOFWEEK', fr.date)")
    List<Object[]> findUsageCountGroupedByDayOfWeek();

    // 시간대별 이용 횟수
    @Query(value = """
            SELECT 
                CASE 
                    WHEN HOUR(start_time) BETWEEN 05 AND 11 THEN '오전'
                    WHEN HOUR(start_time) BETWEEN 12 AND 16 THEN '오후'
                    WHEN HOUR(start_time) BETWEEN 17 AND 22 THEN '저녁'
                    ELSE '야간'
                END AS time_period,
                COUNT(*) AS cnt
            FROM facility_reservations
            WHERE status = 'AGREE'
            GROUP BY time_period
            ORDER BY cnt DESC
            """, nativeQuery = true)
    List<Object[]> findUsageCountGroupedByTimePeriod();

    // 예약 상태 현황
    @Query("SELECT new com.ohammer.apartner.domain.facility.dto.statistics.ReservationStatusCountDto(fr.status, COUNT(fr)) "
            +
            "FROM FacilityReservation fr GROUP BY fr.status")
    List<ReservationStatusCountDto> findReservationStatusCounts();

    // 취소율
    @Query("SELECT COUNT(fr) FROM FacilityReservation fr")
    Long countTotalReservations();

    @Query("SELECT COUNT(fr) FROM FacilityReservation fr WHERE fr.status = 'CANCEL'")
    Long countCancelledReservations();

}