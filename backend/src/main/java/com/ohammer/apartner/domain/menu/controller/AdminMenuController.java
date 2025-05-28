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
import java.util.Map;
import java.util.stream.Collectors;
import com.ohammer.apartner.domain.user.entity.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
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
    @PreAuthorize("hasAnyAuthority('ADMIN', 'MANAGER', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<Page<MenuDTO>>> getAllMenus(Pageable pageable) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        // ADMIN만 모든 메뉴 조회 가능, MANAGER는 권한 없음
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(authority -> 
                        authority.getAuthority().equals("ADMIN") || 
                        authority.getAuthority().equals("ROLE_ADMIN"));
                        
        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>(false, "해당 기능에 대한 접근 권한이 없습니다.", null));
        }
        
        Page<MenuDTO> menuDTOs = menuService.getAllMenus(pageable); // 페이지네이션 적용한 메뉴 조회
        return ResponseEntity.ok(new ApiResponse<>(true, "메뉴 목록을 성공적으로 조회했습니다.", menuDTOs));
    }
    
    @GetMapping("/menus/list")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'MANAGER', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<List<MenuDTO>>> getAllMenusList() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        // ADMIN만 모든 메뉴 목록 조회 가능, MANAGER는 권한 없음
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(authority -> 
                        authority.getAuthority().equals("ADMIN") || 
                        authority.getAuthority().equals("ROLE_ADMIN"));
                        
        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>(false, "해당 기능에 대한 접근 권한이 없습니다.", null));
        }
        
        List<MenuDTO> menuDTOs = menuService.getAllMenusList(); // 모든 메뉴 조회
        return ResponseEntity.ok(new ApiResponse<>(true, "메뉴 목록을 성공적으로 조회했습니다.", menuDTOs));
    }
    
    @GetMapping("/menus/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<MenuDTO>> getMenuById(@PathVariable("id") Long id) {
        MenuDTO menuDTO = menuService.getMenuById(id); // 특정 메뉴 조회
        return ResponseEntity.ok(new ApiResponse<>(true, "메뉴를 성공적으로 조회했습니다.", menuDTO));
    }
    
    @PostMapping("/menus")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<MenuDTO>> createMenu(@Valid @RequestBody MenuDTO menuDTO) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        // ADMIN만 모든 메뉴 조회 가능, MANAGER는 권한 없음
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(authority -> 
                        authority.getAuthority().equals("ADMIN") || 
                        authority.getAuthority().equals("ROLE_ADMIN"));
                        
        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>(false, "해당 기능에 대한 접근 권한이 없습니다.", null));
        }


        MenuDTO createdMenuDTO = menuService.createMenu(menuDTO); // 새 메뉴 생성
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "메뉴가 성공적으로 생성되었습니다.", createdMenuDTO));
    }
    
    @PutMapping("/menus/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<MenuDTO>> updateMenu(@PathVariable("id") Long id, @Valid @RequestBody MenuDTO menuDTO) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        // ADMIN만 모든 메뉴 조회 가능, MANAGER는 권한 없음
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(authority -> 
                        authority.getAuthority().equals("ADMIN") || 
                        authority.getAuthority().equals("ROLE_ADMIN"));
                        
        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>(false, "해당 기능에 대한 접근 권한이 없습니다.", null));
        }

        MenuDTO updatedMenuDTO = menuService.updateMenu(id, menuDTO); // 메뉴 업데이트
        return ResponseEntity.ok(new ApiResponse<>(true, "메뉴가 성공적으로 업데이트되었습니다.", updatedMenuDTO));
    }
    
    @DeleteMapping("/menus/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteMenu(@PathVariable("id") Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        // ADMIN만 모든 메뉴 조회 가능, MANAGER는 권한 없음
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(authority -> 
                        authority.getAuthority().equals("ADMIN") || 
                        authority.getAuthority().equals("ROLE_ADMIN"));
                        
        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>(false, "해당 기능에 대한 접근 권한이 없습니다.", null));
        }

        menuService.deleteMenu(id); // 메뉴 삭제
        return ResponseEntity.ok(new ApiResponse<>(true, "메뉴가 성공적으로 삭제되었습니다.", null));
    }
    
    // 등급 관련 API
    
    @GetMapping("/grades")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<AdminGradeDTO>>> getAllGrades() {
        List<AdminGradeDTO> gradeDTOs = adminGradeService.getAllGrades(); // 모든 등급 조회
        return ResponseEntity.ok(new ApiResponse<>(true, "등급 목록을 성공적으로 조회했습니다.", gradeDTOs));
    }
    
    @GetMapping("/grades/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<AdminGradeDTO>> getGradeById(@PathVariable("id") Long id) {
        AdminGradeDTO gradeDTO = adminGradeService.getGradeById(id); // 특정 등급 조회
        return ResponseEntity.ok(new ApiResponse<>(true, "등급을 성공적으로 조회했습니다.", gradeDTO));
    }
    
    @PostMapping("/grades")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<AdminGradeDTO>> createGrade(@Valid @RequestBody AdminGradeDTO gradeDTO) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        // ADMIN만 모든 메뉴 조회 가능, MANAGER는 권한 없음
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(authority -> 
                        authority.getAuthority().equals("ADMIN") || 
                        authority.getAuthority().equals("ROLE_ADMIN"));
                        
        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>(false, "해당 기능에 대한 접근 권한이 없습니다.", null));
        }
        AdminGradeDTO createdGradeDTO = adminGradeService.createGrade(gradeDTO); // 새 등급 생성
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "등급이 성공적으로 생성되었습니다.", createdGradeDTO));
    }
    
    @PutMapping("/grades/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<AdminGradeDTO>> updateGrade(@PathVariable("id") Long id, @Valid @RequestBody AdminGradeDTO gradeDTO) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        // ADMIN만 모든 메뉴 조회 가능, MANAGER는 권한 없음
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(authority -> 
                        authority.getAuthority().equals("ADMIN") || 
                        authority.getAuthority().equals("ROLE_ADMIN"));
                        
        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>(false, "해당 기능에 대한 접근 권한이 없습니다.", null));
        }
        AdminGradeDTO updatedGradeDTO = adminGradeService.updateGrade(id, gradeDTO); // 등급 업데이트
        return ResponseEntity.ok(new ApiResponse<>(true, "등급이 성공적으로 업데이트되었습니다.", updatedGradeDTO));
    }
    
    @DeleteMapping("/grades/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteGrade(@PathVariable("id") Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        // ADMIN만 모든 메뉴 조회 가능, MANAGER는 권한 없음
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(authority -> 
                        authority.getAuthority().equals("ADMIN") || 
                        authority.getAuthority().equals("ROLE_ADMIN"));
                        
        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>(false, "해당 기능에 대한 접근 권한이 없습니다.", null));
        }
        adminGradeService.deleteGrade(id); // 등급 삭제
        return ResponseEntity.ok(new ApiResponse<>(true, "등급이 성공적으로 삭제되었습니다.", null));
    }
    
    @PutMapping("/grades/{id}/menus")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> assignMenusToGrade(@PathVariable("id") Long id, @RequestBody List<Long> menuIds) {
        adminGradeService.assignMenusToGrade(id, menuIds); // 등급에 메뉴 할당
        return ResponseEntity.ok(new ApiResponse<>(true, "등급에 메뉴가 성공적으로 할당되었습니다.", null));
    }
    
    @PutMapping("/grades/{id}/menus/order")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> assignMenusWithOrderToGrade(
            @PathVariable("id") Long id, 
            @RequestBody Map<Long, Integer> menuSortOrders) {
        
        adminGradeService.assignMenusWithOrderToGrade(id, menuSortOrders); // 등급에 메뉴와 정렬 순서 할당
        return ResponseEntity.ok(new ApiResponse<>(true, "등급에 메뉴와 정렬 순서가 성공적으로 할당되었습니다.", null));
    }
    
    @GetMapping("/grades/{id}/menus")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<Long>>> getMenuIdsByGradeId(@PathVariable("id") Long id) {
        List<Long> menuIds = adminGradeService.getMenuIdsByGradeId(id); // 등급의 메뉴 목록 조회
        return ResponseEntity.ok(new ApiResponse<>(true, "등급의 메뉴 목록을 성공적으로 조회했습니다.", menuIds));
    }
    
    @GetMapping("/grades/{id}/menus/sorted")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<MenuDTO>>> getMenusWithSortOrderByGradeId(@PathVariable("id") Long id) {
        List<MenuDTO> menuDTOs = adminGradeService.getMenusWithSortOrderByGradeId(id); // 정렬 순서를 포함한 등급의 메뉴 목록 조회
        return ResponseEntity.ok(new ApiResponse<>(true, "등급의 정렬된 메뉴 목록을 성공적으로 조회했습니다.", menuDTOs));
    }
    
    @GetMapping("/me/menus")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'MANAGER', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<List<MenuDTO>>> getMyMenus() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ADMIN") || 
                                 auth.getAuthority().equals("ROLE_ADMIN"));
        
        log.info("사용자 메뉴 요청 시작 - 이메일: {}, 권한: {}, ADMIN 여부: {}", 
                email, authentication.getAuthorities(), isAdmin);
        
        User adminUser = authService.findByEmail(email);
        
        if (adminUser == null) {
            log.warn("메뉴 요청: 사용자 정보를 찾을 수 없습니다 - 이메일: {}", email);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(false, "사용자 정보를 찾을 수 없습니다.", null));
        }
        
        log.info("사용자 정보 조회 성공 - ID: {}, 이름: {}, 등급 ID: {}", 
                adminUser.getId(), adminUser.getUserName(), adminUser.getGradeId());
        
        if (isAdmin) {
            log.info("ADMIN 권한 확인됨. 모든 메뉴 조회 시작");
            List<MenuDTO> allMenus = menuService.getAllMenusList();
            
            log.info("ADMIN 권한 사용자({})에게 모든 메뉴 반환 - 메뉴 수: {}", email, allMenus.size());
            if (allMenus.isEmpty()) {
                log.warn("ADMIN 권한 사용자({})에게 반환할 메뉴가 없습니다. DB에 메뉴가 등록되어 있는지 확인 필요", email);
            } else {
                log.info("ADMIN 권한 사용자({})에게 반환할 메뉴: {}", email, 
                        allMenus.stream().map(MenuDTO::getName).collect(Collectors.joining(", ")));
            }
            
            return ResponseEntity.ok(new ApiResponse<>(true, 
                    allMenus.isEmpty() ? 
                    "ADMIN 권한으로 조회했으나 등록된 메뉴가 없습니다." : 
                    "ADMIN 권한으로 모든 메뉴를 조회했습니다.", allMenus));
        }
        
        
        Long gradeId = adminUser.getGradeId();
        if (gradeId == null) {
            log.warn("MANAGER 사용자({})에게 할당된 등급이 없습니다", email);
            return ResponseEntity.ok(new ApiResponse<>(true, "등급이 할당되지 않았습니다.", List.of()));
        }
        
        log.info("MANAGER 권한 사용자 등급 ID 확인: {}", gradeId);
        List<MenuDTO> menuDTOs = menuService.getMenusByGradeIdSorted(gradeId);
        
        if (menuDTOs.isEmpty()) {
            log.warn("MANAGER 사용자({})의 등급 ID: {}에 할당된 메뉴가 없습니다", email, gradeId);
        } else {
            log.info("MANAGER 권한 사용자({})에게 등급 ID: {}에 해당하는 메뉴({} 개) 반환: {}", 
                    email, gradeId, menuDTOs.size(), 
                    menuDTOs.stream().map(MenuDTO::getName).collect(Collectors.joining(", ")));
        }
        
        return ResponseEntity.ok(new ApiResponse<>(true, "내 등급에 따른 메뉴 목록을 성공적으로 조회했습니다.", menuDTOs));
    }
}