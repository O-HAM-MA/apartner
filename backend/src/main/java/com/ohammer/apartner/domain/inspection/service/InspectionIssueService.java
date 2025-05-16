package com.ohammer.apartner.domain.inspection.service;

import com.ohammer.apartner.domain.inspection.dto.IssueResponseDetailDto;
import com.ohammer.apartner.domain.inspection.entity.Inspection;
import com.ohammer.apartner.domain.inspection.entity.InspectionIssue;
import com.ohammer.apartner.domain.inspection.repository.InspectionIssueRepository;
import com.ohammer.apartner.domain.inspection.repository.InspectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InspectionIssueService {
    private final InspectionIssueRepository issueRepository;
    private final InspectionRepository inspectionRepository;
    private final InspectionService inspectionService;

    //생성
    @Transactional
    public InspectionIssue makeInspectionIssue(Long id, String description) {
        Inspection inspection = inspectionRepository.findById(id).orElseThrow();

        InspectionIssue inspectionIssue = InspectionIssue.builder()
                .inspection(inspection)
                .user(inspection.getUser())
                .description(description)
                .createdAt(LocalDateTime.now())
                .modifiedAt(null)
                .build();

        inspectionService.IssueInspection(id);
        return issueRepository.save(inspectionIssue);
    }

    //조회(전체조회는 굳이 없어도 될듯)
    public IssueResponseDetailDto showInspectionIssue(Long id) {
        InspectionIssue issue = issueRepository.findById(id).orElseThrow();
        Inspection inspection = issue.getInspection();

        return new IssueResponseDetailDto(issue.getId(),
                inspection.getId(),
                issue.getUser().getId(),
                issue.getUser().getUserName(),
                inspection.getTitle(),
                inspection.getType().getTypeName(),
                issue.getDescription(),
                issue.getCreatedAt(),
                issue.getModifiedAt()
                );
    }

    //수정
    @Transactional
    public void updateInspectionIssue(Long id, String description) {
        InspectionIssue issue = issueRepository.findById(id).orElseThrow();
        issue.setDescription(description);

        issueRepository.save(issue);
    }
}
