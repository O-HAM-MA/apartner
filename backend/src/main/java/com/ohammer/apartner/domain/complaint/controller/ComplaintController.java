package com.ohammer.apartner.domain.complaint.controller;

import com.ohammer.apartner.domain.complaint.dto.request.CreateComplaintRequestDto;
import com.ohammer.apartner.domain.complaint.dto.response.AllComplaintResponseDto;
import com.ohammer.apartner.domain.complaint.entity.Complaint;
import com.ohammer.apartner.domain.complaint.service.ComplaintService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/complaint")
@RequiredArgsConstructor
@Tag(name = "민원 관리 컨트롤러")
public class ComplaintController {

    private final ComplaintService complaintService;

    @GetMapping("/all/complaint/{userId}")
    @Operation(
            summary = "유저의 민원들을 가져오는 기능",
            description = "유저의 Id를 통해 유저의 민원들을 가져오는 기능",
            tags = "민원 관리 컨트롤러"
    )
    public ResponseEntity<?> getAllComplaint(@PathVariable Long userId) {

        List<AllComplaintResponseDto> response = complaintService.getAllMyComplaints(userId);

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    // 유저 ID는 임시
    @PostMapping("/create/{userId}")
    @Operation(
            summary = "유저의 민원을 생성하는 기능",
            description = "유저가 입력한 정보를 기반으로 민원을 생성하는 기능",
            tags = "민원 관리 컨트롤러"
    )
    public ResponseEntity<?> createComplaint(@RequestBody CreateComplaintRequestDto requestDto, @PathVariable Long userId) {

        Complaint response = complaintService.createComplaint(userId, requestDto);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PatchMapping("/update/{userId}")
    @Operation(
            summary = "유저의 민원을 수정하는 기능",
            description = "유저가 입력한 정보를 기반으로 민원을 수정하는 기능",
            tags = "민원 관리 컨트롤러"
    )
    public ResponseEntity<?> updateComplaint(@RequestBody CreateComplaintRequestDto requestDto, @PathVariable Long userId){
        Complaint response = complaintService.createComplaint(userId, requestDto);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/delete/{complainId}/{userId}")
    @Operation(
            summary = "유저의 민원을 수정하는 기능",
            description = "유저가 입력한 정보를 기반으로 민원을 수정하는 기능",
            tags = "민원 관리 컨트롤러"
    )
    public ResponseEntity<?> deleteComplaint(@PathVariable Long complainId, @PathVariable Long userId){
        complaintService.deleteComplaint(complainId, userId);
        return new ResponseEntity<>(HttpStatus.OK);
    }



}
