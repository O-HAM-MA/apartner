package com.ohammer.apartner.domain.menu.service.impl;

import com.ohammer.apartner.domain.menu.dto.AdminGradeDTO;
import com.ohammer.apartner.domain.menu.dto.MenuDTO;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
        List<AdminGradeDTO> gradeDTOs = new ArrayList<>();

        for (AdminGrade grade : grades) {
            AdminGradeDTO gradeDTO = AdminGradeDTO.fromEntity(grade);
            gradeDTO.setUsersCount(countUsersByGradeId(grade.getId()));
            
            List<MenuDTO> menusWithOrder = getMenusWithSortOrderByGradeId(grade.getId());
            gradeDTO.setMenuIds(menusWithOrder.stream().map(MenuDTO::getId).collect(Collectors.toList()));
            gradeDTO.setMenuSortOrders(
                menusWithOrder.stream()
                    .filter(menu -> menu.getSortOrder() != null)
                    .collect(Collectors.toMap(MenuDTO::getId, MenuDTO::getSortOrder))
            );
            gradeDTOs.add(gradeDTO);
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
        
        List<MenuDTO> menusWithOrder = getMenusWithSortOrderByGradeId(id);
        gradeDTO.setMenuIds(menusWithOrder.stream().map(MenuDTO::getId).collect(Collectors.toList()));
        gradeDTO.setMenuSortOrders(
            menusWithOrder.stream()
                .filter(menu -> menu.getSortOrder() != null)
                .collect(Collectors.toMap(MenuDTO::getId, MenuDTO::getSortOrder))
        );
        
        return gradeDTO;
    }
    
    @Override
    public AdminGradeDTO createGrade(AdminGradeDTO gradeDTO) {
        if (isGradeNameDuplicate(gradeDTO.getName())) {
            throw new DuplicateResourceException("이미 존재하는 등급 이름입니다: " + gradeDTO.getName());
        }
        
        if (gradeDTO.getLevel() != null && isGradeLevelDuplicate(gradeDTO.getLevel())) {
            throw new DuplicateResourceException("이미 존재하는 등급 레벨입니다: " + gradeDTO.getLevel());
        }
        
        AdminGrade grade = gradeDTO.toEntity();
        AdminGrade savedGrade = adminGradeRepository.save(grade);
        log.info("새로운 등급이 생성되었습니다. ID: {}, 이름: {}", savedGrade.getId(), savedGrade.getName());
        
        if (gradeDTO.getMenuSortOrders() != null && !gradeDTO.getMenuSortOrders().isEmpty()) {
            assignMenusWithOrderToGrade(savedGrade.getId(), gradeDTO.getMenuSortOrders());
        } else if (gradeDTO.getMenuIds() != null && !gradeDTO.getMenuIds().isEmpty()) {
            Map<Long, Integer> menuSortOrdersFromMenuIds = new HashMap<>();
            for (int i = 0; i < gradeDTO.getMenuIds().size(); i++) {
                menuSortOrdersFromMenuIds.put(gradeDTO.getMenuIds().get(i), i);
            }
            assignMenusWithOrderToGrade(savedGrade.getId(), menuSortOrdersFromMenuIds);
        }
        
        AdminGradeDTO savedGradeDTO = AdminGradeDTO.fromEntity(savedGrade);
        savedGradeDTO.setUsersCount(0L); 
        List<MenuDTO> menusWithOrder = getMenusWithSortOrderByGradeId(savedGrade.getId());
        savedGradeDTO.setMenuIds(menusWithOrder.stream().map(MenuDTO::getId).collect(Collectors.toList()));
        savedGradeDTO.setMenuSortOrders(
            menusWithOrder.stream()
                .filter(menu -> menu.getSortOrder() != null)
                .collect(Collectors.toMap(MenuDTO::getId, MenuDTO::getSortOrder))
        );
        return savedGradeDTO;
    }
    
    @Override
    public AdminGradeDTO updateGrade(Long id, AdminGradeDTO gradeDTO) {
        AdminGrade grade = adminGradeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("등급을 찾을 수 없습니다. ID: " + id));
        
        if (!grade.getName().equals(gradeDTO.getName()) && isGradeNameDuplicate(gradeDTO.getName())) {
            throw new DuplicateResourceException("이미 존재하는 등급 이름입니다: " + gradeDTO.getName());
        }
        
        if (gradeDTO.getLevel() != null && !grade.getLevel().equals(gradeDTO.getLevel()) && isGradeLevelDuplicate(gradeDTO.getLevel())) {
            throw new DuplicateResourceException("등급이 중복되거나 이미 존재하는 등급 레벨입니다: " + gradeDTO.getLevel());
        }
        
        grade.setName(gradeDTO.getName());
        grade.setDescription(gradeDTO.getDescription());
        if (gradeDTO.getLevel() != null) {
            grade.setLevel(gradeDTO.getLevel());
        }

        AdminGrade updatedGrade = adminGradeRepository.save(grade);
        log.info("등급이 업데이트되었습니다. ID: {}, 이름: {}", updatedGrade.getId(), updatedGrade.getName());
        
        if (gradeDTO.getMenuSortOrders() != null) {
            Map<Long, Integer> filteredMenuSortOrders = gradeDTO.getMenuSortOrders().entrySet().stream()
                .filter(entry -> entry.getKey() != null && entry.getValue() != null)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
            if (!filteredMenuSortOrders.isEmpty()) {
                assignMenusWithOrderToGrade(updatedGrade.getId(), filteredMenuSortOrders);
            }
        } else if (gradeDTO.getMenuIds() != null) {
            Map<Long, Integer> menuSortOrdersFromMenuIds = new HashMap<>();
            for (int i = 0; i < gradeDTO.getMenuIds().size(); i++) {
                if (gradeDTO.getMenuIds().get(i) != null) {
                     menuSortOrdersFromMenuIds.put(gradeDTO.getMenuIds().get(i), i);
                }
            }
            if (!menuSortOrdersFromMenuIds.isEmpty()) {
                assignMenusWithOrderToGrade(updatedGrade.getId(), menuSortOrdersFromMenuIds);
            }
        }
        
        AdminGradeDTO updatedGradeDTO = AdminGradeDTO.fromEntity(updatedGrade);
        updatedGradeDTO.setUsersCount(countUsersByGradeId(id));
        List<MenuDTO> menusWithOrder = getMenusWithSortOrderByGradeId(id);
        updatedGradeDTO.setMenuIds(menusWithOrder.stream().map(MenuDTO::getId).collect(Collectors.toList()));
        updatedGradeDTO.setMenuSortOrders(
            menusWithOrder.stream()
                .filter(menu -> menu.getSortOrder() != null)
                .collect(Collectors.toMap(MenuDTO::getId, MenuDTO::getSortOrder))
        );
        return updatedGradeDTO;
    }
    
    @Override
    public void deleteGrade(Long id) {
        AdminGrade grade = adminGradeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("등급을 찾을 수 없습니다. ID: " + id));
        
        Long usersCount = countUsersByGradeId(id);
        if (usersCount > 0) {
            throw new IllegalStateException("해당 등급을 사용 중인 사용자가 " + usersCount + "명 있어 삭제할 수 없습니다.");
        }
        
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
        
        for (int i = 0; i < menuIds.size(); i++) {
            Long menuId = menuIds.get(i);
            Menu menu = menuRepository.findById(menuId)
                    .orElseThrow(() -> new ResourceNotFoundException("메뉴를 찾을 수 없습니다. ID: " + menuId));
            
            GradeMenuAccess access = GradeMenuAccess.builder()
                    .grade(grade)
                    .menu(menu)
                    .sortOrder(i)
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

    @Override
    public void assignMenusWithOrderToGrade(Long gradeId, Map<Long, Integer> menuSortOrders) {
        AdminGrade grade = adminGradeRepository.findById(gradeId)
                .orElseThrow(() -> new ResourceNotFoundException("등급을 찾을 수 없습니다. ID: " + gradeId));
        
        gradeMenuAccessRepository.deleteAllByGradeId(gradeId);
        
        List<GradeMenuAccess> accessList = new ArrayList<>();
        
        for (Map.Entry<Long, Integer> entry : menuSortOrders.entrySet()) {
            Long menuId = entry.getKey();
            Integer sortOrder = entry.getValue();
            
            Menu menu = menuRepository.findById(menuId)
                    .orElseThrow(() -> new ResourceNotFoundException("메뉴를 찾을 수 없습니다. ID: " + menuId));
            
            GradeMenuAccess access = GradeMenuAccess.builder()
                    .grade(grade)
                    .menu(menu)
                    .sortOrder(sortOrder)
                    .build();
            
            accessList.add(access);
        }
        
        gradeMenuAccessRepository.saveAll(accessList);
        log.info("등급 ID {}에 {}개의 메뉴가 정렬 순서와 함께 할당되었습니다.", gradeId, menuSortOrders.size());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuDTO> getMenusWithSortOrderByGradeId(Long gradeId) {
        List<GradeMenuAccess> accessList = gradeMenuAccessRepository.findByGradeIdOrderBySortOrder(gradeId);
        List<MenuDTO> menuDTOs = new ArrayList<>();
        
        for (GradeMenuAccess access : accessList) {
            if (access.getMenu() == null) continue;
            Menu menu = access.getMenu();
            MenuDTO menuDTO = MenuDTO.fromEntity(menu);
            menuDTO.setSortOrder(access.getSortOrder());
            menuDTOs.add(menuDTO);
        }
        
        return menuDTOs;
    }
} 