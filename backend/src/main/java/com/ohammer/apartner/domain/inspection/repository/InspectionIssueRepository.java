package com.ohammer.apartner.domain.inspection.repository;

import com.ohammer.apartner.domain.inspection.entity.InspectionIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface InspectionIssueRepository extends JpaRepository<InspectionIssue, Long> {
    //점검 id가 들어있는 이슈 id가 있는지 없는지 확인
    boolean existsByInspectionId(Long inspectionId);

}
