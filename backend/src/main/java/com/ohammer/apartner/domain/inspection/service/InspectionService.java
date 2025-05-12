package com.ohammer.apartner.domain.inspection.service;

import com.ohammer.apartner.domain.inspection.dto.InspectionRequestDto;
import com.ohammer.apartner.domain.inspection.dto.InspectionUpdateDto;
import com.ohammer.apartner.domain.inspection.entity.Inspection;
import com.ohammer.apartner.domain.inspection.entity.InspectionType;
import com.ohammer.apartner.domain.inspection.entity.Result;
import com.ohammer.apartner.domain.inspection.repository.InspectionRepository;
import com.ohammer.apartner.domain.inspection.repository.InspectionTypeRepository;
import com.ohammer.apartner.domain.opinion.entity.Opinion;
import com.ohammer.apartner.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class InspectionService {
    private final InspectionRepository inspectionRepository;
    private final InspectionTypeRepository inspectionTypeRepository;
    private final UserRepository userRepository;
    //대충 유저 리포지토리가 있다고 가정

    public Result findResult(String result) {
        switch (result) {
            case "CHECKED":
                return Result.CHECKED;
            case "PENDING":
                return Result.PENDING;
            case "NOTYET":
                return Result.NOTYET;
        }
        return null;
    }

    //입력(TODO : 이따가 리턴 타입과 값을 dto로 바꾸셈)
    @Transactional
    public Inspection newInspectionSchedule (InspectionRequestDto dto) {
        //대충 유저 찾기
        InspectionType type = inspectionTypeRepository.findByTypeName(dto.getType());

        Inspection inspection = Inspection.builder()
                //TODO : 유저추가
                .startAt(dto.getStartAt())
                .finishAt(dto.getFinishAt())
                .detail(dto.getDetail())
                .type(type)
                .result(Result.PENDING)
                .modifiedAt(null)
                .createdAt(LocalDateTime.now())
                .build();
        return inspectionRepository.save(inspection);
    }

    //전부 조회
    public List<Inspection> showAllInspections() {
        //일단 페이징까지는 패스

        return inspectionRepository.findAll();
    }

    //상세조회
    public Inspection findInspection(Long id) {
        return inspectionRepository.findById(id).orElseThrow();
    }

    //수정, 결과입력?
    @Transactional
    public String updateInspection(Long id, InspectionUpdateDto dto) {
        Inspection inspection = inspectionRepository.findById(id).orElseThrow();
        inspection.setDetail(dto.getDetail());
        inspection.setStartAt(dto.getStartAt());
        inspection.setFinishAt(dto.getFinishAt());
        inspection.setModifiedAt(LocalDateTime.now());

        inspection.setType(inspectionTypeRepository.findByTypeName(dto.getType()));

        inspectionRepository.save(inspection);
        return "ok";
    }

    //삭제
    @Transactional
    public void deleteInspection(Long id) {
        inspectionRepository.deleteById(id);
    }

}
