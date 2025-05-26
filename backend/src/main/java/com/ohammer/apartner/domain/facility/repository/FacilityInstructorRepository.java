package com.ohammer.apartner.domain.facility.repository;

import com.ohammer.apartner.domain.facility.entity.FacilityInstructor;
import com.ohammer.apartner.global.Status;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FacilityInstructorRepository extends JpaRepository<FacilityInstructor, Long> {

    @Query("SELECT i FROM FacilityInstructor i " +
            "WHERE i.facility.id = :facilityId " +
            "AND i.facility.status = :facilityStatus " +
            "AND i.facility.apartment.id = :apartmentId " +
            "AND i.status = :instructorStatus")
    List<FacilityInstructor> findActiveInstructorsForActiveFacility(
            @Param("facilityId") Long facilityId,
            @Param("apartmentId") Long apartmentId,
            @Param("facilityStatus") Status facilityStatus,
            @Param("instructorStatus") Status instructorStatus);

    List<FacilityInstructor> findByFacilityId(Long facilityId);

    @Query("SELECT i FROM FacilityInstructor i " +
            "WHERE i.id = :instructorId " +
            "AND i.facility.id = :facilityId " +
            "AND i.facility.apartment.id = :apartmentId " +
            "AND i.status = :instructorStatus " +
            "AND i.facility.status = :facilityStatus")
    Optional<FacilityInstructor> findActiveInstructor(
            @Param("instructorId") Long instructorId,
            @Param("facilityId") Long facilityId,
            @Param("apartmentId") Long apartmentId,
            @Param("instructorStatus") Status instructorStatus,
            @Param("facilityStatus") Status facilityStatus
    );

}
