package com.ohammer.apartner.domain.vehicle.repository;

import com.ohammer.apartner.domain.vehicle.entity.EntryRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EntryRecordRepository extends JpaRepository<EntryRecord, Long> {
}
