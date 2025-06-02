// backend/src/main/java/com/ohammer/apartner/global/controller/SseController.java
package com.ohammer.apartner.global.controller;

import com.ohammer.apartner.global.sse.SseEmitters;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.user.repository.UserRepository;
import com.ohammer.apartner.global.exception.SseException;
import com.ohammer.apartner.global.exception.ResourceNotFoundException;
import com.ohammer.apartner.global.response.ApiResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.Set;

@Controller
@RequestMapping("/sse")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "SSE", description = "서버 센트 이벤트(SSE) 관련 API")
public class SseController {
    private final SseEmitters sseEmitters;
    private final UserRepository userRepository;

    private static final long DEFAULT_TIMEOUT = 30 * 60 * 1000L; // 30분

    /**
     * 클라이언트의 SSE 연결 요청을 처리합니다.
     * 유저 ID를 쿼리 파라미터로 받습니다.
     */
    @GetMapping(value = "/connect", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "SSE 연결", description = "클라이언트의 SSE 연결 요청을 처리합니다.")
    public ResponseEntity<SseEmitter> connect(@RequestParam("userId") Long userId) {
        log.info("SSE 연결 요청 - userId: {}", userId);

        if (userId == null) {
            log.warn("SSE 연결 실패: userId가 필요합니다");
            throw new SseException("userId는 필수 파라미터입니다");
        }

        try {
            // DB에서 아파트 ID, 아파트 이름, role 조회
            Long apartmentId = null;
            String apartmentName = null;
            String role = null;
            
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("사용자 정보를 찾을 수 없습니다: " + userId));
            
            if (user.getApartment() != null) {
                apartmentId = user.getApartment().getId();
                apartmentName = user.getApartment().getName();
                log.info("userId={}의 apartmentId를 DB에서 조회: {}, 아파트명: {}", userId, apartmentId, apartmentName);
            }
            
            if (user.getRoles() != null && !user.getRoles().isEmpty()) {
                role = user.getRoles().iterator().next().name();
                log.info("userId={}의 role을 DB에서 조회: {}", userId, role);
            }
            
            // 유저 ID, 아파트 ID, 아파트 이름, 권한 정보와 함께 SSE 연결 생성
            SseEmitter emitter = sseEmitters.add(
                userId, 
                apartmentId,
                apartmentName,
                role
            );
            
            // HTTP/1.1 강제 및 적절한 헤더 설정으로 반환
            return ResponseEntity
                .ok()
                .header("X-Accel-Buffering", "no") // NGINX 사용 시 필요
                .header("Cache-Control", "no-cache, no-transform")
                .header("Connection", "keep-alive")
                .header("Content-Type", "text/event-stream;charset=UTF-8")
                .header("Transfer-Encoding", "chunked")
                .header("Pragma", "no-cache")
                .body(emitter);
        } catch (ResourceNotFoundException e) {
            log.error("SSE 연결 중 오류 발생: 사용자를 찾을 수 없습니다 - {}", e.getMessage());
            throw new SseException("사용자 정보를 찾을 수 없습니다: " + e.getMessage());
        } catch (SseException e) {
            log.error("SSE 연결 중 오류 발생: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("SSE 연결 중 예상치 못한 오류 발생", e);
            throw new SseException("SSE 연결 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * SSE 서버 상태 확인 엔드포인트
     */
    @GetMapping("/health")
    @Operation(summary = "SSE 서버 상태 확인", description = "SSE 서버의 상태를 확인합니다.")
    public ResponseEntity<ApiResponse<String>> healthCheck() {
        int connectedClients = sseEmitters.getConnectedCount();
        return ResponseEntity.ok(
            ApiResponse.success("SSE 서버 상태 확인", 
                               "SSE Server is running. Connected clients: " + connectedClients)
        );
    }
    
    /**
     * 특정 사용자의 연결 상태를 확인합니다.
     */
    @GetMapping("/status/{userId}")
    @Operation(summary = "사용자 연결 상태 확인", description = "특정 사용자의 SSE 연결 상태를 확인합니다.")
    public ResponseEntity<ApiResponse<Boolean>> checkUserStatus(@PathVariable Long userId) {
        boolean isConnected = sseEmitters.isUserConnected(userId);
        return ResponseEntity.ok(
            ApiResponse.success(
                isConnected ? "사용자가 연결되어 있습니다." : "사용자가 연결되어 있지 않습니다.", 
                isConnected
            )
        );
    }
    
    /**
     * 아파트별 연결된 사용자 목록 조회
     */
    @GetMapping("/apartment/{apartmentId}/users")
    @Operation(summary = "아파트별 연결된 사용자 목록", description = "특정 아파트에 연결된 사용자 ID 목록을 조회합니다.")
    public ResponseEntity<ApiResponse<Set<Long>>> getConnectedApartmentUsers(@PathVariable Long apartmentId) {
        Set<Long> userIds = sseEmitters.getApartmentUserIds(apartmentId);
        return ResponseEntity.ok(
            ApiResponse.success("아파트 연결 사용자 목록 조회 성공", userIds)
        );
    }
    
    /**
     * 전체 연결된 사용자 목록 조회
     */
    @GetMapping("/connected-users")
    @Operation(summary = "전체 연결된 사용자 목록", description = "전체 연결된 사용자 ID 목록을 조회합니다.")
    public ResponseEntity<ApiResponse<Set<Long>>> getAllConnectedUsers() {
        Set<Long> userIds = sseEmitters.getAllConnectedUserIds();
        return ResponseEntity.ok(
            ApiResponse.success("전체 연결 사용자 목록 조회 성공", userIds)
        );
    }
    
    /**
     * 사용자 연결 강제 종료
     */
    @DeleteMapping("/disconnect/{userId}")
    @Operation(summary = "사용자 연결 강제 종료", description = "특정 사용자의 SSE 연결을 강제로 종료합니다.")
    public ResponseEntity<ApiResponse<Boolean>> disconnectUser(@PathVariable Long userId) {
        boolean isConnected = sseEmitters.isUserConnected(userId);
        
        if (!isConnected) {
            return ResponseEntity.ok(
                ApiResponse.error("해당 사용자는 이미 연결되어 있지 않습니다.")
            );
        }
        
        // 사용자에게 연결 종료 알림 전송
        try {
            sseEmitters.notiToUser(userId, "disconnect", 
                java.util.Map.of(
                    "type", "disconnect",
                    "message", "관리자에 의해 연결이 종료되었습니다."
                )
            );
            
            // 실제 연결 종료는 클라이언트 측에서 이 이벤트를 받아 처리할 것임
            return ResponseEntity.ok(
                ApiResponse.success("사용자 연결 종료 요청이 전송되었습니다.", true)
            );
        } catch (Exception e) {
            log.error("사용자 연결 종료 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("사용자 연결 종료 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }
    
    /**
     * 정기적인 하트비트 전송 (5분마다)
     * 클라이언트의 연결 상태를 유지하기 위한 용도
     */
    @Scheduled(fixedRate = 300000) // 5분마다
    public void sendHeartbeat() {
        sseEmitters.sendHeartbeat();
    }
    
    /**
     * 수동 하트비트 전송 (테스트용)
     */
    @PostMapping("/heartbeat")
    @Operation(summary = "수동 하트비트 전송", description = "모든 클라이언트에게 하트비트 이벤트를 수동으로 전송합니다.")
    public ResponseEntity<ApiResponse<Void>> sendManualHeartbeat() {
        try {
            sseEmitters.sendHeartbeat();
            return ResponseEntity.ok(
                ApiResponse.success("모든 클라이언트에게 하트비트가 전송되었습니다.")
            );
        } catch (Exception e) {
            log.error("수동 하트비트 전송 중 오류 발생", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("하트비트 전송 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }
}