package com.ohammer.apartner.domain.complaint.repository;

import com.ohammer.apartner.domain.complaint.entity.Complaint;
import com.ohammer.apartner.domain.complaint.entity.QComplaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    List<Complaint> findByUserId(Long userId);
}
