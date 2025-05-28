package com.ohammer.apartner.domain.menu.service.impl;

import com.ohammer.apartner.domain.menu.dto.MenuDTO;
import com.ohammer.apartner.domain.menu.entity.Menu;
import com.ohammer.apartner.domain.menu.repository.GradeMenuAccessRepository;
import com.ohammer.apartner.domain.menu.repository.MenuRepository;
import com.ohammer.apartner.domain.menu.service.MenuService;
import com.ohammer.apartner.global.exception.DuplicateResourceException;
import com.ohammer.apartner.global.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.ohammer.apartner.domain.menu.entity.GradeMenuAccess;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class MenuServiceImpl implements MenuService {
    
    private final MenuRepository menuRepository;
    private final GradeMenuAccessRepository gradeMenuAccessRepository;
    
    @Override
    @Transactional(readOnly = true)
    public Page<MenuDTO> getAllMenus(Pageable pageable) {
        Pageable sortedPageable = pageable;
        if (pageable.getSort().isUnsorted()) {
            sortedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "id")
            );
        }
        
        return menuRepository.findAll(sortedPageable).map(MenuDTO::fromEntity);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<MenuDTO> getAllMenusList() {
        return MenuDTO.fromEntities(menuRepository.findAllMenusOrderById());
    }
    
    @Override
    @Transactional(readOnly = true)
    public MenuDTO getMenuById(Long id) {
        return menuRepository.findById(id)
                .map(MenuDTO::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("메뉴를 찾을 수 없습니다. ID: " + id));
    }
    
    @Override
    public MenuDTO createMenu(MenuDTO menuDTO) {
        if (isMenuNameDuplicate(menuDTO.getName())) {
            throw new DuplicateResourceException("이미 존재하는 메뉴 이름입니다: " + menuDTO.getName());
        }
        
        if (isMenuUrlDuplicate(menuDTO.getUrl())) {
            throw new DuplicateResourceException("이미 존재하는 메뉴 URL입니다: " + menuDTO.getUrl());
        }
        
        Menu menu = menuDTO.toEntity();
        Menu savedMenu = menuRepository.save(menu);
        log.info("새로운 메뉴가 생성되었습니다. ID: {}, 이름: {}", savedMenu.getId(), savedMenu.getName());
        
        return MenuDTO.fromEntity(savedMenu);
    }
    
    @Override
    public MenuDTO updateMenu(Long id, MenuDTO menuDTO) {
        Menu menu = menuRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("메뉴를 찾을 수 없습니다. ID: " + id));
        
        if (!menu.getName().equals(menuDTO.getName()) && isMenuNameDuplicate(menuDTO.getName())) {
            throw new DuplicateResourceException("이미 존재하는 메뉴 이름입니다: " + menuDTO.getName());
        }
        
        if (!menu.getUrl().equals(menuDTO.getUrl()) && isMenuUrlDuplicate(menuDTO.getUrl())) {
            throw new DuplicateResourceException("이미 존재하는 메뉴 URL입니다: " + menuDTO.getUrl());
        }
        
        menu.updateMenu(menuDTO.getName(), menuDTO.getUrl(), menuDTO.getDescription(), menuDTO.getIcon());
        Menu updatedMenu = menuRepository.save(menu);
        log.info("메뉴가 업데이트되었습니다. ID: {}, 이름: {}", updatedMenu.getId(), updatedMenu.getName());
        
        return MenuDTO.fromEntity(updatedMenu);
    }
    
    @Override
    public void deleteMenu(Long id) {
        Menu menu = menuRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("메뉴를 찾을 수 없습니다. ID: " + id));
        menuRepository.delete(menu);
        log.info("메뉴가 삭제되었습니다. ID: {}, 이름: {}", id, menu.getName());
    }
    
    @Override
    @Transactional(readOnly = true)
    public MenuDTO getMenuByName(String name) {
        return menuRepository.findByName(name)
                .map(MenuDTO::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("메뉴를 찾을 수 없습니다. 이름: " + name));
    }
    
    @Override
    @Transactional(readOnly = true)
    public MenuDTO getMenuByUrl(String url) {
        return menuRepository.findByUrl(url)
                .map(MenuDTO::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("메뉴를 찾을 수 없습니다. URL: " + url));
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean isMenuNameDuplicate(String name) {
        return menuRepository.existsByName(name);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean isMenuUrlDuplicate(String url) {
        return menuRepository.existsByUrl(url);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<MenuDTO> getMenusByGradeId(Long gradeId) {
        List<Menu> menus = gradeMenuAccessRepository.findMenusByGradeId(gradeId);
        return MenuDTO.fromEntities(menus);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<MenuDTO> getMenusByGradeIdSorted(Long gradeId) {
        List<GradeMenuAccess> accessList = gradeMenuAccessRepository.findByGradeIdOrderBySortOrder(gradeId);
        List<MenuDTO> menuDTOs = new ArrayList<>();
        
        for (GradeMenuAccess access : accessList) {
            if (access.getMenu() == null) {
                continue;
            }
            Menu menu = access.getMenu();
            MenuDTO menuDTO = MenuDTO.fromEntity(menu);
            menuDTO.setSortOrder(access.getSortOrder());
            menuDTOs.add(menuDTO);
        }
        
        return menuDTOs;
    }
} 