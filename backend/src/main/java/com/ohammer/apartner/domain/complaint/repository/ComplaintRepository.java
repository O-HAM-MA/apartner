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

    @Query("SELECT COUNT(c) FROM Complaint c " +
            "WHERE c.createdAt >= :start AND c.createdAt < :end")
    Long countTotalComplaintsToday(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    Long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<Complaint> findByStatus(Complaint.Status status);

    @Query("SELECT c.status, COUNT(c) FROM Complaint c GROUP BY c.status")
    List<Object[]> countComplaintsGroupByStatus();

    @Query("SELECT COUNT(c) FROM Complaint c")
    Long countAllComplaints();

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.status = 'COMPLETED' OR c.status = 'REJECTED'")
    Long countHandledComplaints();
}
