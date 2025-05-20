package com.ohammer.apartner.domain.opinion.controller;

import com.ohammer.apartner.domain.opinion.dto.request.CreateOpinionReplyRequestDto;
import com.ohammer.apartner.domain.opinion.dto.request.UpdateOpinionReplyRequestDto;
import com.ohammer.apartner.domain.opinion.dto.response.CreateOpinionReplyResponseDto;
import com.ohammer.apartner.domain.opinion.dto.response.OpinionReplyResponseDto;
import com.ohammer.apartner.domain.opinion.dto.response.UpdateOpinionReplyResponseDto;
import com.ohammer.apartner.domain.opinion.service.OpinionReplyService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/opinion/reply")
@RequiredArgsConstructor
@Tag(name = "의견 답변 API")
public class OpinionReplyController {

    private final OpinionReplyService opinionReplyService;

    @GetMapping("/{opinionId}")
    public ResponseEntity<?> getOpinionReply(@PathVariable Long opinionId) {

        List<OpinionReplyResponseDto> response = opinionReplyService.getOpinionReply(opinionId);

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/{opinionId}")
    public ResponseEntity<?> createOpinionReply(@PathVariable Long opinionId, @RequestBody CreateOpinionReplyRequestDto requestDto) throws AccessDeniedException {

        CreateOpinionReplyResponseDto response = opinionReplyService.saveOpinionReply(opinionId, requestDto);

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{replyId}")
    public ResponseEntity<?> updateOpinionReply(@PathVariable Long replyId, @RequestBody UpdateOpinionReplyRequestDto requestDto) throws Exception {

        UpdateOpinionReplyResponseDto response = opinionReplyService.updateOpinionReply(replyId, requestDto);

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/{replyId}")
    public ResponseEntity<?> deleteOpinionReply(@PathVariable Long replyId) throws Exception {

        opinionReplyService.deleteOpinionReply(replyId);

        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

}
