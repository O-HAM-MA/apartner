// backend/src/main/java/com/ohammer/apartner/global/controller/AlarmController.java
package com.ohammer.apartner.global.controller;

import com.ohammer.apartner.global.dto.AlarmRequest;
import com.ohammer.apartner.global.response.ApiResponse;
import com.ohammer.apartner.global.sse.SseEmitters;
import com.ohammer.apartner.global.entity.Notification;
import com.ohammer.apartner.global.service.AlarmService;
import com.ohammer.apartner.global.exception.ResourceNotFoundException;
import com.ohammer.apartner.global.exception.BadRequestException;
import com.ohammer.apartner.global.Status;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

@RestController
@RequestMapping("/api/v1/alarm")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "알림", description = "알림 관련 API")
public class AlarmController {

    private final AlarmService alarmService;

    /**
     * 내 읽지 않은 알림 목록 조회
     */
    @GetMapping("/notifications/unread")
    @Operation(summary = "내 읽지 않은 알림 목록 조회", description = "로그인 사용자의 읽지 않은 알림 목록을 조회합니다.")
    public ResponseEntity<ApiResponse<List<Notification>>> getUnreadUserNotifications() {
        try {
            log.info("내 읽지 않은 알림 조회");
            List<Notification> notifications = alarmService.getUnreadNotifications();
            log.info("내 읽지 않은 알림 조회 완료 - 알림 수: {}", notifications.size());
            return ResponseEntity.ok(ApiResponse.success("읽지 않은 알림 조회 성공", notifications));
        } catch (Exception e) {
            log.error("알림 조회 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("알림 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * 내 모든 알림 목록 조회 (읽은 알림 포함)
     */
    @GetMapping("/notifications")
    @Operation(summary = "내 알림 목록 조회", description = "로그인 사용자의 모든 알림 목록을 조회합니다(읽은 알림 포함).")
    public ResponseEntity<ApiResponse<List<Notification>>> getUserNotifications() {
        try {
            log.info("내 전체 알림 조회");
            Long userId = com.ohammer.apartner.security.utils.SecurityUtil.getCurrentUserId();
            List<Notification> notifications = alarmService.getUserNotificationsByStatus(userId, com.ohammer.apartner.global.Status.ACTIVE);
            log.info("내 전체 알림 조회 완료 - 알림 수: {}", notifications.size());
            return ResponseEntity.ok(ApiResponse.success("알림 조회 성공", notifications));
        } catch (Exception e) {
            log.error("알림 조회 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("알림 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * 단일 알림 읽음 처리
     */
    @PostMapping("/notifications/{notificationId}/read")
    @Operation(summary = "알림 읽음 처리", description = "특정 알림을 읽음 상태로 변경합니다.")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long notificationId) {
        try {
            alarmService.markAsRead(notificationId);
            return ResponseEntity.ok(ApiResponse.success("알림이 읽음 상태로 변경되었습니다."));
        } catch (Exception e) {
            log.error("알림 읽음 처리 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("알림 읽음 처리 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * 내 모든 알림 읽음 처리
     */
    @PostMapping("/notifications/read_all")
    @Operation(summary = "모든 알림 읽음 처리", description = "로그인 사용자의 모든 알림을 읽음 상태로 변경합니다.")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        try {
            alarmService.markAllAsRead();
            return ResponseEntity.ok(ApiResponse.success("모든 알림이 읽음 상태로 변경되었습니다."));
        } catch (Exception e) {
            log.error("알림 전체 읽음 처리 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("알림 전체 읽음 처리 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * 내 읽은 알림 삭제 (특정 기간 이전)
     */
    @DeleteMapping("/notifications/read")
    @Operation(summary = "읽은 알림 삭제", description = "로그인 사용자의 읽은 알림을 삭제합니다.")
    public ResponseEntity<ApiResponse<Integer>> deleteReadNotifications(@RequestParam(defaultValue = "30") int days) {
        try {
            if (days < 1) {
                throw new com.ohammer.apartner.global.exception.BadRequestException("삭제 기간은 최소 1일 이상이어야 합니다.");
            }
            log.info("읽은 알림 삭제 - days: {}", days);
            int deletedCount = alarmService.deleteReadNotifications(days);
            log.info("읽은 알림 삭제 완료 - 삭제된 알림 수: {}", deletedCount);
            return ResponseEntity.ok(ApiResponse.success(days + "일 이전에 읽은 알림이 삭제되었습니다.", deletedCount));
        } catch (com.ohammer.apartner.global.exception.BadRequestException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("알림 삭제 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("알림 삭제 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * 페이징을 지원하는 사용자별 알림 조회
     */
    @GetMapping("/notifications/{userId}/paged")
    @Operation(summary = "페이징된 알림 목록 조회", description = "특정 사용자의 알림 목록을 페이징하여 조회합니다.")
    public ResponseEntity<ApiResponse<Page<Notification>>> getPagedUserNotifications(
            @PathVariable Long userId,
            @PageableDefault(size = 20) Pageable pageable) {
        try {
            log.info("사용자 페이징 알림 조회 - userId: {}", userId);
            Page<Notification> notifications = alarmService.getUserNotifications(userId, pageable);
            log.info("사용자 페이징 알림 조회 완료 - userId: {}, 총 알림 수: {}", userId, notifications.getTotalElements());
            return ResponseEntity.ok(ApiResponse.success("사용자 알림 조회 성공", notifications));
        } catch (Exception e) {
            log.error("사용자 알림 조회 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("알림 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }
    
    /**
     * 카테고리별 알림 목록 조회
     */
    @GetMapping("/notifications/{userId}/category/{category}")
    @Operation(summary = "카테고리별 알림 목록 조회", description = "특정 사용자의 알림을 카테고리별로 조회합니다.")
    public ResponseEntity<ApiResponse<List<Notification>>> getUserNotificationsByCategory(
            @PathVariable Long userId,
            @PathVariable String category) {
        try {
            log.info("카테고리별 알림 조회 - userId: {}, category: {}", userId, category);
            List<Notification> notifications = alarmService.getUserNotificationsByCategory(userId, category);
            log.info("카테고리별 알림 조회 완료 - userId: {}, category: {}, 알림 수: {}", userId, category, notifications.size());
            return ResponseEntity.ok(ApiResponse.success("카테고리별 알림 조회 성공", notifications));
        } catch (Exception e) {
            log.error("카테고리별 알림 조회 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("알림 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }
    
    /**
     * 타입별 알림 목록 조회
     */
    @GetMapping("/notifications/{userId}/type/{type}")
    @Operation(summary = "타입별 알림 목록 조회", description = "특정 사용자의 알림을 타입별로 조회합니다.")
    public ResponseEntity<ApiResponse<List<Notification>>> getUserNotificationsByType(
            @PathVariable Long userId,
            @PathVariable String type) {
        try {
            log.info("타입별 알림 조회 - userId: {}, type: {}", userId, type);
            List<Notification> notifications = alarmService.getUserNotificationsByType(userId, type);
            log.info("타입별 알림 조회 완료 - userId: {}, type: {}, 알림 수: {}", userId, type, notifications.size());
            return ResponseEntity.ok(ApiResponse.success("타입별 알림 조회 성공", notifications));
        } catch (Exception e) {
            log.error("타입별 알림 조회 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("알림 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }
    
    /**
     * 알림 상세 조회
     */
    @GetMapping("/notifications/detail/{notificationId}")
    @Operation(summary = "알림 상세 조회", description = "특정 알림의 상세 정보를 조회합니다.")
    public ResponseEntity<ApiResponse<Notification>> getNotificationDetail(@PathVariable Long notificationId) {
        try {
            log.info("알림 상세 조회 - notificationId: {}", notificationId);
            Notification notification = alarmService.getNotification(notificationId);
            return ResponseEntity.ok(ApiResponse.success("알림 상세 조회 성공", notification));
        } catch (ResourceNotFoundException e) {
            log.warn("알림 상세 조회 실패 - 알림을 찾을 수 없음: {}", notificationId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("알림 상세 조회 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("알림 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }
    
    /**
     * 아파트별 알림 목록 조회
     */
    @GetMapping("/notifications/apartment/{apartmentId}")
    @Operation(summary = "아파트별 알림 목록 조회", description = "특정 아파트의 모든 알림을 조회합니다.")
    public ResponseEntity<ApiResponse<List<Notification>>> getApartmentNotifications(
            @PathVariable Long apartmentId,
            @RequestParam(required = false, defaultValue = "ACTIVE") Status status) {
        try {
            log.info("아파트별 알림 조회 - apartmentId: {}, status: {}", apartmentId, status);
            List<Notification> notifications = alarmService.getApartmentNotificationsByStatus(apartmentId, status);
            log.info("아파트별 알림 조회 완료 - apartmentId: {}, 알림 수: {}", apartmentId, notifications.size());
            return ResponseEntity.ok(ApiResponse.success("아파트별 알림 조회 성공", notifications));
        } catch (Exception e) {
            log.error("아파트별 알림 조회 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("알림 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }
}