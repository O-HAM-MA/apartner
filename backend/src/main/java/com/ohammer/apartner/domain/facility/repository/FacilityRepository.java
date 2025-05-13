package com.ohammer.apartner.domain.facility.repository;

import com.ohammer.apartner.domain.facility.entity.Facility;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FacilityRepository extends JpaRepository<Facility, Long> {
}
