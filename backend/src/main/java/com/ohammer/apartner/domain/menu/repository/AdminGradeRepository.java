package com.ohammer.apartner.domain.menu.repository;

import com.ohammer.apartner.domain.menu.entity.AdminGrade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdminGradeRepository extends JpaRepository<AdminGrade, Long> {
    
    Optional<AdminGrade> findByName(String name);
    
    Optional<AdminGrade> findByLevel(Integer level);
    
    boolean existsByName(String name);
    
    boolean existsByLevel(Integer level);
    
    @Query("SELECT g FROM AdminGrade g ORDER BY g.level ASC")
    List<AdminGrade> findAllGradesOrderByLevel();
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.gradeId = :gradeId")
    Long countUsersByGradeId(Long gradeId);
} 