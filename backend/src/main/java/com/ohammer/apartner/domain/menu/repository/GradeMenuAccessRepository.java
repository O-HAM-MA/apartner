package com.ohammer.apartner.domain.menu.repository;

import com.ohammer.apartner.domain.menu.entity.AdminGrade;
import com.ohammer.apartner.domain.menu.entity.GradeMenuAccess;
import com.ohammer.apartner.domain.menu.entity.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GradeMenuAccessRepository extends JpaRepository<GradeMenuAccess, Long> {
    
    List<GradeMenuAccess> findByGrade(AdminGrade grade);
    
    List<GradeMenuAccess> findByGradeId(Long gradeId);
    
    List<GradeMenuAccess> findByMenu(Menu menu);
    
    Optional<GradeMenuAccess> findByGradeAndMenu(AdminGrade grade, Menu menu);
    
    boolean existsByGradeAndMenu(AdminGrade grade, Menu menu);
    
    @Modifying
    @Query("DELETE FROM GradeMenuAccess gma WHERE gma.grade.id = :gradeId")
    void deleteAllByGradeId(@Param("gradeId") Long gradeId);
    
    @Query("SELECT m FROM Menu m JOIN GradeMenuAccess gma ON m.id = gma.menu.id WHERE gma.grade.id = :gradeId")
    List<Menu> findMenusByGradeId(@Param("gradeId") Long gradeId);
    
    // 정렬 순서를 고려하여 메뉴 조회
    @Query("SELECT m FROM Menu m JOIN GradeMenuAccess gma ON m.id = gma.menu.id WHERE gma.grade.id = :gradeId ORDER BY gma.sortOrder ASC")
    List<Menu> findMenusByGradeIdOrderBySortOrder(@Param("gradeId") Long gradeId);
    
    // 메뉴별 정렬 순서 조회
    @Query("SELECT gma FROM GradeMenuAccess gma WHERE gma.grade.id = :gradeId ORDER BY gma.sortOrder ASC")
    List<GradeMenuAccess> findByGradeIdOrderBySortOrder(@Param("gradeId") Long gradeId);
} 