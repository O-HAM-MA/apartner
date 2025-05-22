package com.ohammer.apartner.domain.menu.service;

import com.ohammer.apartner.domain.menu.dto.AdminGradeDTO;

import java.util.List;

public interface AdminGradeService {
    
    // 모든 등급 조회
    List<AdminGradeDTO> getAllGrades();
    
    // ID로 등급 조회
    AdminGradeDTO getGradeById(Long id);
    
    // 새 등급 생성
    AdminGradeDTO createGrade(AdminGradeDTO gradeDTO);
    
    // 등급 수정
    AdminGradeDTO updateGrade(Long id, AdminGradeDTO gradeDTO);
    
    // 등급 삭제
    void deleteGrade(Long id);
    
    // 등급에 메뉴 할당
    void assignMenusToGrade(Long gradeId, List<Long> menuIds);
    
    // 등급의 메뉴 조회
    List<Long> getMenuIdsByGradeId(Long gradeId);
    
    // 등급 이름 중복 확인
    boolean isGradeNameDuplicate(String name);
    
    // 등급 레벨 중복 확인
    boolean isGradeLevelDuplicate(Integer level);
    
    // 등급별 사용자 수 조회
    Long countUsersByGradeId(Long gradeId);
} 