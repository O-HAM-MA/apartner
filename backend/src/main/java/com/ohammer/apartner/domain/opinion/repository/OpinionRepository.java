package com.ohammer.apartner.domain.opinion.repository;

import com.ohammer.apartner.domain.opinion.entity.Opinion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OpinionRepository extends JpaRepository<Opinion, Long> {
    @Query("SELECT o FROM Opinion o JOIN FETCH o.user WHERE o.type = :type")
    List<Opinion> findByType(@Param("type") Opinion.Type type);
}
