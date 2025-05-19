package com.ohammer.apartner.domain.opinion.controller;

import com.ohammer.apartner.domain.opinion.dto.request.CreateManagerOpinionRequestDto;
import com.ohammer.apartner.domain.opinion.dto.response.AllManagerOpinionResponseDto;
import com.ohammer.apartner.domain.opinion.entity.Opinion;
import com.ohammer.apartner.domain.opinion.service.OpinionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/opinion")
public class OpinionController {

    private final OpinionService opinionService;

    @PostMapping("/manager")
    public ResponseEntity<?> addManagerOpinion(@RequestBody CreateManagerOpinionRequestDto requestDto) throws AccessDeniedException {

        CreateManagerOpinionRequestDto response = opinionService.createManagerOpinion(requestDto);

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/manager")
    public ResponseEntity<?> getManagerOpinion() throws AccessDeniedException {

        List<AllManagerOpinionResponseDto> response = opinionService.getAllManagerOpinion();

        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
