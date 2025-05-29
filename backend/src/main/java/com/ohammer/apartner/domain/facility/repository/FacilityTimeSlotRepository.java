package com.ohammer.apartner.domain.facility.repository;

import com.ohammer.apartner.domain.facility.entity.FacilityTimeSlot;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FacilityTimeSlotRepository extends JpaRepository<FacilityTimeSlot, Long> {

    // 특정 강사의 일정 내 기간별 타임슬롯 조회
    @Query("SELECT t FROM FacilityTimeSlot t " +
            "WHERE t.instructor.id = :instructorId " +
            "AND t.facility.id = :facilityId " +
            "AND t.date BETWEEN :startDate AND :endDate")
    List<FacilityTimeSlot> findByInstructorAndDateRange(
            @Param("facilityId") Long facilityId,
            @Param("instructorId") Long instructorId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

}
