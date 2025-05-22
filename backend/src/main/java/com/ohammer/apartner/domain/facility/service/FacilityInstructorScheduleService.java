package com.ohammer.apartner.domain.facility.service;

import com.ohammer.apartner.domain.facility.dto.request.InstructorScheduleCreateRequestDto;
import com.ohammer.apartner.domain.facility.entity.Facility;
import com.ohammer.apartner.domain.facility.entity.FacilityInstructor;
import com.ohammer.apartner.domain.facility.entity.FacilityInstructorSchedule;
import com.ohammer.apartner.domain.facility.repository.FacilityInstructorRepository;
import com.ohammer.apartner.domain.facility.repository.FacilityInstructorScheduleRepository;
import com.ohammer.apartner.domain.facility.repository.FacilityRepository;
import com.ohammer.apartner.global.Status;
import jakarta.persistence.EntityNotFoundException;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FacilityInstructorScheduleService {

    private final FacilityRepository facilityRepository;
    private final FacilityInstructorRepository facilityInstructorRepository;
    private final FacilityInstructorScheduleRepository facilityInstructorScheduleRepository;

    // 스케쥴 등록
    @Transactional
    public void createSchedules(Long apartmentId, Long facilityId, Long instructorId,
                                List<InstructorScheduleCreateRequestDto> scheduleDtos) {
        Facility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new EntityNotFoundException("시설을 찾을 수 없습니다."));

        if (!facility.getApartment().getId().equals(apartmentId)) {
            throw new IllegalArgumentException("본인 아파트의 시설에만 등록 가능");
        }
        if (facility.getStatus() != Status.ACTIVE) {
            throw new IllegalStateException("운영 중 시설에만 등록 가능");
        }

        FacilityInstructor instructor = facilityInstructorRepository.findById(instructorId)
                .orElseThrow(() -> new EntityNotFoundException("강사를 찾을 수 없습니다."));

        if (!instructor.getFacility().getId().equals(facilityId)) {
            throw new IllegalArgumentException("해당 시설의 강사가 아님");
        }
        if (instructor.getStatus() != FacilityInstructor.Status.ACTIVE) {
            throw new IllegalStateException("운영 중 강사에만 등록 가능");
        }

        for (InstructorScheduleCreateRequestDto dto : scheduleDtos) {
            if (dto.getCapacity() == null || dto.getCapacity() < 1) {
                throw new IllegalArgumentException("수용 인원(capacity)은 1 이상이어야 합니다.");
            }
            LocalTime current = dto.getStartTime();
            while (!current.plusMinutes(dto.getSlotMinutes()).isAfter(dto.getEndTime())) {
                FacilityInstructorSchedule schedule = FacilityInstructorSchedule.builder()
                        .instructor(instructor)
                        .dayOfWeek(DayOfWeek.valueOf(dto.getDayOfWeek()))
                        .startTime(current)
                        .endTime(current.plusMinutes(dto.getSlotMinutes()))
                        .capacity(dto.getCapacity())
                        .build();

                facilityInstructorScheduleRepository.save(schedule);
                current = current.plusMinutes(dto.getSlotMinutes());
            }
        }
    }

    // 스케쥴 삭제
    @Transactional
    public void deleteSchedule(Long apartmentId, Long facilityId, Long instructorId, Long scheduleId) {
        FacilityInstructorSchedule schedule = facilityInstructorScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("스케줄을 찾을 수 없습니다."));

        FacilityInstructor instructor = schedule.getInstructor();
        Facility facility = instructor.getFacility();

        if (!facility.getId().equals(facilityId) || !instructor.getId().equals(instructorId)) {
            throw new IllegalArgumentException("해당 강사/시설의 스케줄이 아닙니다.");
        }
        if (!facility.getApartment().getId().equals(apartmentId)) {
            throw new IllegalArgumentException("본인 아파트의 스케줄만 삭제할 수 있습니다.");
        }

        facilityInstructorScheduleRepository.delete(schedule);
    }

}