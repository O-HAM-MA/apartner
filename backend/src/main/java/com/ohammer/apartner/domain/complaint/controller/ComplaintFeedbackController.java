package com.ohammer.apartner.domain.complaint.controller;

import com.ohammer.apartner.domain.complaint.dto.request.CreateComplaintFeedbackRequestDto;
import com.ohammer.apartner.domain.complaint.dto.response.AllComplaintFeedbackResponseDto;
import com.ohammer.apartner.domain.complaint.entity.ComplaintFeedback;
import com.ohammer.apartner.domain.complaint.service.ComplaintFeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/complaint/feedback")
@RequiredArgsConstructor
@Tag(name = "민원 피드백 관리 컨트롤러")
public class ComplaintFeedbackController {

    private final ComplaintFeedbackService complaintFeedbackService;

    @GetMapping("/{complaintId}")
    @Operation(
            summary = "민원에 대한 피드백을 읽어오는 기능",
            description = "해당 민원에 맞는 피드백을 전부 읽어 제공하는 기능",
            tags = "민원 피드백 관리 컨트롤러"
    )
    public ResponseEntity<?> getComplaintFeedback(@PathVariable Long complaintId) {

        List<AllComplaintFeedbackResponseDto> response = complaintFeedbackService.findComplaintFeedbackByComplaintId(complaintId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/save")
    @Operation(
            summary = "민원에 대한 피드백을 저장하는 기능",
            description = "입력된 피드백을 DB에 저장하는 기능",
            tags = "민원 피드백 관리 컨트롤러"
    )
    public ResponseEntity<?> saveComplaintFeedback(@RequestBody CreateComplaintFeedbackRequestDto complaintFeedbackRequestDto) {

        ComplaintFeedback response = complaintFeedbackService.save(complaintFeedbackRequestDto);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PatchMapping("/update/{feedbackId}")
    @Operation(
            summary = "민원 피드백을 수정하는 기능",
            description = "민원에 대한 피드백을 수정하는 기능",
            tags = "민원 피드백 관리 컨트롤러"
    )
    public ResponseEntity<?> updateComplaintFeedback(@PathVariable Long feedbackId, @RequestBody CreateComplaintFeedbackRequestDto complaintFeedbackRequestDto) {

        ComplaintFeedback response = complaintFeedbackService.updateComplaintFeedback(feedbackId,complaintFeedbackRequestDto);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/delete/{feedbackId}")
    public ResponseEntity<?> deleteComplaintFeedback(@PathVariable Long feedbackId) {
        complaintFeedbackService.deleteComplainFeedback(feedbackId);
        return new ResponseEntity<>(HttpStatus.OK);
    }
}
