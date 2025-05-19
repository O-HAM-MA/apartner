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
@RequestMapping("/api/v1/complaint")
@RequiredArgsConstructor
@Tag(name = "민원 관리 API")
public class ComplaintController {

    private final ComplaintService complaintService;

    @GetMapping("/all/complaint")
    @Operation(
            summary = "유저의 민원들을 가져오는 기능",
            description = "유저의 Id를 통해 유저의 민원들을 가져오는 기능",
            tags = "민원 관리 API"
    )
    public ResponseEntity<?> getAllComplaint() throws AccessDeniedException {

        List<AllComplaintResponseDto> response = complaintService.getAllMyComplaints();

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/all/complaint/manager")
    @Operation(
            summary = "매니저 혹은 최고 관리자가 유저들의 민원을 가져오는 기능",
            description = "매니저 혹은 최고 관리자가 유저들의 민원을 가져오는 기능",
            tags = "민원 관리 API"
    )
    public ResponseEntity<?> getAllComplaintByManager() throws AccessDeniedException {
        List<AllComplaintResponseDto> response = complaintService.getAllComplaints();

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    // 유저 ID는 임시
    @PostMapping("/create")
    @Operation(
            summary = "유저의 민원을 생성하는 기능",
            description = "유저가 입력한 정보를 기반으로 민원을 생성하는 기능",
            tags = "민원 관리 API"
    )
    public ResponseEntity<?> createComplaint(@RequestBody CreateComplaintRequestDto requestDto) {

        CreateComplaintRequestDto response = complaintService.createComplaint(requestDto);

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PatchMapping("/update/{complaintId}")
    @Operation(
            summary = "유저의 민원을 수정하는 기능",
            description = "유저가 입력한 정보를 기반으로 민원을 수정하는 기능",
            tags = "민원 관리 API"
    )
    public ResponseEntity<?> updateComplaint(@PathVariable(name = "complaintId") Long complaintId, @RequestBody CreateComplaintRequestDto requestDto) throws AccessDeniedException {
        CreateComplaintRequestDto response = complaintService.updateComplaint(requestDto,complaintId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    // status를 뭐로 받을지는 생각해봐야할듯 숫자 or 문자열
    @PatchMapping("/update/status/{complainId}/{status}")
    @Operation(
            summary = "유저의 민원 상태를 수정하는 기능",
            description = "매니저가 민원 처리 여부에 따른 상태 변경을 위한 기능",
            tags = "민원 관리 API"
    )
    public ResponseEntity<?> updateComplaintStatus(@PathVariable(name = "complainId") Long complainId, @PathVariable(name = "status") Long status) throws Exception {

        UpdateComplaintStatusResponseDto response = complaintService.updateStatus(complainId, status);

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/delete/{complainId}")
    @Operation(
            summary = "유저의 민원을 삭제하는 기능",
            description = "선택한 민원을 삭제하는 기능",
            tags = "민원 관리 API"
    )
    public ResponseEntity<?> deleteComplaint(
            @PathVariable(name = "complainId")
            Long complainId){
        complaintService.deleteComplaint(complainId);
        return new ResponseEntity<>("민원이 삭제되었습니다.",HttpStatus.OK);
    }



}
