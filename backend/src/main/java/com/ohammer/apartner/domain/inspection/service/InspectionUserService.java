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
import com.ohammer.apartner.global.service.AlarmService;
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
    private final AlarmService alarmService;

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
        Inspection saved = inspectionRepository.save(inspection);

        if (user.getApartment() != null) {
            String userMessage = "자가점검 일정이 등록되었습니다: " + dto.getTitle();
            alarmService.notifyUser(
                userId,
                user.getApartment().getId(),
                "자가점검 등록",
                "info",
                "SELF_INSPECTION_NEW",
                userMessage,
                null,
                userId,
                saved.getId(),
                null
            );
        }
        return saved;
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

        User user = inspection.getUser();
        if (user.getApartment() != null) {
            String userMessage = "자가점검 정보가 수정되었습니다: " + dto.getTitle();
            alarmService.notifyUser(
                userId,
                user.getApartment().getId(),
                "자가점검 수정",
                "info",
                "SELF_INSPECTION_UPDATE",
                userMessage,
                null,
                userId,
                inspection.getId(),
                null
            );
        }
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

        User user = inspection.getUser();
        if (user.getApartment() != null) {
            String userMessage = "자가점검 일정이 삭제되었습니다: " + inspection.getTitle();
            alarmService.notifyUser(
                userId,
                user.getApartment().getId(),
                "자가점검 삭제",
                "info",
                "SELF_INSPECTION_DELETE",
                userMessage,
                null,
                userId,
                null,
                null
            );
        }
    }
}
