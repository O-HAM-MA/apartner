package com.ohammer.apartner.domain.menu.service.impl;

import com.ohammer.apartner.domain.menu.dto.AdminGradeDTO;
import com.ohammer.apartner.domain.menu.entity.AdminGrade;
import com.ohammer.apartner.domain.menu.entity.GradeMenuAccess;
import com.ohammer.apartner.domain.menu.entity.Menu;
import com.ohammer.apartner.domain.menu.repository.AdminGradeRepository;
import com.ohammer.apartner.domain.menu.repository.GradeMenuAccessRepository;
import com.ohammer.apartner.domain.menu.repository.MenuRepository;
import com.ohammer.apartner.domain.menu.service.AdminGradeService;
import com.ohammer.apartner.global.exception.DuplicateResourceException;
import com.ohammer.apartner.global.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AdminGradeServiceImpl implements AdminGradeService {
    
    private final AdminGradeRepository adminGradeRepository;
    private final MenuRepository menuRepository;
    private final GradeMenuAccessRepository gradeMenuAccessRepository;
    
    @Override
    @Transactional(readOnly = true)
    public List<AdminGradeDTO> getAllGrades() {
        List<AdminGrade> grades = adminGradeRepository.findAllGradesOrderByLevel();
        List<AdminGradeDTO> gradeDTOs = AdminGradeDTO.fromEntities(grades);
        
        for (AdminGradeDTO gradeDTO : gradeDTOs) {
            gradeDTO.setUsersCount(countUsersByGradeId(gradeDTO.getId()));
            gradeDTO.setMenuIds(getMenuIdsByGradeId(gradeDTO.getId()));
        }
        
        return gradeDTOs;
    }
    
    @Override
    @Transactional(readOnly = true)
    public AdminGradeDTO getGradeById(Long id) {
        AdminGrade grade = adminGradeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("등급을 찾을 수 없습니다. ID: " + id));
        
        AdminGradeDTO gradeDTO = AdminGradeDTO.fromEntity(grade);
        gradeDTO.setUsersCount(countUsersByGradeId(id));
        gradeDTO.setMenuIds(getMenuIdsByGradeId(id));
        
        return gradeDTO;
    }
    
    @Override
    public AdminGradeDTO createGrade(AdminGradeDTO gradeDTO) {
        if (isGradeNameDuplicate(gradeDTO.getName())) {
            throw new DuplicateResourceException("이미 존재하는 등급 이름입니다: " + gradeDTO.getName());
        }
        
        if (isGradeLevelDuplicate(gradeDTO.getLevel())) {
            throw new DuplicateResourceException("이미 존재하는 등급 레벨입니다: " + gradeDTO.getLevel());
        }
        
        AdminGrade grade = gradeDTO.toEntity();
        AdminGrade savedGrade = adminGradeRepository.save(grade);
        log.info("새로운 등급이 생성되었습니다. ID: {}, 이름: {}", savedGrade.getId(), savedGrade.getName());
        
        if (gradeDTO.getMenuIds() != null && !gradeDTO.getMenuIds().isEmpty()) {
            assignMenusToGrade(savedGrade.getId(), gradeDTO.getMenuIds());
        }
        
        AdminGradeDTO savedGradeDTO = AdminGradeDTO.fromEntity(savedGrade);
        savedGradeDTO.setUsersCount(0L); 
        savedGradeDTO.setMenuIds(getMenuIdsByGradeId(savedGrade.getId()));
        
        return savedGradeDTO;
    }
    
    @Override
    public AdminGradeDTO updateGrade(Long id, AdminGradeDTO gradeDTO) {
        AdminGrade grade = adminGradeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("등급을 찾을 수 없습니다. ID: " + id));
        
        //  이름이 다르고 다른 등급과 이름이 중복되는지 확인
        if (!grade.getName().equals(gradeDTO.getName()) && isGradeNameDuplicate(gradeDTO.getName())) {
            throw new DuplicateResourceException("이미 존재하는 등급 이름입니다: " + gradeDTO.getName());
        }
        
        // 레벨이 다르고 다른 등급과 레벨이 중복되는지 확인
        if (!grade.getLevel().equals(gradeDTO.getLevel()) && isGradeLevelDuplicate(gradeDTO.getLevel())) {
            throw new DuplicateResourceException("등급이 중복되거나 이미 존재하는 등급 레벨입니다: " + gradeDTO.getLevel());
        }
        
        grade.setName(gradeDTO.getName());
        grade.setDescription(gradeDTO.getDescription());

        AdminGrade updatedGrade = adminGradeRepository.save(grade);
        log.info("등급이 업데이트되었습니다. ID: {}, 이름: {}", updatedGrade.getId(), updatedGrade.getName());
        
        if (gradeDTO.getMenuIds() != null) {
            assignMenusToGrade(updatedGrade.getId(), gradeDTO.getMenuIds());
        }
        
        AdminGradeDTO updatedGradeDTO = AdminGradeDTO.fromEntity(updatedGrade);
        updatedGradeDTO.setUsersCount(countUsersByGradeId(id));
        updatedGradeDTO.setMenuIds(getMenuIdsByGradeId(id));
        
        return updatedGradeDTO;
    }
    
    @Override
    public void deleteGrade(Long id) {
        AdminGrade grade = adminGradeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("등급을 찾을 수 없습니다. ID: " + id));
        
        // 사용자가 있는 등급은 삭제할 수 없음
        Long usersCount = countUsersByGradeId(id);
        if (usersCount > 0) {
            throw new IllegalStateException("해당 등급을 사용 중인 사용자가 " + usersCount + "명 있어 삭제할 수 없습니다.");
        }
        
        // 등급 삭제 전 관련된 메뉴 접근 권한 삭제
        gradeMenuAccessRepository.deleteAllByGradeId(id);
        
        adminGradeRepository.delete(grade);
        log.info("등급이 삭제되었습니다. ID: {}, 이름: {}", id, grade.getName());
    }
    
    @Override
    public void assignMenusToGrade(Long gradeId, List<Long> menuIds) {
        AdminGrade grade = adminGradeRepository.findById(gradeId)
                .orElseThrow(() -> new ResourceNotFoundException("등급을 찾을 수 없습니다. ID: " + gradeId));
        
        gradeMenuAccessRepository.deleteAllByGradeId(gradeId);
        
        List<GradeMenuAccess> accessList = new ArrayList<>();
        
        // 메뉴 권한 할당
        for (Long menuId : menuIds) {
            Menu menu = menuRepository.findById(menuId)
                    .orElseThrow(() -> new ResourceNotFoundException("메뉴를 찾을 수 없습니다. ID: " + menuId));
            
            GradeMenuAccess access = GradeMenuAccess.builder()
                    .grade(grade)
                    .menu(menu)
                    .build();
            
            accessList.add(access);
        }
        
        gradeMenuAccessRepository.saveAll(accessList);
        log.info("등급 ID {}에 {}개의 메뉴가 할당되었습니다.", gradeId, menuIds.size());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Long> getMenuIdsByGradeId(Long gradeId) {
        List<Menu> menus = gradeMenuAccessRepository.findMenusByGradeId(gradeId);
        return menus.stream().map(Menu::getId).collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean isGradeNameDuplicate(String name) {
        return adminGradeRepository.existsByName(name);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean isGradeLevelDuplicate(Integer level) {
        return adminGradeRepository.existsByLevel(level);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Long countUsersByGradeId(Long gradeId) {
        return adminGradeRepository.countUsersByGradeId(gradeId);
    }
} 