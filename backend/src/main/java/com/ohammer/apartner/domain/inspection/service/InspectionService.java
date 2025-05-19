package com.ohammer.apartner.domain.inspection.service;

import com.ohammer.apartner.domain.inspection.dto.InspectionRequestDto;
import com.ohammer.apartner.domain.inspection.dto.InspectionResponseDetailDto;
import com.ohammer.apartner.domain.inspection.dto.InspectionUpdateDto;
import com.ohammer.apartner.domain.inspection.entity.Inspection;
import com.ohammer.apartner.domain.inspection.entity.InspectionType;
import com.ohammer.apartner.domain.inspection.entity.Result;
import com.ohammer.apartner.domain.inspection.repository.InspectionRepository;
import com.ohammer.apartner.domain.inspection.repository.InspectionTypeRepository;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.user.repository.UserRepository;
import com.ohammer.apartner.global.Status;
import com.ohammer.apartner.security.CustomUserDetailsService;
import com.ohammer.apartner.security.utils.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

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
            case "ISSUE":
                return Result.ISSUE;
            case"NOTYET":
                return Result.NOTYET;
        }
        return null;
    }

    @Transactional
    public Inspection newInspectionSchedule (InspectionRequestDto dto) {
        //대충 유저 찾기
        //원래 통으로 객체를 찾을까 싶었는데, 도용?의 문제가 있을 것 같아서 효율성 깎고 id뽑아서 찾아오는걸루
        Long userId = SecurityUtil.getOptionalCurrentUserId().orElseThrow();

        User user = userRepository.findById(userId).get();

        InspectionType type = inspectionTypeRepository.findByTypeName(dto.getType());

        Inspection inspection = Inspection.builder()
                .user(user)
                .startAt(dto.getStartAt())
                .finishAt(dto.getFinishAt())
                .detail(dto.getDetail())
                .title(dto.getTitle())
                .type(type)
                .result(Result.PENDING)
                .modifiedAt(null)
                .createdAt(LocalDateTime.now())
                .status(Status.ACTIVE)
                .build();
        //TODO 나중에 공지 추가되면 공지에 넣는것도 추가하기
        return inspectionRepository.save(inspection);
    }

    //전부 조회
    public List<InspectionResponseDetailDto> showAllInspections() {
        //TODO 일단 페이징까지는 패스
        return inspectionRepository.findAll().stream()
                 .map( r-> new InspectionResponseDetailDto(
                         r.getId(),
                         r.getUser().getId(),
                         r.getUser().getUserName(),
                         r.getStartAt(),
                         r.getFinishAt(),
                         r.getTitle(),
                         r.getDetail(),
                         r.getResult(),
                         r.getType().getTypeName()
                 ))
                 .toList();
    }

    //수정, 결과입력?
    //여기에 리턴이 필요할지도
    @Transactional
    public void updateInspection(Long id, InspectionUpdateDto dto) {
        Inspection inspection = inspectionRepository.findById(id).orElseThrow();
        inspection.setDetail(dto.getDetail());
        inspection.setStartAt(dto.getStartAt());
        inspection.setFinishAt(dto.getFinishAt());
        inspection.setModifiedAt(LocalDateTime.now());
        inspection.setTitle(dto.getTitle());

        inspection.setType(inspectionTypeRepository.findByTypeName(dto.getType()));

        inspection.setResult(findResult(dto.getResult()));

        inspectionRepository.save(inspection);
    }

    //삭제
    @Transactional
    public void deleteInspection(Long id) {
        Inspection inspection = inspectionRepository.findById(id).orElseThrow();
        inspection.setStatus(Status.WITHDRAWN);
        inspectionRepository.save(inspection);
        //inspectionRepository.deleteById(id);
    }


    //자료 자세히 보기
    @Transactional(readOnly = true)
    public InspectionResponseDetailDto showInspection(Long id) {

        Inspection inspection = inspectionRepository.findById(id).orElseThrow();
        User user = inspection.getUser();

        return new InspectionResponseDetailDto(inspection.getId(),
                user.getId(),
                user.getUserName(),
                inspection.getStartAt(),
                inspection.getFinishAt(),
                inspection.getTitle(),
                inspection.getDetail(),
                inspection.getResult(),
                inspection.getType().getTypeName());
    }


    //검사 완료
    @Transactional
    public void completeInspection(Long id) {
        if (!inspectionRepository.existsById(id))
            throw new RuntimeException("그거 없는댑쇼");
        Inspection inspection = inspectionRepository.findById(id).get();
        inspection.setResult(Result.CHECKED);

        inspectionRepository.save(inspection);
    }

    //이슈 변경
    @Transactional
    public void IssueInspection(Long id) {
        if (!inspectionRepository.existsById(id))
            throw new RuntimeException("그거 없는댑쇼");
        Inspection inspection = inspectionRepository.findById(id).get();
        inspection.setResult(Result.ISSUE);

        inspectionRepository.save(inspection);
    }


    // =========== 여기서 부턴 타입쪽 ===========

    //죄다 조회
    public List<InspectionType> showAllTypes() {
        return inspectionTypeRepository.findAll();
    }

    //추가
    @Transactional
    public InspectionType addType(String name) {
        if (inspectionTypeRepository.findByTypeName(name) != null)
            throw new RuntimeException("찾으려는 타입이 중복인뎁쇼");
        InspectionType inspectionType = InspectionType.builder()
                .typeName(name)
                .build();

        return inspectionTypeRepository.save(inspectionType);
    }

    //수정
    @Transactional
    public void removeType(Long id) {
        InspectionType type = inspectionTypeRepository.findById(id).orElseThrow();
        inspectionTypeRepository.delete(type);
    }




}
