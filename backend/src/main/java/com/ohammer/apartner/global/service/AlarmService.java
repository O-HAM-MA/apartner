// src/main/java/com/ohammer/apartner/global/service/AlarmService.java
package com.ohammer.apartner.global.service;

import com.ohammer.apartner.global.sse.SseEmitters;
import com.ohammer.apartner.global.util.Ut;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import com.ohammer.apartner.global.repository.NotificationRepository;
import com.ohammer.apartner.global.entity.Notification;
import com.ohammer.apartner.global.Status;
import com.ohammer.apartner.global.dto.NotificationSaveDto;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.user.entity.Role;
import com.ohammer.apartner.domain.user.repository.UserRepository;
import com.ohammer.apartner.domain.apartment.repository.ApartmentRepository;
import com.ohammer.apartner.global.exception.ResourceNotFoundException;
import com.ohammer.apartner.security.utils.SecurityUtil;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;
import java.util.Set;
import java.util.List;
import java.util.Arrays;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlarmService {
    private final SseEmitters sseEmitters;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ApartmentRepository apartmentRepository;
    private final SecurityUtil securityUtil;

    // 아파트 관리자에게 알림 (확장된 버전)
    @Transactional
    public void notifyApartmentAdmins(Long apartmentId, String title, String type, String businessType, String message, 
                                      String linkUrl, Long senderId, Long entityId, Map<String, Object> extra) {
        Map<String, Object> payload = buildPayload(title, type, message, linkUrl, entityId, extra);
        log.info("아파트 관리자 알림 전송 - apartmentId: {}, title: {}, type: {}, entityId: {}", 
                 apartmentId, title, type, entityId);
        
        // 아파트 관리자 목록 조회 (ADMIN, MANAGER 역할을 가진 사용자)
        List<User> adminUsers = userRepository.findByApartmentIdAndRolesIn(
            apartmentId, Arrays.asList(Role.ADMIN, Role.MANAGER));
        
        log.info("아파트 관리자 수: {}", adminUsers.size());
        
        // 모든 관리자에게 알림 저장 (온/오프라인 상관없이)
        for (User admin : adminUsers) {
            saveNotification(new NotificationSaveDto(
                admin.getId(), apartmentId, title, message, type, businessType, linkUrl, senderId, entityId, extra));
        }
        
        // 온라인 상태인 관리자에게 실시간 알림 전송
        sseEmitters.notiToApartmentAdmins(
            apartmentId,
            "alarm",
            payload
        );
    }

    // 아파트 관리자에게 알림 (기존 메소드 유지)
    @Transactional
    public void notifyApartmentAdmins(Long apartmentId, String type, String businessType, String message, Map<String, Object> extra) {
        // 타입을 제목으로 사용
        notifyApartmentAdmins(apartmentId, type, type, businessType, message, null, null, null, extra);
    }

    // 알림 DB 저장 공통 메서드 (DTO 기반)
    private void saveNotification(NotificationSaveDto dto) {
        try {
            Notification notification = Notification.builder()
                .userId(dto.getUserId())
                .apartmentId(dto.getApartmentId())
                .title(dto.getTitle())
                .message(dto.getMessage())
                .type(dto.getType())
                .businessType(dto.getBusinessType())
                .status(Status.ACTIVE)
                .isRead(false)
                .linkUrl(dto.getLinkUrl())
                .senderId(dto.getSenderId())
                .entityId(dto.getEntityId())
                .extra(dto.getExtra() != null ? dto.getExtra().toString() : null)
                .expiredAt(LocalDateTime.now().plusDays(30))    
                .build();
            notificationRepository.save(notification);
            log.debug("알림 저장 완료 - userId: {}, title: {}", dto.getUserId(), dto.getTitle());
        } catch (Exception e) {
            log.error("알림 저장 실패 - userId: {}, 오류: {}", dto.getUserId(), e.getMessage(), e);
        }
    }

    // 특정 아파트의 모든 사용자에게 알림 (확장된 버전)
    @Transactional
    public void notifyApartmentUsers(Long apartmentId, String title, String type, String businessType, String message, 
                                    String linkUrl, Long senderId, Long entityId, Map<String, Object> extra) {
        Map<String, Object> payload = buildPayload(title, type, message, linkUrl, entityId, extra);
        log.info("아파트 사용자 알림 전송 - apartmentId: {}, title: {}, type: {}, entityId: {}", 
                 apartmentId, title, type, entityId);
        
        // 해당 아파트의 모든 사용자 조회 (온/오프라인 상관없이)
        List<User> apartmentUsers = userRepository.findByApartmentId(apartmentId);
        log.info("아파트 전체 사용자 수: {}", apartmentUsers.size());
        
        // 모든 사용자에게 알림 저장
        for (User user : apartmentUsers) {
            saveNotification(new NotificationSaveDto(
                user.getId(), apartmentId, title, message, type, businessType, linkUrl, senderId, entityId, extra));
        }

        // 온라인 상태인 사용자에게 실시간 알림 전송
        sseEmitters.notiToApartmentUsers(
            apartmentId,
            "alarm",
            payload
        );
    }

    // 특정 아파트의 모든 사용자에게 알림 (기본 버전)
    @Transactional
    public void notifyApartmentUsers(Long apartmentId, String type, String businessType, String message, Map<String, Object> extra) {
        // 타입을 제목으로 사용
        notifyApartmentUsers(apartmentId, type, type, businessType, message, null, null, null, extra);
    }

    // 간편하게 아파트 사용자에게 알림 전송 (링크 포함)
    @Transactional
    public void notifyApartmentUsers(Long apartmentId, String title, String type, String businessType, String message, String linkUrl, Long entityId) {
        notifyApartmentUsers(apartmentId, title, type, businessType, message, linkUrl, null, entityId, null);
    }

    // 특정 유저에게 알림 (확장된 버전, apartmentId 명시적 전달)
    @Transactional
    public void notifyUser(Long userId, Long apartmentId, String title, String type, String businessType, String message, 
                          String linkUrl, Long senderId, Long entityId, Map<String, Object> extra) {
        Map<String, Object> payload = buildPayload(title, type, message, linkUrl, entityId, extra);
        log.info("유저 알림 전송(apartmentId 명시) - userId: {}, apartmentId: {}, title: {}, type: {}, entityId: {}", 
                 userId, apartmentId, title, type, entityId);
        // 유저 존재 여부 확인 (선택적)
        userRepository.findById(userId).ifPresent(user -> {
            // DB에 알림 저장
            saveNotification(new NotificationSaveDto(
                userId, apartmentId, title, message, type, businessType, linkUrl, senderId, entityId, extra));
            // 온라인이면 실시간 알림 전송
            sseEmitters.notiToUser(userId, "alarm", payload);
        });
    }

    // 특정 유저에게 알림 (기존 메소드 유지)
    @Transactional
    public void notifyUser(Long userId, String type, String businessType, String message, Map<String, Object> extra) {
        // 타입을 제목으로 사용
        notifyUser(userId, null, type, type, businessType, message, null, null, null, extra);
    }

    // 간편하게 유저에게 알림 전송 (링크 포함)
    @Transactional
    public void notifyUser(Long userId, String title, String type, String businessType, String message, String linkUrl, Long entityId) {
        notifyUser(userId, null, title, type, businessType, message, linkUrl, null, entityId, null);
    }

    // 간편하게 유저에게 알림 전송 (기본)
    @Transactional
    public void notifyUser(Long userId, String title, String type, String businessType, String message) {
        notifyUser(userId, null, title, type, businessType, message, null, null, null, null);
    }

    // 전체 알림 (확장된 버전)
    @Transactional
    public void notifyAll(String title, String type, String businessType, String message, 
                         String linkUrl, Long senderId, Long entityId, Map<String, Object> extra) {
        Map<String, Object> payload = buildPayload(title, type, message, linkUrl, entityId, extra);
        log.info("전체 알림 전송 - title: {}, type: {}, entityId: {}", title, type, entityId);
        
        // 전체 사용자 조회 (온/오프라인 상관없이)
        List<User> allUsers = userRepository.findAll();
        log.info("전체 사용자 수: {}", allUsers.size());
        
        // 모든 사용자에게 알림 저장
        for (User user : allUsers) {
            saveNotification(new NotificationSaveDto(
                user.getId(), 
                user.getApartment() != null ? user.getApartment().getId() : null,
                title, message, type, businessType, linkUrl, senderId, entityId, extra));
        }

        // 온라인 상태인 사용자에게 실시간 알림 전송
        sseEmitters.notiToAll("alarm", payload);
    }

    // 전체 알림 (기존 메소드 유지)
    @Transactional
    public void notifyAll(String type, String businessType, String message, Map<String, Object> extra) {
        // 타입을 제목으로 사용
        notifyAll(type, type, businessType, message, null, null, null, extra);
    }

    // 기존 buildPayload 메소드 유지 (하위 호환성)
    private Map<String, Object> buildPayload(String type, String message, Map<String, Object> extra) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", type);
        payload.put("message", message);
        
        // title이 extra에 없으면 type을 기본 title로 사용
        if (extra == null || !extra.containsKey("title")) {
            payload.put("title", type);
        }
        
        if (extra != null) payload.putAll(extra);
        return payload;
    }

    // 새로운 buildPayload 메소드 (확장된 필드 지원)
    private Map<String, Object> buildPayload(String title, String type, String message, 
                                            String linkUrl, Long entityId, Map<String, Object> extra) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("title", title);
        payload.put("type", type);
        payload.put("message", message);
        
        // 선택적 필드 추가
        if (linkUrl != null && !linkUrl.isEmpty()) {
            payload.put("linkUrl", linkUrl);
        }
        
        if (entityId != null) {
            payload.put("entityId", entityId);
        }
        
        // 추가 데이터가 있으면 포함
        if (extra != null) {
            payload.putAll(extra);
        }
        
        return payload;
    }

    // 빠른 알림 생성을 위한 유틸리티 메소드
    public static Map<String, Object> createNotificationData(String title, String message, String linkUrl, Long entityId) {
        return Ut.mapOf(
            "title", title,
            "message", message,
            "linkUrl", linkUrl,
            "entityId", entityId
        );
    }
    
    // 읽지 않은 알림 조회
    public List<Notification> getUnreadNotifications() {
        Long userId = SecurityUtil.getCurrentUserId();
        if (userId == null) throw new RuntimeException("로그인 필요");
        return notificationRepository.findByUserIdAndIsReadFalseAndStatus(userId, Status.ACTIVE);
    }
    
    // 알림 읽음 처리
    @Transactional
    public void markAsRead(Long notificationId) {
        Long userId = SecurityUtil.getCurrentUserId();
        if (userId == null) throw new RuntimeException("로그인 필요");
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            if (!userId.equals(notification.getUserId())) throw new RuntimeException("본인 알림만 읽음 처리 가능");
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        });
    }
    
    // 모든 알림 읽음 처리
    @Transactional
    public void markAllAsRead() {
        Long userId = SecurityUtil.getCurrentUserId();
        if (userId == null) throw new RuntimeException("로그인 필요");
        List<Notification> unreadNotifications = 
            notificationRepository.findByUserIdAndIsReadFalseAndStatus(userId, Status.ACTIVE);
        for (Notification notification : unreadNotifications) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
        }
        if (!unreadNotifications.isEmpty()) {
            notificationRepository.saveAll(unreadNotifications);
        }
    }
    
    // 페이징을 지원하는 사용자별 알림 조회
    public Page<Notification> getUserNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, Status.ACTIVE, pageable);
    }
    
    // 카테고리별 알림 조회
    public List<Notification> getUserNotificationsByCategory(Long userId, String category) {
        return notificationRepository.findByUserIdAndCategoryAndStatus(userId, category, Status.ACTIVE);
    }
    
    // 타입별 알림 조회
    public List<Notification> getUserNotificationsByType(Long userId, String type) {
        return notificationRepository.findByUserIdAndTypeAndStatus(userId, type, Status.ACTIVE);
    }
    
    // 아파트별 알림 조회
    public List<Notification> getApartmentNotifications(Long apartmentId) {
        return notificationRepository.findByApartmentIdAndStatus(apartmentId, Status.ACTIVE);
    }
    
    // 알림 상세 조회
    public Notification getNotification(Long notificationId) {
        return notificationRepository.findById(notificationId)
            .orElseThrow(() -> new ResourceNotFoundException("알림을 찾을 수 없습니다: " + notificationId));
    }
    
    // 읽은 알림 삭제 (특정 기간 이전)
    @Transactional
    public int deleteReadNotifications(int days) {
        Long userId = SecurityUtil.getCurrentUserId();
        if (userId == null) throw new RuntimeException("로그인 필요");
        LocalDateTime beforeDate = LocalDateTime.now().minusDays(days);
        return notificationRepository.deleteReadNotificationsOlderThan(userId, beforeDate);
    }
    
    // 알림 만료 처리 (정기적으로 실행)
    @Scheduled(cron = "0 0 3 * * ?") // 매일 새벽 3시에 실행
    @Transactional
    public void processExpiredNotifications() {
        LocalDateTime now = LocalDateTime.now();
        int updatedCount = notificationRepository.updateExpiredNotifications(now, Status.INACTIVE);
        log.info("만료된 알림 처리 완료 - 처리된 알림 수: {}", updatedCount);
    }
    
    // 카테고리별 알림 전송 (카테고리 지정 버전)
    @Transactional
    public void notifyUserWithCategory(Long userId, String title, String type, String businessType, String message, 
                                     String category, String linkUrl, Long entityId) {
        // 유저 확인
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다: " + userId));
        
        // 알림 생성
        Notification notification = Notification.builder()
            .userId(userId)
            .apartmentId(user.getApartment() != null ? user.getApartment().getId() : null)
            .title(title)
            .message(message)
            .type(type)
            .businessType(businessType)
            .category(category)
            .status(Status.ACTIVE)
            .isRead(false)
            .linkUrl(linkUrl)
            .entityId(entityId)
            .expiredAt(LocalDateTime.now().plusDays(30))
            .build();
            
        notificationRepository.save(notification);
        
        // 온라인 상태면 실시간 알림 전송
        if (sseEmitters.isUserConnected(userId)) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("title", title);
            payload.put("type", type);
            payload.put("message", message);
            payload.put("category", category);
            
            if (linkUrl != null) {
                payload.put("linkUrl", linkUrl);
            }
            
            if (entityId != null) {
                payload.put("entityId", entityId);
            }
            
            sseEmitters.notiToUser(userId, "alarm", payload);
        }
    }
    
    //특정 상태의 사용자별 알림 목록 조회 (읽은 알림 포함, 최신순 10개)
    public List<Notification> getUserNotificationsByStatus(Long userId, Status status) {
        // 사용자 확인
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("사용자를 찾을 수 없습니다: " + userId);
        }
        
        // 사용자 ID와 상태로 알림 조회 (최신순, 최대 10개)
        return notificationRepository.findTop10ByUserIdAndStatusOrderByCreatedAtDesc(userId, status);
    }
    
    //특정 상태의 아파트별 알림 목록 조회 (최신순 10개)
    public List<Notification> getApartmentNotificationsByStatus(Long apartmentId, Status status) {
        // 아파트 확인
        if (!apartmentRepository.existsById(apartmentId)) {
            throw new ResourceNotFoundException("아파트를 찾을 수 없습니다: " + apartmentId);
        }
        
        // 아파트 ID와 상태로 알림 조회 (최신순, 최대 10개)
        return notificationRepository.findTop10ByApartmentIdAndStatusOrderByCreatedAtDesc(apartmentId, status);
    }
}