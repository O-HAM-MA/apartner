package com.ohammer.apartner.domain.complaint.controller;

import com.ohammer.apartner.domain.complaint.dto.request.CreateComplaintFeedbackRequestDto;
import com.ohammer.apartner.domain.complaint.dto.request.UpdateComplaintFeedbackRequestDto;
import com.ohammer.apartner.domain.complaint.dto.response.AllComplaintFeedbackResponseDto;
import com.ohammer.apartner.domain.complaint.entity.ComplaintFeedback;
import com.ohammer.apartner.domain.complaint.service.ComplaintFeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/complaint-feedbacks")
@RequiredArgsConstructor
@Tag(name = "민원 피드백 관리 API")
public class ComplaintFeedbackController {

    private final ComplaintFeedbackService complaintFeedbackService;

    @GetMapping
    @Operation(
            summary = "민원에 대한 피드백 목록 조회",
            description = "해당 민원 ID로 모든 피드백을 조회합니다",
            tags = "민원 피드백 관리 API"
    )
    public ResponseEntity<?> getComplaintFeedback(@PathVariable(name = "complaintId") Long complaintId) throws AccessDeniedException {

        List<AllComplaintFeedbackResponseDto> response = complaintFeedbackService.findComplaintFeedbackByComplaintId(complaintId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping
    @Operation(
            summary = "민원 피드백 생성",
            description = "민원에 대한 새로운 피드백을 저장합니다",
            tags = "민원 피드백 관리 API"
    )
    public ResponseEntity<?> saveComplaintFeedback(@RequestBody CreateComplaintFeedbackRequestDto complaintFeedbackRequestDto) {

        CreateComplaintFeedbackRequestDto response = complaintFeedbackService.save(complaintFeedbackRequestDto);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PutMapping("/{feedbackId}")
    @Operation(
            summary = "민원 피드백 수정",
            description = "기존 민원 피드백을 수정합니다",
            tags = "민원 피드백 관리 API"
    )
    public ResponseEntity<?> updateComplaintFeedback(@PathVariable(name = "feedbackId") Long feedbackId, @RequestBody UpdateComplaintFeedbackRequestDto complaintFeedbackRequestDto) throws Exception {

        UpdateComplaintFeedbackRequestDto response = complaintFeedbackService.updateComplaintFeedback(feedbackId,complaintFeedbackRequestDto);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/{feedbackId}")
    @Operation(
            summary = "민원 피드백 삭제",
            description = "특정 피드백 ID를 가진 민원 피드백을 삭제합니다",
            tags = "민원 피드백 관리 API"
    )
    public ResponseEntity<?> deleteComplaintFeedback(@PathVariable(name = "feedbackId") Long feedbackId) throws Exception {
        complaintFeedbackService.deleteComplainFeedback(feedbackId);
        return new ResponseEntity<>(HttpStatus.OK);
    }
}
