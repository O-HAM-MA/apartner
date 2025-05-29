package com.ohammer.apartner.domain.facility.service;

import com.ohammer.apartner.domain.facility.dto.request.InstructorScheduleCreateRequestDto;
import com.ohammer.apartner.domain.facility.dto.response.InstructorScheduleSimpleResponseDto;
import com.ohammer.apartner.domain.facility.entity.Facility;
import com.ohammer.apartner.domain.facility.entity.FacilityInstructor;
import com.ohammer.apartner.domain.facility.entity.FacilityInstructorSchedule;
import com.ohammer.apartner.domain.facility.repository.FacilityInstructorRepository;
import com.ohammer.apartner.domain.facility.repository.FacilityInstructorScheduleRepository;
import com.ohammer.apartner.domain.facility.repository.FacilityRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;
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
    private final FacilityTimeSlotService facilityTimeSlotService;

    // 스케쥴 등록
    @Transactional
    public Long createSchedulesAndSlots(
            Long facilityId, Long instructorId, Long apartmentId,
            InstructorScheduleCreateRequestDto dto
    ) {
        Facility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new EntityNotFoundException("시설을 찾을 수 없습니다."));
        FacilityInstructor instructor = facilityInstructorRepository.findById(instructorId)
                .orElseThrow(() -> new EntityNotFoundException("강사를 찾을 수 없습니다."));
        if (!facility.getApartment().getId().equals(apartmentId) || !instructor.getFacility().getId()
                .equals(facilityId)) {
            throw new IllegalArgumentException("본인 아파트의 시설/강사만 관리 가능");
        }

        // 스케줄 시작~종료 시간이 모두 운영시간 범위 내에 있는지 체크
        LocalTime open = facility.getOpenTime();
        LocalTime close = facility.getCloseTime();
        LocalTime start = dto.getStartTime();
        LocalTime end = dto.getEndTime();

        boolean valid;
        if (open.isBefore(close)) {
            // 일반 운영(예: 09:00~23:00): "시작 >= open && 종료 <= close"
            valid = !start.isBefore(open) && !end.isAfter(close);
        } else {
            // 자정 넘김(예: 23:00~05:00): 둘 다 open~23:59 또는 00:00~close 안에 포함
            valid = (
                    (!start.isBefore(open) || start.equals(open)) || (!start.isAfter(close) || start.equals(close))
            ) && (
                    (!end.isBefore(open) || end.equals(open)) || (!end.isAfter(close) || end.equals(close))
            );
        }
        if (!valid) {
            throw new IllegalArgumentException(
                    "스케줄 시간은 시설 운영시간(" + open + "~" + close + ") 내에서만 등록할 수 있습니다.");
        }

        DayOfWeek dayOfWeek = DayOfWeek.valueOf(dto.getDayOfWeek());
        List<FacilityInstructorSchedule> schedules = facilityInstructorScheduleRepository.findByInstructorIdAndDayOfWeek(
                instructorId, dayOfWeek);
        for (FacilityInstructorSchedule s : schedules) {
            if (dto.getStartTime().isBefore(s.getEndTime()) && dto.getEndTime().isAfter(s.getStartTime())) {
                throw new IllegalArgumentException("해당 요일 시간대가 겹치는 스케줄이 이미 존재합니다.");
            }
        }

        FacilityInstructorSchedule schedule = FacilityInstructorSchedule.builder()
                .instructor(instructor)
                .scheduleName(dto.getScheduleName())
                .dayOfWeek(dayOfWeek)
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .capacity(dto.getCapacity())
                .slotMinutes(dto.getSlotMinutes())
                .build();
        facilityInstructorScheduleRepository.save(schedule);

        // 타임슬롯 row 자동 생성
        facilityTimeSlotService.createTimeSlots(
                facility,
                instructor,
                schedule,
                dto.getDayOfWeek(),
                dto.getStartTime(),
                dto.getEndTime(),
                dto.getSlotMinutes(),
                dto.getCapacity(),
                dto.getPeriodStart(),
                dto.getPeriodEnd()
        );
        return schedule.getId();
    }

    // 스케쥴 삭제
    @Transactional
    public void deleteSchedule(Long facilityId, Long instructorId, Long scheduleId, Long apartmentId) {
        FacilityInstructorSchedule schedule = facilityInstructorScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("스케줄을 찾을 수 없습니다."));
        if (!schedule.getInstructor().getId().equals(instructorId)
                || !schedule.getInstructor().getFacility().getId().equals(facilityId)
                || !schedule.getInstructor().getFacility().getApartment().getId().equals(apartmentId)) {
            throw new IllegalArgumentException("삭제 권한이 없습니다.");
        }
        facilityInstructorScheduleRepository.delete(schedule);
    }

    // 스케쥴 목록 조회
    public List<InstructorScheduleSimpleResponseDto> getScheduleList(
            Long facilityId, Long instructorId, Long apartmentId
    ) {
        FacilityInstructor instructor = facilityInstructorRepository.findById(instructorId)
                .orElseThrow(() -> new EntityNotFoundException("강사를 찾을 수 없습니다."));
        if (!instructor.getFacility().getId().equals(facilityId) ||
                !instructor.getFacility().getApartment().getId().equals(apartmentId)) {
            throw new IllegalArgumentException("잘못된 접근");
        }
        return facilityInstructorScheduleRepository.findByInstructorId(instructorId)
                .stream()
                .map(InstructorScheduleSimpleResponseDto::from)
                .collect(Collectors.toList());
    }

}