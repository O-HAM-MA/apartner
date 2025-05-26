package com.ohammer.apartner.domain.menu.service;

import com.ohammer.apartner.domain.menu.dto.MenuDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface MenuService {
    
    // 모든 메뉴 조회 (페이지네이션)
    Page<MenuDTO> getAllMenus(Pageable pageable);
    
    // 모든 메뉴 조회 (리스트)
    List<MenuDTO> getAllMenusList();
    
    // ID로 메뉴 조회
    MenuDTO getMenuById(Long id);
    
    // 새 메뉴 생성
    MenuDTO createMenu(MenuDTO menuDTO);
    
    // 메뉴 수정
    MenuDTO updateMenu(Long id, MenuDTO menuDTO);
    
    // 메뉴 삭제
    void deleteMenu(Long id);
    
    // 이름으로 메뉴 조회
    MenuDTO getMenuByName(String name);
    
    // URL로 메뉴 조회
    MenuDTO getMenuByUrl(String url);
    
    // 메뉴 이름 중복 확인
    boolean isMenuNameDuplicate(String name);
    
    // 메뉴 URL 중복 확인
    boolean isMenuUrlDuplicate(String url);
    
    // 등급 ID로 해당 등급에 속한 메뉴 목록 조회
    List<MenuDTO> getMenusByGradeId(Long gradeId);
    
    // 등급 ID로 해당 등급에 속한 메뉴 목록을 정렬 순서대로 조회
    List<MenuDTO> getMenusByGradeIdSorted(Long gradeId);
} 