package com.ohammer.apartner.domain.facility.repository;

import com.ohammer.apartner.domain.facility.entity.FacilityInstructorSchedule;
import java.time.DayOfWeek;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FacilityInstructorScheduleRepository extends JpaRepository<FacilityInstructorSchedule, Long> {

    // 해당 강사, 요일의 전체 스케줄(중복 방지)
    List<FacilityInstructorSchedule> findByInstructorIdAndDayOfWeek(Long instructorId, DayOfWeek dayOfWeek);

    // 강사의 모든 스케줄
    List<FacilityInstructorSchedule> findByInstructorId(Long instructorId);
}
