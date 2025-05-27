package com.ohammer.apartner.domain.user.service;

import com.ohammer.apartner.domain.apartment.entity.Apartment;
import com.ohammer.apartner.domain.apartment.entity.Building;
import com.ohammer.apartner.domain.apartment.repository.ApartmentRepository;
import com.ohammer.apartner.domain.apartment.repository.BuildingRepository;
import com.ohammer.apartner.domain.menu.entity.AdminGrade;
import com.ohammer.apartner.domain.menu.repository.AdminGradeRepository;
import com.ohammer.apartner.domain.user.dto.AdminAccountRequest;
import com.ohammer.apartner.domain.user.dto.AdminAccountResponse;
import com.ohammer.apartner.domain.user.dto.PasswordChangeRequest;
import com.ohammer.apartner.domain.user.entity.Role;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.user.exception.AdminAccountException;
import com.ohammer.apartner.domain.user.repository.UserRepository;
import com.ohammer.apartner.global.Status;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import com.ohammer.apartner.domain.user.entity.UserLog;
import com.ohammer.apartner.domain.user.repository.UserLogRepository;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import jakarta.servlet.http.HttpServletRequest;
import com.ohammer.apartner.global.Status;


@Service
@RequiredArgsConstructor
@Transactional
public class AdminAccountService {
    
    private final UserRepository userRepository;
    private final ApartmentRepository apartmentRepository;
    private final BuildingRepository buildingRepository;
    private final AdminGradeRepository adminGradeRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserLogRepository userLogRepository;
    
    @Transactional(readOnly = true)
    public List<AdminAccountResponse> getAllAdminAccounts() {
        List<User> adminUsers = userRepository.findAll().stream()
                .filter(this::isAdminOrManager)
                .collect(Collectors.toList());
        
        List<AdminAccountResponse> responses = adminUsers.stream()
                .map(AdminAccountResponse::from)
                .collect(Collectors.toList());
        
        fillGradeInfo(responses);
        
        return responses;
    }

    @Transactional(readOnly = true)
    public Page<AdminAccountResponse> getAdminAccountsByPage(Pageable pageable) {
        Page<User> usersPage = userRepository.findAll(pageable);
        
        List<AdminAccountResponse> adminResponses = usersPage.getContent().stream()
                .filter(this::isAdminOrManager)
                .map(AdminAccountResponse::from)
                .collect(Collectors.toList());
        
        fillGradeInfo(adminResponses);
        
        return new org.springframework.data.domain.PageImpl<>(
                adminResponses,
                pageable,
                usersPage.getTotalElements()
        );
    }
    
    @Transactional(readOnly = true)
    public AdminAccountResponse getAdminAccountById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AdminAccountException("사용자를 찾을 수 없습니다: " + id));
        
        if (!isAdminOrManager(user)) {
            throw new AdminAccountException("해당 사용자는 관리자 계정이 아닙니다.");
        }
        
        AdminAccountResponse response = AdminAccountResponse.from(user);
        
        if (response.getGradeId() != null) {
            adminGradeRepository.findById(response.getGradeId()).ifPresent(grade -> {
                response.setGradeName(grade.getName());
                response.setGradeLevel(grade.getLevel());
            });
        }
        
        return response;
    }
    
    public AdminAccountResponse createAdminAccount(AdminAccountRequest request) {
        
        String email = addDomainIfNeeded(request.getEmail());
        
        if (userRepository.existsByEmail(email)) {
            throw new AdminAccountException("이미 등록된 이메일입니다: " + email);
        }
        
        Role role = validateAndGetRole(request.getRole());
        
        Apartment apartment = null;
        Building building = null;
        
        if (request.getApartmentId() != null) {
            apartment = apartmentRepository.findById(request.getApartmentId())
                    .orElseThrow(() -> new AdminAccountException("아파트를 찾을 수 없습니다: " + request.getApartmentId()));
        }
        
        if (request.getBuildingId() != null) {
            building = buildingRepository.findById(request.getBuildingId())
                    .orElseThrow(() -> new AdminAccountException("건물을 찾을 수 없습니다: " + request.getBuildingId()));
            
            if (apartment != null && !building.getApartment().getId().equals(apartment.getId())) {
                throw new AdminAccountException("지정된 건물이 해당 아파트에 속하지 않습니다.");
            }
        }
        
        AdminGrade adminGrade = null;
        if (request.getGradeId() != null) {
            adminGrade = adminGradeRepository.findById(request.getGradeId())
                    .orElse(null);
        }
        
        User user = User.builder()
                .userName(request.getName())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .apartment(apartment)
                .building(building)
                .status(request.isActive() ? Status.ACTIVE : Status.INACTIVE)
                .roles(new HashSet<>(Collections.singletonList(role)))
                .gradeId(adminGrade != null ? adminGrade.getId() : null)
                .build();
        
        User savedUser = userRepository.save(user);
        
        AdminAccountResponse response = AdminAccountResponse.from(savedUser);
        
        if (response.getGradeId() != null && adminGrade != null) {
            response.setGradeName(adminGrade.getName());
            response.setGradeLevel(adminGrade.getLevel());
        }
        
        return response;
    }
    
    public AdminAccountResponse updateAdminAccount(Long id, AdminAccountRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AdminAccountException("사용자를 찾을 수 없습니다: " + id));
        
        if (!isAdminOrManager(user)) {
            throw new AdminAccountException("해당 사용자는 관리자 계정이 아닙니다.");
        }
        
        String email = addDomainIfNeeded(request.getEmail());
        
        if (!user.getEmail().equals(email) && userRepository.existsByEmail(email)) {
            throw new AdminAccountException("이미 등록된 이메일입니다: " + email);
        }
        
        Role role = validateAndGetRole(request.getRole());
        
        Apartment apartment = null;
        Building building = null;
        
        if (request.getApartmentId() != null) {
            apartment = apartmentRepository.findById(request.getApartmentId())
                    .orElseThrow(() -> new AdminAccountException("아파트를 찾을 수 없습니다: " + request.getApartmentId()));
        }
        
        if (request.getBuildingId() != null) {
            building = buildingRepository.findById(request.getBuildingId())
                    .orElseThrow(() -> new AdminAccountException("건물을 찾을 수 없습니다: " + request.getBuildingId()));
            
            if (apartment != null && !building.getApartment().getId().equals(apartment.getId())) {
                throw new AdminAccountException("지정된 건물이 해당 아파트에 속하지 않습니다.");
            }
        }
        
        if (request.getGradeId() != null) {
            adminGradeRepository.findById(request.getGradeId())
                    .orElseThrow(() -> new AdminAccountException("등급을 찾을 수 없습니다: " + request.getGradeId()));
        }
        
        user.setUserName(request.getName());
        user.setEmail(email);
        user.setApartment(apartment);
        user.setBuilding(building);
        user.setStatus(request.isActive() ? Status.ACTIVE : Status.INACTIVE);
        user.setGradeId(request.getGradeId());
        
        Set<Role> roles = new HashSet<>();
        roles.add(role);
        user.setRoles(roles);
        
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        
        User updatedUser = userRepository.save(user);
        return AdminAccountResponse.from(updatedUser);
    }
    
    public void deleteAdminAccount(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AdminAccountException("사용자를 찾을 수 없습니다: " + id));
        
        if (!isAdminOrManager(user)) {
            throw new AdminAccountException("해당 사용자는 관리자 계정이 아닙니다.");
        }
        
        userRepository.delete(user);
    }
    
    public AdminAccountResponse changeAccountStatus(Long id, boolean active) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AdminAccountException("사용자를 찾을 수 없습니다: " + id));
        if (!isAdminOrManager(user)) {
            throw new AdminAccountException("해당 사용자는 관리자 계정이 아닙니다.");
        }
        Status oldStatus = user.getStatus();
        Status newStatus = active ? Status.ACTIVE : Status.INACTIVE;
        user.setStatus(newStatus);
        User updatedUser = userRepository.save(user);
        // 상태 변경 로그 추가
        String description = String.format("관리자 상태 변경: %s -> %s", oldStatus, newStatus);
        com.ohammer.apartner.domain.user.entity.UserLog userLog = com.ohammer.apartner.domain.user.entity.UserLog.builder()
            .user(user)
            .logType(com.ohammer.apartner.domain.user.entity.UserLog.LogType.STATUS_CHANGE)
            .description(description)
            .ipAddress("admin-change") // 필요시 getClientIp()로 대체
            .createdAt(java.time.LocalDateTime.now())
            .build();
        userLogRepository.save(userLog);
        return AdminAccountResponse.from(updatedUser);
    }
    
    public void resetPassword(Long id, PasswordChangeRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new AdminAccountException("비밀번호가 일치하지 않습니다.");
        }
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AdminAccountException("사용자를 찾을 수 없습니다: " + id));
        
        if (!isAdminOrManager(user)) {
            throw new AdminAccountException("해당 사용자는 관리자 계정이 아닙니다.");
        }
        
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);

        UserLog passwordChangeLog = UserLog.builder()
    .user(user)
    .logType(UserLog.LogType.PASSWORD_CHANGE)
    .description("관리자에 의한 비밀번호 변경")
    .ipAddress(getClientIp())
    .createdAt(LocalDateTime.now())
    .build();
userLogRepository.save(passwordChangeLog);
    }
    
    @Transactional(readOnly = true)
    public List<AdminGrade> getAllAdminGrades() {
        return adminGradeRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public List<Apartment> getAllApartments() {
        return apartmentRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public List<Building> getBuildingsByApartmentId(Long apartmentId) {
        try {
            return buildingRepository.findBuildingsWithApartmentAndUnitsByApartmentId(apartmentId);
        } catch (Exception e) {
            throw new AdminAccountException("아파트 ID에 해당하는 건물 목록을 가져오는 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    private boolean isAdminOrManager(User user) {
        return user.getRoles() != null && 
                (user.getRoles().contains(Role.ADMIN) || 
                 user.getRoles().contains(Role.MANAGER));
    }
    
    private String addDomainIfNeeded(String email) {
        if (!email.contains("@")) {
            return email + "@apartner.site";
        }
        return email;
    }
    
    private Role validateAndGetRole(String roleStr) {
        try {
            Role role = Role.valueOf(roleStr.toUpperCase());
            if (role != Role.ADMIN && role != Role.MANAGER) {
                throw new AdminAccountException("유효한 관리자 역할이 아닙니다. ADMIN 또는 MANAGER만 허용됩니다.");
            }
            return role;
        } catch (IllegalArgumentException e) {
            throw new AdminAccountException("유효한 역할이 아닙니다: " + roleStr);
        }
    }
    
    private void fillGradeInfo(List<AdminAccountResponse> responses) {
        Set<Long> gradeIds = responses.stream()
                .map(AdminAccountResponse::getGradeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        
        if (!gradeIds.isEmpty()) {
            Map<Long, AdminGrade> gradeMap = adminGradeRepository.findAllById(gradeIds).stream()
                    .collect(Collectors.toMap(AdminGrade::getId, grade -> grade));
            
            responses.forEach(response -> {
                if (response.getGradeId() != null) {
                    AdminGrade grade = gradeMap.get(response.getGradeId());
                    if (grade != null) {
                        response.setGradeName(grade.getName());
                        response.setGradeLevel(grade.getLevel());
                    }
                }
            });
        }
    }

     // 클라이언트 IP 주소 가져오는 유틸리티 메서드 추가
     private String getClientIp() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            HttpServletRequest request = attributes.getRequest();
            
            String forwardedHeader = request.getHeader("X-Forwarded-For");
            if (forwardedHeader != null && !forwardedHeader.isEmpty()) {
                return forwardedHeader.split(",")[0].trim();
            }
            
            return request.getRemoteAddr();
        } catch (Exception e) {
            return "unknown";
        }
    }
}