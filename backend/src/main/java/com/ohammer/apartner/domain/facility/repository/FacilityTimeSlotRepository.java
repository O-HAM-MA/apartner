package com.ohammer.apartner.domain.facility.repository;

import com.ohammer.apartner.domain.facility.entity.FacilityTimeSlot;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FacilityTimeSlotRepository extends JpaRepository<FacilityTimeSlot, Long> {

    List<FacilityTimeSlot> findByFacilityIdAndDate(Long facilityId, LocalDate date);

}
