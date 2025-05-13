package com.ohammer.apartner.domain.apartment.repository;

import com.ohammer.apartner.domain.apartment.entity.Apartment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApartmentRepository extends JpaRepository<Apartment, Long> {
} 