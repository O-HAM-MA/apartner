package com.ohammer.apartner.domain.user.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ohammer.apartner.domain.user.dto.*;
import com.ohammer.apartner.domain.user.entity.Role;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.user.entity.UserLog;
import com.ohammer.apartner.domain.user.exception.UserErrorCode;
import com.ohammer.apartner.domain.user.exception.UserException;
import com.ohammer.apartner.domain.user.repository.UserLogRepository;
import com.ohammer.apartner.domain.user.repository.UserRepository;
import com.ohammer.apartner.global.Status;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final UserLogRepository userLogRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public Page<AdminUserListResponse> getUserList(String searchTerm, String userName, String email, String apartmentName, Role role, Status status, Pageable pageable) {
        Specification<User> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // 개별 필드 검색 처리
            if (userName != null && !userName.trim().isEmpty()) {
                String pattern = "%" + userName.trim().toLowerCase() + "%";
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("userName")), pattern));
            }
            
            if (email != null && !email.trim().isEmpty()) {
                String pattern = "%" + email.trim().toLowerCase() + "%";
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), pattern));
            }
            
            if (apartmentName != null && !apartmentName.trim().isEmpty()) {
                String pattern = "%" + apartmentName.trim().toLowerCase() + "%";
                try {
                    predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.join("apartment").get("name")), pattern));
                } catch (Exception e) {
                    log.warn("Failed to join apartment for search: {}", e.getMessage());
                }
            }
            
            // 기존 통합 검색어 처리 (개별 필드 검색이 없는 경우에만)
            if (searchTerm != null && !searchTerm.trim().isEmpty() 
                && userName == null && email == null && apartmentName == null) {
                
                List<Predicate> searchPredicates = new ArrayList<>();
                String searchPattern = "%" + searchTerm.trim().toLowerCase() + "%";
                
                searchPredicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("userName")), searchPattern));
                searchPredicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), searchPattern));
               // searchPredicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("phoneNum")), searchPattern));
                
                
                try {
                    searchPredicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.join("apartment").get("name")), searchPattern));
                } catch (Exception e) {
                    log.warn("Failed to join apartment for search: {}", e.getMessage());
                }
                
                predicates.add(criteriaBuilder.or(searchPredicates.toArray(new Predicate[0])));
            }
            
            if (role != null) {
                predicates.add(criteriaBuilder.isMember(role, root.get("roles")));
            }
            
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
        
        Page<User> userPage = userRepository.findAll(spec, pageable);
        
        return userPage.map(AdminUserListResponse::from);
    }

    @Transactional(readOnly = true)
    public AdminUserDetailResponse getUserDetail(Long userId) {
        User user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));
        
        return AdminUserDetailResponse.from(user);
    }

    @Transactional
    public void updateUserStatus(Long userId, AdminUserStatusUpdateRequest request) {
        User user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));
        
        Status oldStatus = user.getStatus();
        Status newStatus = request.getStatus();
        
        user.setStatus(newStatus);
        user.setModifiedAt(LocalDateTime.now());
        
        if (newStatus.equals(Status.WITHDRAWN)) {
            user.setDeletedAt(LocalDateTime.now());
        }
        
        userRepository.save(user);
        
        createStatusChangeLog(user, oldStatus, newStatus);
        
        log.info("User status updated - userId: {}, status: {} -> {}", userId, oldStatus, newStatus);
    }
    
    @Transactional
    public void updateUserRoles(Long userId, AdminUserRoleUpdateRequest request) {
        User user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));
        Set<Role> oldRoles = new HashSet<>(user.getRoles());
        Set<Role> newRoles = request.getRoles();
        user.setRoles(newRoles);
        user.setModifiedAt(LocalDateTime.now());
        userRepository.save(user);
        log.info("User roles updated - userId: {}, roles: {} -> {}", userId, oldRoles, newRoles);
    }
    
    @Transactional(readOnly = true)
    public Page<UserLogResponse> getUserLogs(Long userId, String logType, Pageable pageable) {
        User user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));
        
        Page<UserLog> logs;
        
        if (logType != null && !logType.isEmpty()) {
            try {
                UserLog.LogType type = UserLog.LogType.valueOf(logType.toUpperCase());
                logs = userLogRepository.findByUserAndLogType(user, type, pageable);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid log type: {}", logType);
                logs = userLogRepository.findByUser(user, pageable);
            }
        } else {
            logs = userLogRepository.findByUser(user, pageable);
        }
        
        return logs.map(UserLogResponse::from);
    }
    
    @Transactional(readOnly = true)
    public Resource exportUsers(String searchTerm, Role role, Status status, String format) {
        Specification<User> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                List<Predicate> searchPredicates = new ArrayList<>();
                String searchPattern = "%" + searchTerm.trim().toLowerCase() + "%";
                
                searchPredicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("userName")), searchPattern));
                searchPredicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), searchPattern));
                searchPredicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("phoneNum")), searchPattern));
                
                try {
                    searchPredicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.join("apartment").get("name")), searchPattern));
                } catch (Exception e) {
                    log.warn("Failed to join apartment for export search: {}", e.getMessage());
                }
                
                predicates.add(criteriaBuilder.or(searchPredicates.toArray(new Predicate[0])));
            }
            
            if (role != null) {
                predicates.add(criteriaBuilder.isMember(role, root.get("roles")));
            }
            
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
        
        List<User> users = userRepository.findAll(spec);
        
        if ("excel".equals(format)) {
            return generateExcelResource(users);
        } else {
            return generateCsvResource(users);
        }
    }
    
    private Resource generateExcelResource(List<User> users) {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            Sheet sheet = workbook.createSheet("Users");
            
            Row headerRow = sheet.createRow(0);
            String[] headers = {"번호", "이름", "이메일", "핸드폰 번호", "가입 방식", "아파트", "빌딩", "호수", "권한", "상태", "탈퇴 일시", "최근 로그인", "생성 일시", "수정 일시"};
            
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.autoSizeColumn(i);
            }
            
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            int total = users.size();
            int rowNum = 1;
            for (User user : users) {
                int number = total - (rowNum - 1);
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(number);
                row.createCell(1).setCellValue(user.getUserName());
                row.createCell(2).setCellValue(user.getEmail());
                row.createCell(3).setCellValue(user.getPhoneNum());
                row.createCell(4).setCellValue(user.getSocialProvider() != null ? user.getSocialProvider() : "일반");
                String apartmentName = user.getApartment() != null ? user.getApartment().getName() : "";
                row.createCell(5).setCellValue(apartmentName);
                String buildingName = user.getBuilding() != null ? user.getBuilding().getBuildingNumber() : "";
                row.createCell(6).setCellValue(buildingName);
                String unitNumber = user.getUnit() != null ? user.getUnit().getUnitNumber() : "";
                row.createCell(7).setCellValue(unitNumber);
                String roles = (user.getRoles() != null) ? 
                    user.getRoles().stream()
                            .map(Role::name)
                            .collect(Collectors.joining(", ")) :
                    "";
                row.createCell(8).setCellValue(roles);
                row.createCell(9).setCellValue(user.getStatus().name());
                String deletedAt = user.getDeletedAt() != null ? user.getDeletedAt().format(formatter) : "";
                row.createCell(10).setCellValue(deletedAt);
                String lastLoginAt = user.getLastLoginAt() != null ? user.getLastLoginAt().format(formatter) : "";
                row.createCell(11).setCellValue(lastLoginAt);
                String createdAt = user.getCreatedAt() != null ? user.getCreatedAt().format(formatter) : "";
                row.createCell(12).setCellValue(createdAt);
                String modifiedAt = user.getModifiedAt() != null ? user.getModifiedAt().format(formatter) : "";
                row.createCell(13).setCellValue(modifiedAt);
                for (int i = 0; i < headers.length; i++) {
                    sheet.autoSizeColumn(i);
                }
            }
            workbook.write(out);
            return new ByteArrayResource(out.toByteArray());
        } catch (IOException e) {
            log.error("Error generating Excel file", e);
            throw new RuntimeException("Excel 파일 생성 중 오류가 발생했습니다.", e);
        }
    }
    
    private Resource generateCsvResource(List<User> users) {
        StringBuilder csv = new StringBuilder();
        csv.append("번호,이름,이메일,핸드폰 번호,가입 방식,아파트,빌딩,호수,권한,상태,탈퇴 일시,최근 로그인,생성 일시,수정 일시\n");
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        int total = users.size();
        int rowNum = 1;
        for (User user : users) {
            int number = total - (rowNum - 1);
            csv.append(number).append(",");
            csv.append(escapeSpecialCharacters(user.getUserName())).append(",");
            csv.append(escapeSpecialCharacters(user.getEmail())).append(",");
            csv.append(escapeSpecialCharacters(user.getPhoneNum())).append(",");
            csv.append(escapeSpecialCharacters(user.getSocialProvider() != null ? user.getSocialProvider() : "일반")).append(",");
            String apartmentName = user.getApartment() != null ? user.getApartment().getName() : "";
            csv.append(escapeSpecialCharacters(apartmentName)).append(",");
            String buildingName = user.getBuilding() != null ? user.getBuilding().getBuildingNumber() : "";
            csv.append(escapeSpecialCharacters(buildingName)).append(",");
            String unitNumber = user.getUnit() != null ? user.getUnit().getUnitNumber() : "";
            csv.append(escapeSpecialCharacters(unitNumber)).append(",");
            String roles = (user.getRoles() != null) ? 
                user.getRoles().stream()
                        .map(Role::name)
                        .collect(Collectors.joining(", ")) :
                "";
            csv.append(escapeSpecialCharacters(roles)).append(",");
            csv.append(user.getStatus().name()).append(",");
            String deletedAt = user.getDeletedAt() != null ? user.getDeletedAt().format(formatter) : "";
            csv.append(deletedAt).append(",");
            String lastLoginAt = user.getLastLoginAt() != null ? user.getLastLoginAt().format(formatter) : "";
            csv.append(lastLoginAt).append(",");
            String createdAt = user.getCreatedAt() != null ? user.getCreatedAt().format(formatter) : "";
            csv.append(createdAt).append(",");
            String modifiedAt = user.getModifiedAt() != null ? user.getModifiedAt().format(formatter) : "";
            csv.append(modifiedAt).append("\n");
            rowNum++;
        }
        return new ByteArrayResource(csv.toString().getBytes());
    }
    
    private String escapeSpecialCharacters(String input) {
        if (input == null) {
            return "";
        }
        if (input.contains(",") || input.contains("\"") || input.contains("\n")) {
            return "\"" + input.replace("\"", "\"\"") + "\"";
        }
        return input;
    }
    
    private void createStatusChangeLog(User user, Status oldStatus, Status newStatus) {
        String description = String.format("상태 변경: %s -> %s", oldStatus, newStatus);
        
        Map<String, Object> detailsMap = new HashMap<>();
        detailsMap.put("oldStatus", oldStatus);
        detailsMap.put("newStatus", newStatus);
        
        String details;
        try {
            details = objectMapper.writeValueAsString(detailsMap);
        } catch (JsonProcessingException e) {
            log.error("Error converting status change details to JSON", e);
            details = String.format("oldStatus: %s, newStatus: %s", oldStatus, newStatus);
        }
        
        UserLog userLog = UserLog.builder()
                .user(user)
                .logType(UserLog.LogType.STATUS_CHANGE)
                .description(description)
                .ipAddress(getClientIp())
                .details(details)
                .createdAt(LocalDateTime.now())
                .build();
        
        userLogRepository.save(userLog);
    }
    
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
            log.warn("Failed to get client IP: {}", e.getMessage());
            return "unknown";
        }
    }
}