package com.ohammer.apartner.domain.user.controller;

import com.ohammer.apartner.domain.apartment.entity.Apartment;
import com.ohammer.apartner.domain.apartment.entity.Building;
import com.ohammer.apartner.domain.menu.entity.AdminGrade;
import com.ohammer.apartner.domain.user.dto.AdminAccountRequest;
import com.ohammer.apartner.domain.user.dto.AdminAccountResponse;
import com.ohammer.apartner.domain.user.dto.PasswordChangeRequest;
import com.ohammer.apartner.domain.user.service.AdminAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/accounts")
@RequiredArgsConstructor
public class AdminAccountController {
    
    private final AdminAccountService adminAccountService;
    
    @GetMapping
    public ResponseEntity<List<AdminAccountResponse>> getAllAdminAccounts() {
        return ResponseEntity.ok(adminAccountService.getAllAdminAccounts());
    }
    
    
    @GetMapping("/page")
    public ResponseEntity<Page<AdminAccountResponse>> getAdminAccountsByPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {
        
        Sort.Direction sortDirection = Sort.Direction.fromString(direction);
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));
        
        return ResponseEntity.ok(adminAccountService.getAdminAccountsByPage(pageable));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<AdminAccountResponse> getAdminAccountById(@PathVariable Long id) {
        return ResponseEntity.ok(adminAccountService.getAdminAccountById(id));
    }
    
    @PostMapping
    public ResponseEntity<AdminAccountResponse> createAdminAccount(@Valid @RequestBody AdminAccountRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminAccountService.createAdminAccount(request));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<AdminAccountResponse> updateAdminAccount(
            @PathVariable Long id, 
            @Valid @RequestBody AdminAccountRequest request) {
        return ResponseEntity.ok(adminAccountService.updateAdminAccount(id, request));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAdminAccount(@PathVariable Long id) {
        adminAccountService.deleteAdminAccount(id);
        return ResponseEntity.noContent().build();
    }
    
    @PatchMapping("/{id}/status")
    public ResponseEntity<AdminAccountResponse> changeAccountStatus(
            @PathVariable Long id, 
            @RequestBody Map<String, Boolean> status) {
        return ResponseEntity.ok(adminAccountService.changeAccountStatus(id, status.get("active")));
    }
    
    @PutMapping("/{id}/password")
    public ResponseEntity<Void> resetPassword(
            @PathVariable Long id, 
            @Valid @RequestBody PasswordChangeRequest request) {
        adminAccountService.resetPassword(id, request);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/grades")
    public ResponseEntity<List<AdminGrade>> getAdminGrades() {
        return ResponseEntity.ok(adminAccountService.getAllAdminGrades());
    }
    
    @GetMapping("/apartments")
    public ResponseEntity<List<Apartment>> getAllApartments() {
        return ResponseEntity.ok(adminAccountService.getAllApartments());
    }
    
    @GetMapping("/apartments/{apartmentId}/buildings")
    public ResponseEntity<List<Building>> getBuildingsByApartmentId(@PathVariable Long apartmentId) {
        return ResponseEntity.ok(adminAccountService.getBuildingsByApartmentId(apartmentId));
    }
}