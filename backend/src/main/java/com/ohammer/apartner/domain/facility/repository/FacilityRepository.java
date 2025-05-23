package com.ohammer.apartner.domain.facility.repository;

import com.ohammer.apartner.domain.facility.entity.Facility;
import com.ohammer.apartner.global.Status;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FacilityRepository extends JpaRepository<Facility, Long> {

    boolean existsByApartmentIdAndNameAndStatus(Long apartmentId, String name, Status status);

    // 시설명 중복 체크(수정 시 자기 자신 제외)
    boolean existsByApartmentIdAndNameAndIdNot(Long apartmentId, String name, Long facilityId);

    // 시설 목록 조회
    List<Facility> findByApartmentIdAndStatus(Long apartmentId, Status status);

    List<Facility> findByApartmentIdAndStatusAndNameContainingIgnoreCase(
            Long apartmentId, Status status, String name);
}
