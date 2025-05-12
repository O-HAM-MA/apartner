package com.ohammer.apartner.domain.facility.repository;

import com.ohammer.apartner.domain.facility.entity.FacilityReservation;
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

    List<FacilityReservation> findByUserIdOrderByCreatedAtDesc(Long userId);
    
}
