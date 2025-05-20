package com.ohammer.apartner.domain.opinion.service;

import com.ohammer.apartner.domain.opinion.dto.request.CreateOpinionReplyRequestDto;
import com.ohammer.apartner.domain.opinion.dto.request.UpdateOpinionReplyRequestDto;
import com.ohammer.apartner.domain.opinion.dto.response.CreateOpinionReplyResponseDto;
import com.ohammer.apartner.domain.opinion.dto.response.OpinionReplyResponseDto;
import com.ohammer.apartner.domain.opinion.dto.response.UpdateOpinionReplyResponseDto;
import com.ohammer.apartner.domain.opinion.entity.Opinion;
import com.ohammer.apartner.domain.opinion.entity.OpinionReply;
import com.ohammer.apartner.domain.opinion.repository.OpinionReplyRepository;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.security.utils.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.file.AccessDeniedException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class OpinionReplyService {

    private final OpinionReplyRepository opinionReplyRepository;
    private final OpinionService opinionService;

    public List<OpinionReplyResponseDto> getOpinionReply(Long opinionId) {

        List<OpinionReply> opinionReplies = opinionReplyRepository.findByOpinionId(opinionId);

        return opinionReplies.stream().map(reply -> OpinionReplyResponseDto.builder()
                        .id(reply.getId())
                        .content(reply.getReply())
                        .userName(reply.getUser().getUserName())
                        .createdAt(reply.getCreatedAt())
                        .build()
                ).collect(Collectors.toList());
    }

    public CreateOpinionReplyResponseDto saveOpinionReply(Long opinionId, CreateOpinionReplyRequestDto createOpinionReplyRequestDto) throws AccessDeniedException {

        Opinion opinion = opinionService.getOpinionById(opinionId);

        User user = SecurityUtil.getCurrentUser();

        if (user == null) {
            throw new AccessDeniedException("로그인되지 않은 사용자입니다.");
        }

        OpinionReply opinionReply = OpinionReply.builder()
                .opinion(opinion)
                .reply(createOpinionReplyRequestDto.getReply())
                .user(user)
                .build();

        opinionReplyRepository.save(opinionReply);

        return CreateOpinionReplyResponseDto.builder()
                .id(opinionReply.getId())
                .createdAt(opinionReply.getCreatedAt())
                .reply(opinionReply.getReply())
                .userId(user.getId())
                .build();
    }


    public UpdateOpinionReplyResponseDto updateOpinionReply(Long replyId, UpdateOpinionReplyRequestDto updateOpinionReplyRequestDto) throws Exception {

        OpinionReply opinionReply = opinionReplyRepository.findById(replyId).orElse(null);

        if (opinionReply == null) {
            throw new Exception("해당하는 ID의 의견응답이 없습니다.");
        }

        User user = SecurityUtil.getCurrentUser();

        if (user == null) {
            throw new AccessDeniedException("로그인되지 않은 사용자입니다.");
        }

        // 관리자도 지욼 수 있다면 조금 수정해야할듯
        if(!user.getId().equals(opinionReply.getUser().getId())) {
            throw new Exception("의견 응답 작성자가 아닙니다.");
        }

        opinionReply.setReply(updateOpinionReplyRequestDto.getReply());

        opinionReplyRepository.save(opinionReply);

        return UpdateOpinionReplyResponseDto.builder()
                .id(opinionReply.getId())
                .createdAt(opinionReply.getCreatedAt())
                .reply(opinionReply.getReply())
                .userId(user.getId())
                .build();

    }

    public void deleteOpinionReply(Long replyId) throws Exception {

        OpinionReply opinionReply = opinionReplyRepository.findById(replyId).orElse(null);

        if (opinionReply == null) {
            throw new Exception("해당하는 ID의 의견응답이 없습니다.");
        }

        User user = SecurityUtil.getCurrentUser();

        if (user == null) {
            throw new AccessDeniedException("로그인되지 않은 사용자입니다.");
        }

        // 관리자도 지욼 수 있다면 조금 수정해야할듯
        if(!user.getId().equals(opinionReply.getUser().getId())) {
            throw new Exception("의견 응답 작성자가 아닙니다.");
        }

        opinionReplyRepository.deleteById(replyId);
    }
}
