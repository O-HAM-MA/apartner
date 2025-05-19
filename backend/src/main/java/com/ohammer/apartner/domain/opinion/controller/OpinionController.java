package com.ohammer.apartner.domain.opinion.controller;

import com.ohammer.apartner.domain.opinion.dto.request.CreateManagerOpinionRequestDto;
import com.ohammer.apartner.domain.opinion.dto.response.AllManagerOpinionResponseDto;
import com.ohammer.apartner.domain.opinion.entity.Opinion;
import com.ohammer.apartner.domain.opinion.service.OpinionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/opinion")
@Tag(name = "의견 관리 API")
public class OpinionController {

    private final OpinionService opinionService;

    @PostMapping("/manager")
    @Operation(summary = "동 대표 의견 생성", description = "권한이 매니저인 유저의 의견 생성")
    public ResponseEntity<?> addManagerOpinion(@RequestBody CreateManagerOpinionRequestDto requestDto) throws AccessDeniedException {

        CreateManagerOpinionRequestDto response = opinionService.createManagerOpinion(requestDto);

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/manager")
    @Operation(summary = "동 대표 의견 목록 조회", description = "작성자의 권한이 매니저인 의견 목록 조회")
    public ResponseEntity<?> getManagerOpinion() throws AccessDeniedException {

        List<AllManagerOpinionResponseDto> response = opinionService.getAllManagerOpinion();

        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
