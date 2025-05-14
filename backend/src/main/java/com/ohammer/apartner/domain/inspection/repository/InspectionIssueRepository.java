package com.ohammer.apartner.domain.inspection.repository;

import com.ohammer.apartner.domain.inspection.entity.InspectionIssue;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InspectionIssueRepository extends JpaRepository<InspectionIssue, Long> {
}
