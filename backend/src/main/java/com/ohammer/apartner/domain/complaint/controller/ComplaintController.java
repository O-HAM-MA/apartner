package com.ohammer.apartner.domain.complaint.controller;

import com.ohammer.apartner.domain.complaint.dto.request.CreateComplaintRequestDto;
import com.ohammer.apartner.domain.complaint.dto.response.AllComplaintResponseDto;
import com.ohammer.apartner.domain.complaint.dto.response.UpdateComplaintStatusResponseDto;
import com.ohammer.apartner.domain.complaint.entity.Complaint;
import com.ohammer.apartner.domain.complaint.service.ComplaintService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.parameters.P;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/complaints")
@RequiredArgsConstructor
@Tag(name = "민원 관리 API")
public class ComplaintController {

    private final ComplaintService complaintService;

    @GetMapping
    @Operation(summary = "내 민원 목록 조회", description = "로그인한 유저의 민원 목록을 조회")
    public ResponseEntity<?> getAllComplaint() throws AccessDeniedException {

        List<AllComplaintResponseDto> response = complaintService.getAllMyComplaints();

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/manager")
    @Operation(summary = "모든 민원 목록 조회", description = "관리자 권한으로 전체 민원 목록을 조회")
    public ResponseEntity<?> getAllComplaintByManager() throws AccessDeniedException {
        List<AllComplaintResponseDto> response = complaintService.getAllComplaints();

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    // 유저 ID는 임시
    @PostMapping
    @Operation(summary = "민원 등록", description = "새로운 민원을 등록합니다")
    public ResponseEntity<?> createComplaint(@RequestBody CreateComplaintRequestDto requestDto) {

        CreateComplaintRequestDto response = complaintService.createComplaint(requestDto);

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PutMapping("/{complaintId}")
    @Operation(summary = "민원 수정", description = "민원 ID로 기존 민원을 수정합니다")
    public ResponseEntity<?> updateComplaint(@PathVariable(name = "complaintId") Long complaintId, @RequestBody CreateComplaintRequestDto requestDto) throws AccessDeniedException {
        CreateComplaintRequestDto response = complaintService.updateComplaint(requestDto,complaintId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    // status를 뭐로 받을지는 생각해봐야할듯 숫자 or 문자열
    @PatchMapping("/{complaintId}/status")
    @Operation(summary = "민원 상태 변경", description = "민원의 상태(PENDING, IN_PROGRESS 등)를 변경합니다")
    public ResponseEntity<?> updateComplaintStatus(@PathVariable(name = "complainId") Long complainId, @RequestParam(name = "status") Long status) throws Exception {

        UpdateComplaintStatusResponseDto response = complaintService.updateStatus(complainId, status);

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/{complaintId}")
    @Operation(summary = "민원 삭제", description = "민원 ID를 이용해 민원을 삭제합니다")
    public ResponseEntity<?> deleteComplaint(
            @PathVariable(name = "complainId")
            Long complainId){
        complaintService.deleteComplaint(complainId);
        return new ResponseEntity<>("민원이 삭제되었습니다.",HttpStatus.OK);
    }



}
