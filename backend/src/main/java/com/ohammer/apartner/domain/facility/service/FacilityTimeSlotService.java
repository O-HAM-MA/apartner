package com.ohammer.apartner.domain.facility.service;

import com.ohammer.apartner.domain.facility.entity.Facility;
import com.ohammer.apartner.domain.facility.entity.FacilityInstructor;
import com.ohammer.apartner.domain.facility.entity.FacilityInstructorSchedule;
import com.ohammer.apartner.domain.facility.entity.FacilityTimeSlot;
import com.ohammer.apartner.domain.facility.repository.FacilityTimeSlotRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FacilityTimeSlotService {

    private final FacilityTimeSlotRepository facilityTimeSlotRepository;

    /**
     * 반복 스케줄(강사, 요일, 시간, 정원, 기간 등) 정보를 바탕으로 개별 타임슬롯 row 자동 생성!
     */
    @Transactional
    public void createTimeSlots(
            Facility facility,
            FacilityInstructor instructor,
            FacilityInstructorSchedule schedule,
            String dayOfWeek,            // 예: "MONDAY"
            LocalTime startTime,
            LocalTime endTime,
            Long slotMinutes,
            Long capacity,
            LocalDate periodStart,       // 예: 2025-06-01
            LocalDate periodEnd          // 예: 2025-06-30
    ) {
        LocalDate current = periodStart;
        while (!current.isAfter(periodEnd)) {
            // 해당 요일이 맞는 날짜만
            if (current.getDayOfWeek().name().equals(dayOfWeek)) {
                LocalTime cursor = startTime;
                while (!cursor.plusMinutes(slotMinutes).isAfter(endTime)) {
                    FacilityTimeSlot slot = FacilityTimeSlot.builder()
                            .facility(facility)
                            .instructor(instructor)
                            .schedule(schedule)
                            .date(current)
                            .startTime(cursor)
                            .endTime(cursor.plusMinutes(slotMinutes))
                            .maxCapacity(capacity)
                            .build();
                    facilityTimeSlotRepository.save(slot);
                    cursor = cursor.plusMinutes(slotMinutes);
                }
            }
            current = current.plusDays(1);
        }
    }
}