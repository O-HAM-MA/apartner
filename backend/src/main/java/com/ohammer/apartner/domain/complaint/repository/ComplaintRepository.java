package com.ohammer.apartner.domain.complaint.repository;

import com.ohammer.apartner.domain.complaint.entity.Complaint;
import com.ohammer.apartner.domain.complaint.entity.QComplaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;


@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    List<Complaint> findByUserId(Long userId);

    @Query("SELECT c.status, COUNT(c) FROM Complaint c " +
            "WHERE c.createdAt >= :start AND c.createdAt < :end " +
            "GROUP BY c.status")
    List<Object[]> countTodayComplaintsByStatus(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    List<Complaint> findByStatus(Complaint.Status status);
}
