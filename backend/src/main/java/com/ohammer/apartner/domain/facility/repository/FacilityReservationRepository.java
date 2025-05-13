package com.ohammer.apartner.domain.facility.repository;

import com.ohammer.apartner.domain.facility.entity.FacilityReservation;
import com.ohammer.apartner.domain.facility.entity.FacilityReservationStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FacilityReservationRepository extends JpaRepository<FacilityReservation, Long> {

    // 특정 시설의 중복 예약 검사 (날짜 + 시간 겹침 여부)
    @Query("""
            SELECT fr FROM FacilityReservation fr
            WHERE fr.facility.id = :facilityId
              AND fr.date = :date
              AND fr.status <> 'CANCEL'
              AND (
                    (fr.startTime < :endTime AND fr.endTime > :startTime)
                  )
            """)
    List<FacilityReservation> findOverlappingReservations(
            @Param("facilityId") Long facilityId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    @Query("SELECT r FROM FacilityReservation r " +
            "WHERE r.user.id = :userId " +
            "AND (:date IS NULL OR r.date = :date) " +
            "AND (:facilityId IS NULL OR r.facility.id = :facilityId) " +
            "AND (:status IS NULL OR r.status = :status) " +
            "ORDER BY r.createdAt DESC")
    List<FacilityReservation> findByUserWithFilter(
            @Param("userId") Long userId,
            @Param("date") LocalDate date,
            @Param("facilityId") Long facilityId,
            @Param("status") FacilityReservationStatus status
    );
}