package com.ohammer.apartner.domain.inspection.repository;

import com.ohammer.apartner.domain.inspection.entity.Inspection;
import com.ohammer.apartner.domain.inspection.entity.InspectionIssue;
import com.ohammer.apartner.global.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InspectionIssueRepository extends JpaRepository<InspectionIssue, Long> {
    //점검 id가 들어있는 이슈 id가 있는지 없는지 확인
    boolean existsByInspectionId(Long inspectionId);

    List<InspectionIssue> findByInspection(Inspection inspection);

    @Query("SELECT i FROM InspectionIssue i WHERE i.inspection.status = :status")
    List<InspectionIssue> findAllByInspectionStatus(@Param("status") Status status);

}
