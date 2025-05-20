package com.ohammer.apartner.domain.inspection.service;

import com.ohammer.apartner.domain.inspection.dto.InspectionRequestDto;
import com.ohammer.apartner.domain.inspection.dto.InspectionResponseDetailDto;
import com.ohammer.apartner.domain.inspection.dto.InspectionUpdateDto;
import com.ohammer.apartner.domain.inspection.entity.Inspection;
import com.ohammer.apartner.domain.inspection.entity.InspectionType;
import com.ohammer.apartner.domain.inspection.entity.Result;
import com.ohammer.apartner.domain.inspection.repository.InspectionRepository;
import com.ohammer.apartner.domain.inspection.repository.InspectionTypeRepository;
import com.ohammer.apartner.domain.user.entity.Role;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.user.repository.UserRepository;
import com.ohammer.apartner.global.Status;
import com.ohammer.apartner.security.utils.SecurityUtil;
import jakarta.persistence.criteria.CriteriaBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

//매니저가 아닌 유저의 자가점검 서비스
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InspectionUserService {
    private final InspectionService inspectionService;
    private final InspectionRepository inspectionRepository;
    private final InspectionTypeRepository inspectionTypeRepository;
    private final UserRepository userRepository;

    //자기꺼랑 매니저에 대한 공지사항 보기
    public List<InspectionResponseDetailDto>getAllInspectionWithUser() {
        Long userId = SecurityUtil.getOptionalCurrentUserId().orElseThrow();

        return  inspectionRepository.findByUserIdOrManager(userId, Role.MANAGER).stream()
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

    //자가 점검은 매니저의 그것과 다를 바가 없을 것 같은데
    //그래도 공지 없는 그건 해줘야지


    @Transactional
    public Inspection newUserInspectionSchedule (InspectionRequestDto dto) {
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
        return inspectionRepository.save(inspection);
    }

    //수정
    @Transactional
    public void updateInspectionUser(Long id, InspectionUpdateDto dto) {


        Inspection inspection = inspectionRepository.findById(id).orElseThrow();
        Long userId = SecurityUtil.getOptionalCurrentUserId().orElseThrow();

        if (inspection.getUser().getId() != userId)
            throw new RuntimeException("오직 본인만 수정/삭제가 가능합니다");

        inspection.setDetail(dto.getDetail());
        inspection.setStartAt(dto.getStartAt());
        inspection.setFinishAt(dto.getFinishAt());
        inspection.setModifiedAt(LocalDateTime.now());
        inspection.setTitle(dto.getTitle());

        inspection.setType(inspectionTypeRepository.findByTypeName(dto.getType()));

        inspection.setResult(inspectionService.findResult(dto.getResult()));

        inspectionRepository.save(inspection);
    }

    //삭제
    @Transactional
    public void deleteUserInspection(Long id) {

        Inspection inspection = inspectionRepository.findById(id).orElseThrow();
        Long userId = SecurityUtil.getOptionalCurrentUserId().orElseThrow();

        if (inspection.getUser().getId() != userId)
            throw new RuntimeException("오직 본인만 수정/삭제가 가능합니다");
        inspection.setStatus(Status.WITHDRAWN);
        inspectionRepository.save(inspection);
    }
}
