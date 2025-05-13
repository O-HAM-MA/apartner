package com.ohammer.apartner.domain.inspection.repository;

import com.ohammer.apartner.domain.inspection.entity.Inspection;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InspectionRepository extends JpaRepository<Inspection, Long> {
    boolean existsById(Long id);
}
