package com.ohammer.apartner.domain.inspection.repository;

import com.ohammer.apartner.domain.inspection.entity.InspectionType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InspectionTypeRepository extends JpaRepository<InspectionType, Long> {
    InspectionType findByTypeName(String typeName);

}
