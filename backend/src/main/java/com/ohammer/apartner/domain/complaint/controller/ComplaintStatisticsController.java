package com.ohammer.apartner.domain.complaint.controller;

import com.ohammer.apartner.domain.complaint.dto.response.ComplaintCountByStatusResponseDto;
import com.ohammer.apartner.domain.complaint.dto.response.ComplaintHandlingRateResponseDto;
import com.ohammer.apartner.domain.complaint.dto.response.TodayComplaintResponseDto;
import com.ohammer.apartner.domain.complaint.service.ComplaintStatisticsService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/complaints/statistics")
@RequiredArgsConstructor
public class ComplaintStatisticsController {

    private final ComplaintStatisticsService complaintStatisticsService;

    @GetMapping("/today")
    @Operation(summary = "일별 민원 수 조회", description = "일별 민원 수, 상태 조회")
    public ResponseEntity<?> getTodayStats() throws AccessDeniedException {

        List<TodayComplaintResponseDto> response = complaintStatisticsService.getTodayComplaintStats();

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/status")
    @Operation(summary = "상태별 처리수 조회", description = "상태별 처리수 조회")
    public ResponseEntity<?> getComplaintStatus() throws AccessDeniedException {

        List<ComplaintCountByStatusResponseDto> response = complaintStatisticsService.getComplainsGroupByStatus();

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/handling-rate")
    @Operation(summary = "민원 처리율 조회", description = "전체 민원 중 처리 완료된 민원의 비율을 반환")
    public ResponseEntity<ComplaintHandlingRateResponseDto> getComplaintHandlingRate() throws AccessDeniedException {

        ComplaintHandlingRateResponseDto response = complaintStatisticsService.getComplaintHandlingRate();

        return new ResponseEntity<>(response, HttpStatus.OK);
    }


}
