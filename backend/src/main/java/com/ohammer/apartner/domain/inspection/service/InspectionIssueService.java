package com.ohammer.apartner.domain.inspection.service;

import com.ohammer.apartner.domain.inspection.dto.InspectionIssueDto;
import com.ohammer.apartner.domain.inspection.dto.IssueResponseDetailDto;
import com.ohammer.apartner.domain.inspection.entity.Inspection;
import com.ohammer.apartner.domain.inspection.entity.InspectionIssue;
import com.ohammer.apartner.domain.inspection.entity.Result;
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
    public InspectionIssue makeInspectionIssue(Long id, InspectionIssueDto dto) {
        Inspection inspection = inspectionRepository.findById(id).orElseThrow();
        if (!inspectionService.itIsYou(inspection))
            throw new RuntimeException("본인만 이슈 생성이 가능합니다");
        inspection.setResult(Result.ISSUE);

        InspectionIssue inspectionIssue = InspectionIssue.builder()
                .inspection(inspection)
                .user(inspection.getUser())
                .description(dto.getDescription())
                .createdAt(LocalDateTime.now())
                .modifiedAt(LocalDateTime.now())
                .build();

        // inspectionService.IssueInspection(inspection, dto);
        inspectionRepository.save(inspection);
        return issueRepository.save(inspectionIssue);
    }

    //조회
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
