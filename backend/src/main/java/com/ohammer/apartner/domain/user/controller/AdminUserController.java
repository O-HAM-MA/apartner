package com.ohammer.apartner.domain.user.controller;

import com.ohammer.apartner.domain.user.dto.AdminUserDetailResponse;
import com.ohammer.apartner.domain.user.dto.AdminUserListResponse;
import com.ohammer.apartner.domain.user.dto.AdminUserRoleUpdateRequest;
import com.ohammer.apartner.domain.user.dto.AdminUserStatusUpdateRequest;
import com.ohammer.apartner.domain.user.entity.Role;
import com.ohammer.apartner.domain.user.service.AdminUserService;
import com.ohammer.apartner.global.dto.ApiResponse;
import com.ohammer.apartner.global.Status;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminUserListResponse>>> getUserList(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) String userName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String apartmentName,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Status status,
            @PageableDefault(size = 20, sort = "lastLoginAt", direction = Sort.Direction.DESC) Pageable pageable) {
        
        Page<AdminUserListResponse> userPage = adminUserService.getUserList(searchTerm, userName, email, apartmentName, role, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(userPage));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<AdminUserDetailResponse>> getUserDetail(@PathVariable Long userId) {
        AdminUserDetailResponse userDetail = adminUserService.getUserDetail(userId);
        return ResponseEntity.ok(ApiResponse.success(userDetail));
    }

    @PatchMapping("/{userId}/status")
    public ResponseEntity<ApiResponse<Void>> updateUserStatus(
            @PathVariable Long userId,
            @RequestBody AdminUserStatusUpdateRequest request) {
        
        adminUserService.updateUserStatus(userId, request);
        return ResponseEntity.ok(ApiResponse.success());
    }
    
    @PatchMapping("/{userId}/roles")
    public ResponseEntity<ApiResponse<Void>> updateUserRoles(
            @PathVariable Long userId,
            @RequestBody AdminUserRoleUpdateRequest request) {
        
        adminUserService.updateUserRoles(userId, request);
        return ResponseEntity.ok(ApiResponse.success());
    }
    
    @GetMapping("/{userId}/logs")
    public ResponseEntity<ApiResponse<Page<?>>> getUserLogs(
            @PathVariable Long userId,
            @RequestParam(required = false) String logType, // login, status_change, role_change
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        
        Page<?> logs = adminUserService.getUserLogs(userId, logType, pageable);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }
    
    @GetMapping("/export")
    public ResponseEntity<Resource> exportUsers(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Status status,
            @RequestParam(defaultValue = "csv") String format) {
            
        Resource resource = adminUserService.exportUsers(searchTerm, role, status, format);
        
        String filename = "user-export-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
        String contentType;
        String extension;
        
        if ("excel".equals(format)) {
            contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            extension = ".xlsx";
        } else {
            contentType = "text/csv";
            extension = ".csv";
        }
        
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + extension + "\"")
                .body(resource);
    }
}