package com.ohammer.apartner.domain.facility.repository;

import com.ohammer.apartner.domain.facility.entity.Facility;
import com.ohammer.apartner.global.Status;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FacilityRepository extends JpaRepository<Facility, Long> {

    boolean existsByApartmentIdAndNameAndStatus(Long apartmentId, String name, Status status);

    // 시설명 중복 체크(active에서)
    boolean existsByApartmentIdAndNameAndStatusAndIdNot(Long apartmentId, String name, Status status, Long id);

    // 시설 목록 조회
    List<Facility> findByApartmentIdAndStatus(Long apartmentId, Status status);

    List<Facility> findByApartmentIdAndStatusAndNameContainingIgnoreCase(
            Long apartmentId, Status status, String name);

    // 시설 단건 조회
    Optional<Facility> findByIdAndApartmentId(Long id, Long apartmentId);
}
