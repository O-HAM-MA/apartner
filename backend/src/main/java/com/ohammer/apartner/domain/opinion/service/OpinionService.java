package com.ohammer.apartner.domain.opinion.service;

import com.ohammer.apartner.domain.opinion.dto.request.CreateManagerOpinionRequestDto;
import com.ohammer.apartner.domain.opinion.dto.response.AllManagerOpinionResponseDto;
import com.ohammer.apartner.domain.opinion.entity.Opinion;
import com.ohammer.apartner.domain.opinion.repository.OpinionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OpinionService {

    private final OpinionRepository opinionRepository;

    public Opinion createManagerOpinion(Long userId, CreateManagerOpinionRequestDto opinion) {

//        대충 유저 가져오는 로직
//        User user = user

        Opinion opinionEntity = Opinion.builder()
                .content(opinion.getContent())
//                .user(user)
                .type(Opinion.Type.REPRESENTATIVE)
                .build();

        return opinionRepository.save(opinionEntity);
    }

    public List<AllManagerOpinionResponseDto> getAllManagerOpinion(){

        List<Opinion> opinions = opinionRepository.findByType(Opinion.Type.REPRESENTATIVE);

        return opinions.stream().map(opinion -> AllManagerOpinionResponseDto.builder()
                        .title(opinion.getTitle())
//                        .user(user)

                        .build())
                        .collect(Collectors.toList());
    }
}
