package com.ohammer.apartner.domain.facility.repository;

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
            "ORDER BY r.date ASC")
    List<FacilityReservation> findByUserWithFilter(
            @Param("userId") Long userId,
            @Param("date") LocalDate date,
            @Param("facilityId") Long facilityId,
            @Param("status") FacilityReservation.Status status
    );

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

}