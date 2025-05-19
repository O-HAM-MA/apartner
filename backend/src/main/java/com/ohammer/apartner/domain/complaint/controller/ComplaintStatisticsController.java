package com.ohammer.apartner.domain.complaint.controller;

import com.ohammer.apartner.domain.complaint.dto.response.TodayComplaintResponseDto;
import com.ohammer.apartner.domain.complaint.service.ComplaintStatisticsService;
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
    public ResponseEntity<?> getTodayStats() throws AccessDeniedException {

        List<TodayComplaintResponseDto> response = complaintStatisticsService.getTodayComplaintStats();

        return new ResponseEntity<>(response, HttpStatus.OK);
    }



}
