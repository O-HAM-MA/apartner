package com.ohammer.apartner.domain.opinion.repository;

import com.ohammer.apartner.domain.opinion.entity.Opinion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.ohammer.apartner.domain.opinion.entity.Opinion.Type;

import java.util.List;

@Repository
public interface OpinionRepository extends JpaRepository<Opinion, Long> {
    List<Opinion> findByType(Type type);
}
