package com.ohammer.apartner.domain.complaint.repository;

import com.ohammer.apartner.domain.complaint.entity.ComplaintFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintFeedbackRepository extends JpaRepository<ComplaintFeedback, Long> {

    List<ComplaintFeedback> findByComplaintId(Long complaintId);
    Long findUserIdById(Long feedbackId);
}
