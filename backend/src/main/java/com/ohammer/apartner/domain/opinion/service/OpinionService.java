package com.ohammer.apartner.domain.opinion.service;

import com.ohammer.apartner.domain.opinion.dto.request.CreateManagerOpinionRequestDto;
import com.ohammer.apartner.domain.opinion.dto.response.AllManagerOpinionResponseDto;
import com.ohammer.apartner.domain.opinion.dto.response.CreateManagerOpinionResponseDto;
import com.ohammer.apartner.domain.opinion.entity.Opinion;
import com.ohammer.apartner.domain.opinion.repository.OpinionRepository;
import com.ohammer.apartner.domain.user.entity.Role;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.security.utils.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.file.AccessDeniedException;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OpinionService {

    private final OpinionRepository opinionRepository;

    public CreateManagerOpinionResponseDto createManagerOpinion(CreateManagerOpinionRequestDto opinion) throws AccessDeniedException {

//        대충 유저 가져오는 로직
        User user = SecurityUtil.getCurrentUser();

        if (user == null) {
            throw new AccessDeniedException("로그인되지 않은 사용자입니다.");
        }

        Set<Role> userRoles = user.getRoles();

        boolean hasRequiredRole = userRoles.stream()
                .anyMatch(role -> role == Role.ADMIN || role == Role.MODERATOR);

        if (!hasRequiredRole) {
            throw new AccessDeniedException("의견을 생성할 권한이 없습니다.");
        }

        Opinion opinionEntity = Opinion.builder()
                .content(opinion.getContent())
                .user(user)
                .title(opinion.getTitle())
                .type(Opinion.Type.REPRESENTATIVE)
                .build();

        opinionRepository.save(opinionEntity);

        return CreateManagerOpinionResponseDto.builder()
                .id(opinionEntity.getId())
                .content(opinionEntity.getContent())
                .userId(user.getId())
                .title(opinionEntity.getTitle())
                .createdAt(opinionEntity.getCreatedAt())
                .build();
    }

    public List<AllManagerOpinionResponseDto> getAllManagerOpinion() throws AccessDeniedException {

        User user = SecurityUtil.getCurrentUser();

        if (user == null) {
            throw new AccessDeniedException("로그인되지 않은 사용자입니다.");
        }

        Set<Role> userRoles = user.getRoles();

        boolean hasRequiredRole = userRoles.stream()
                .anyMatch(role -> role == Role.ADMIN || role == Role.MODERATOR);

        if (!hasRequiredRole) {
            throw new AccessDeniedException("의견 목록을 조회할 권한이 없습니다.");
        }

        List<Opinion> opinions = opinionRepository.findByType(Opinion.Type.REPRESENTATIVE);

        return opinions.stream().map(opinion -> AllManagerOpinionResponseDto.builder()
                        .id(opinion.getId())
                        .title(opinion.getTitle())
                        .userName(opinion.getUser().getUserName())
                        .build())
                        .collect(Collectors.toList());
    }

    public Opinion getOpinionById(Long id) {
        return opinionRepository.findById(id).orElse(null);
    }
}
