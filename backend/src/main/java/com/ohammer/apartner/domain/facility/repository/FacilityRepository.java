package com.ohammer.apartner.domain.facility.repository;

import com.ohammer.apartner.domain.facility.entity.Facility;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FacilityRepository extends JpaRepository<Facility, Long> {

    boolean existsByApartmentIdAndName(Long apartmentId, String name);

    // 시설명 중복 체크(수정 시 자기 자신 제외)
    boolean existsByApartmentIdAndNameAndIdNot(Long apartmentId, String name, Long facilityId);

    // 아파트별 시설 목록
    List<Facility> findByApartmentId(Long apartmentId);
}
