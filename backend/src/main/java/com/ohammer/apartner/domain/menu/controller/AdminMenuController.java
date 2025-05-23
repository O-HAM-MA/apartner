package com.ohammer.apartner.domain.menu.controller;

import com.ohammer.apartner.domain.menu.dto.AdminGradeDTO;
import com.ohammer.apartner.domain.menu.dto.MenuDTO;
import com.ohammer.apartner.domain.menu.service.AdminGradeService;
import com.ohammer.apartner.domain.menu.service.MenuService;
import com.ohammer.apartner.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import com.ohammer.apartner.domain.user.entity.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.ohammer.apartner.security.service.AuthService;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin/menu")
@RequiredArgsConstructor
public class AdminMenuController {
    
    private final MenuService menuService;
    private final AdminGradeService adminGradeService;
    private final AuthService authService;
    
    // 메뉴 관련 API
    
    @GetMapping("/menus")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<Page<MenuDTO>>> getAllMenus(Pageable pageable) {
        Page<MenuDTO> menuDTOs = menuService.getAllMenus(pageable); // 페이지네이션 적용한 메뉴 조회
        return ResponseEntity.ok(new ApiResponse<>(true, "메뉴 목록을 성공적으로 조회했습니다.", menuDTOs));
    }
    
    @GetMapping("/menus/list")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<List<MenuDTO>>> getAllMenusList() {
        List<MenuDTO> menuDTOs = menuService.getAllMenusList(); // 모든 메뉴 조회
        return ResponseEntity.ok(new ApiResponse<>(true, "메뉴 목록을 성공적으로 조회했습니다.", menuDTOs));
    }
    
    @GetMapping("/menus/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<MenuDTO>> getMenuById(@PathVariable("id") Long id) {
        MenuDTO menuDTO = menuService.getMenuById(id); // 특정 메뉴 조회
        return ResponseEntity.ok(new ApiResponse<>(true, "메뉴를 성공적으로 조회했습니다.", menuDTO));
    }
    
    @PostMapping("/menus")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<MenuDTO>> createMenu(@Valid @RequestBody MenuDTO menuDTO) {
        MenuDTO createdMenuDTO = menuService.createMenu(menuDTO); // 새 메뉴 생성
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "메뉴가 성공적으로 생성되었습니다.", createdMenuDTO));
    }
    
    @PutMapping("/menus/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<MenuDTO>> updateMenu(@PathVariable("id") Long id, @Valid @RequestBody MenuDTO menuDTO) {
        MenuDTO updatedMenuDTO = menuService.updateMenu(id, menuDTO); // 메뉴 업데이트
        return ResponseEntity.ok(new ApiResponse<>(true, "메뉴가 성공적으로 업데이트되었습니다.", updatedMenuDTO));
    }
    
    @DeleteMapping("/menus/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteMenu(@PathVariable("id") Long id) {
        menuService.deleteMenu(id); // 메뉴 삭제
        return ResponseEntity.ok(new ApiResponse<>(true, "메뉴가 성공적으로 삭제되었습니다.", null));
    }
    
    // 등급 관련 API
    
    @GetMapping("/grades")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<List<AdminGradeDTO>>> getAllGrades() {
        List<AdminGradeDTO> gradeDTOs = adminGradeService.getAllGrades(); // 모든 등급 조회
        return ResponseEntity.ok(new ApiResponse<>(true, "등급 목록을 성공적으로 조회했습니다.", gradeDTOs));
    }
    
    @GetMapping("/grades/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<AdminGradeDTO>> getGradeById(@PathVariable("id") Long id) {
        AdminGradeDTO gradeDTO = adminGradeService.getGradeById(id); // 특정 등급 조회
        return ResponseEntity.ok(new ApiResponse<>(true, "등급을 성공적으로 조회했습니다.", gradeDTO));
    }
    
    @PostMapping("/grades")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<AdminGradeDTO>> createGrade(@Valid @RequestBody AdminGradeDTO gradeDTO) {
        AdminGradeDTO createdGradeDTO = adminGradeService.createGrade(gradeDTO); // 새 등급 생성
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "등급이 성공적으로 생성되었습니다.", createdGradeDTO));
    }
    
    @PutMapping("/grades/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<AdminGradeDTO>> updateGrade(@PathVariable("id") Long id, @Valid @RequestBody AdminGradeDTO gradeDTO) {
        AdminGradeDTO updatedGradeDTO = adminGradeService.updateGrade(id, gradeDTO); // 등급 업데이트
        return ResponseEntity.ok(new ApiResponse<>(true, "등급이 성공적으로 업데이트되었습니다.", updatedGradeDTO));
    }
    
    @DeleteMapping("/grades/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteGrade(@PathVariable("id") Long id) {
        adminGradeService.deleteGrade(id); // 등급 삭제
        return ResponseEntity.ok(new ApiResponse<>(true, "등급이 성공적으로 삭제되었습니다.", null));
    }
    
    @PutMapping("/grades/{id}/menus")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> assignMenusToGrade(@PathVariable("id") Long id, @RequestBody List<Long> menuIds) {
        adminGradeService.assignMenusToGrade(id, menuIds); // 등급에 메뉴 할당
        return ResponseEntity.ok(new ApiResponse<>(true, "등급에 메뉴가 성공적으로 할당되었습니다.", null));
    }
    
    @GetMapping("/grades/{id}/menus")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<List<Long>>> getMenuIdsByGradeId(@PathVariable("id") Long id) {
        List<Long> menuIds = adminGradeService.getMenuIdsByGradeId(id); // 등급의 메뉴 목록 조회
        return ResponseEntity.ok(new ApiResponse<>(true, "등급의 메뉴 목록을 성공적으로 조회했습니다.", menuIds));
    }
    
    @GetMapping("/me/menus")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<List<MenuDTO>>> getMyMenus() {
        // 현재 인증된 사용자 정보 가져오기
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        // 이메일로 사용자 조회
        User adminUser = authService.findByEmail(email);
        
        if (adminUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(false, "사용자 정보를 찾을 수 없습니다.", null));
        }
        
        // 사용자의 등급 ID로 메뉴 목록 조회
        Long gradeId = adminUser.getGradeId();
        if (gradeId == null) {
            return ResponseEntity.ok(new ApiResponse<>(true, "등급이 할당되지 않았습니다.", List.of()));
        }
        
        List<MenuDTO> menuDTOs = menuService.getMenusByGradeId(gradeId);
        return ResponseEntity.ok(new ApiResponse<>(true, "내 등급에 따른 메뉴 목록을 성공적으로 조회했습니다.", menuDTOs));
    }
} 