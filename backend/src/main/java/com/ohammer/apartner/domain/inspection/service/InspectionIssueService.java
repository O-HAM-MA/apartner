package com.ohammer.apartner.domain.inspection.service;

import com.ohammer.apartner.domain.inspection.dto.InspectionIssueDto;
import com.ohammer.apartner.domain.inspection.dto.IssueResponseDetailDto;
import com.ohammer.apartner.domain.inspection.entity.Inspection;
import com.ohammer.apartner.domain.inspection.entity.InspectionIssue;
import com.ohammer.apartner.domain.inspection.entity.Result;
import com.ohammer.apartner.domain.inspection.repository.InspectionIssueRepository;
import com.ohammer.apartner.domain.inspection.repository.InspectionRepository;
import com.ohammer.apartner.global.service.AlarmService;
import com.ohammer.apartner.domain.user.entity.User;
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
    private final AlarmService alarmService;

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

        inspectionRepository.save(inspection);
        InspectionIssue saved = issueRepository.save(inspectionIssue);

        User user = inspection.getUser();
        if (user.getApartment() != null) {
            String message = "중요: " + user.getUserName() + "님이 점검 중 이슈를 발견했습니다: " + inspection.getTitle();
            alarmService.notifyUser(
                user.getId(),
                user.getApartment().getId(),
                "점검 이슈 발생",
                "warning",
                "INSPECTION_ISSUE",
                message,
                null,
                user.getId(),
                saved.getId(),
                null
            );
        }
        return saved;
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

        User user = issue.getUser();
        Inspection inspection = issue.getInspection();
        if (user.getApartment() != null) {
            String message = user.getUserName() + "님이 점검 이슈 내용을 수정했습니다: " + inspection.getTitle();
            alarmService.notifyUser(
                user.getId(),
                user.getApartment().getId(),
                "점검 이슈 수정",
                "warning",
                "INSPECTION_ISSUE_UPDATE",
                message,
                null,
                user.getId(),
                issue.getId(),
                null
            );
        }
    }
}
