package com.ohammer.apartner.domain.facility.repository;

import com.ohammer.apartner.domain.facility.entity.FacilityInstructor;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FacilityInstructorRepository extends JpaRepository<FacilityInstructor, Long> {

    @Query("SELECT i FROM FacilityInstructor i " +
            "WHERE i.facility.id = :facilityId " +
            "AND i.facility.status = com.ohammer.apartner.global.Status.ACTIVE " +
            "AND i.facility.apartment.id = :apartmentId " +
            "AND i.status = com.ohammer.apartner.domain.facility.entity.FacilityInstructor.Status.ACTIVE")
    List<FacilityInstructor> findActiveInstructorsForActiveFacility(@Param("facilityId") Long facilityId,
                                                                    @Param("apartmentId") Long apartmentId);
    
}
