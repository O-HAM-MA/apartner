package com.ohammer.apartner.domain.facility.service;

import com.ohammer.apartner.domain.facility.dto.request.InstructorCreateRequestDto;
import com.ohammer.apartner.domain.facility.dto.request.InstructorUpdateRequestDto;
import com.ohammer.apartner.domain.facility.dto.response.InstructorSimpleResponseDto;
import com.ohammer.apartner.domain.facility.entity.Facility;
import com.ohammer.apartner.domain.facility.entity.FacilityInstructor;
import com.ohammer.apartner.domain.facility.repository.FacilityInstructorRepository;
import com.ohammer.apartner.domain.facility.repository.FacilityRepository;
import com.ohammer.apartner.global.Status;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FacilityInstructorService {

    private final FacilityRepository facilityRepository;
    private final FacilityInstructorRepository facilityInstructorRepository;

    // 강사 등록
    @Transactional
    public Long createInstructor(Long facilityId, Long apartmentId,
                                 InstructorCreateRequestDto instructorCreateRequestDto) {
        Facility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new EntityNotFoundException("시설을 찾을 수 없습니다."));

        if (!facility.getApartment().getId().equals(apartmentId)) {
            throw new IllegalArgumentException("본인 아파트의 시설에만 강사를 등록할 수 있습니다.");
        }

        if (facility.getStatus() != Status.ACTIVE) {
            throw new IllegalStateException("운영 중인 시설에만 강사를 등록할 수 있습니다.");
        }

        FacilityInstructor instructor = FacilityInstructor.builder()
                .name(instructorCreateRequestDto.getName())
                .description(instructorCreateRequestDto.getDescription())
                .facility(facility)
                .status(FacilityInstructor.Status.ACTIVE)
                .build();

        facilityInstructorRepository.save(instructor);

        return instructor.getId();
    }

    // 강사 정보 수정
    @Transactional
    public void updateInstructor(Long facilityId, Long instructorId, Long apartmentId,
                                 InstructorUpdateRequestDto instructorUpdateRequestDto) {
        FacilityInstructor instructor = facilityInstructorRepository.findById(instructorId)
                .orElseThrow(() -> new EntityNotFoundException("강사를 찾을 수 없습니다."));

        Facility facility = instructor.getFacility();
        if (!facility.getId().equals(facilityId)) {
            throw new IllegalArgumentException("해당 시설에 소속된 강사가 아닙니다.");
        }
        if (!facility.getApartment().getId().equals(apartmentId)) {
            throw new IllegalArgumentException("본인 아파트의 시설에만 강사 정보를 수정할 수 있습니다.");
        }
        if (facility.getStatus() != Status.ACTIVE) {
            throw new IllegalStateException("운영 중인 시설에만 강사 정보를 수정할 수 있습니다.");
        }
        if (instructor.getStatus() != FacilityInstructor.Status.ACTIVE) {
            throw new IllegalStateException("재직 중인 강사만 수정할 수 있습니다.");
        }

        instructor.setName(instructorUpdateRequestDto.getName());
        instructor.setDescription(instructorUpdateRequestDto.getDescription());
        instructor.setModifiedAt(LocalDateTime.now());
    }

    // 강사 삭제 (비활성화)
    @Transactional
    public void deleteInstructor(Long facilityId, Long instructorId, Long apartmentId) {
        FacilityInstructor instructor = facilityInstructorRepository.findById(instructorId)
                .orElseThrow(() -> new EntityNotFoundException("강사를 찾을 수 없습니다."));

        Facility facility = instructor.getFacility();
        if (!facility.getId().equals(facilityId)) {
            throw new IllegalArgumentException("해당 시설에 소속된 강사가 아닙니다.");
        }
        if (!facility.getApartment().getId().equals(apartmentId)) {
            throw new IllegalArgumentException("본인 아파트의 시설에만 강사 삭제가 가능합니다.");
        }
        if (instructor.getStatus() == FacilityInstructor.Status.INACTIVE) {
            throw new IllegalStateException("이미 비활성화된 강사입니다.");
        }

        instructor.setStatus(FacilityInstructor.Status.INACTIVE);
        instructor.setModifiedAt(LocalDateTime.now());
    }

    // 강사 목록 조회
    @Transactional(readOnly = true)
    public List<InstructorSimpleResponseDto> getInstructorList(Long facilityId, Long apartmentId) {
        List<FacilityInstructor> instructors =
                facilityInstructorRepository.findActiveInstructorsForActiveFacility(facilityId, apartmentId);

        return instructors.stream()
                .map(i -> InstructorSimpleResponseDto.builder()
                        .instructorId(i.getId())
                        .name(i.getName())
                        .description(i.getDescription())
                        .build())
                .collect(Collectors.toList());
    }

}
