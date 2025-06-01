// backend/src/main/java/com/ohammer/apartner/global/sse/SseEmitters.java
package com.ohammer.apartner.global.sse;

import com.ohammer.apartner.global.util.Ut;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Component
@Slf4j
public class SseEmitters {
    // 유저 ID별 SSE 연결 관리 (여러 기기 연결 가능)
    private final Map<Long, List<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

    // 아파트 ID별 유저 ID 매핑 (권한별 알림용)
    private final Map<Long, Set<Long>> apartmentUsers = new ConcurrentHashMap<>();

    // 유저 ID별 아파트 ID 매핑
    private final Map<Long, Long> userApartments = new ConcurrentHashMap<>();

    // 유저 ID별 아파트 이름 매핑 (프론트엔드 필터링용)
    private final Map<Long, String> userApartmentNames = new ConcurrentHashMap<>();

    // 유저 ID별 권한 매핑
    private final Map<Long, String> userRoles = new ConcurrentHashMap<>();
    
    // 재연결 시도 횟수 관리
    private final Map<Long, AtomicInteger> reconnectAttempts = new ConcurrentHashMap<>();
    
    // 최대 재연결 시도 횟수
    private static final int MAX_RECONNECT_ATTEMPTS = 5;
    
    // 기본 타임아웃 시간 (30분)
    private static final long DEFAULT_TIMEOUT = 30 * 60 * 1000L;

    /**
     * 새로운 SSE 연결을 추가합니다.
     *
     * @param userId 사용자 ID
     * @param apartmentId 아파트 ID
     * @param apartmentName 아파트 이름 (프론트엔드 필터링용)
     * @param role 사용자 권한 (ADMIN, MANAGER, USER 등)
     * @return 생성된 SSE Emitter
     */
    public SseEmitter add(Long userId, Long apartmentId, String apartmentName, String role) {
        if (userId == null) {
            log.warn("userId가 null입니다. 연결을 추가할 수 없습니다.");
            throw new IllegalArgumentException("userId는 필수입니다");
        }

        SseEmitter emitter = new SseEmitter(DEFAULT_TIMEOUT);

        // 유저 ID별 emitter 관리
        userEmitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        // 아파트 정보 저장
        if (apartmentId != null) {
            apartmentUsers.computeIfAbsent(apartmentId, k -> ConcurrentHashMap.newKeySet()).add(userId);
            userApartments.put(userId, apartmentId);
        }

        // 아파트 이름 저장 (프론트엔드 필터링용)
        if (apartmentName != null) {
            userApartmentNames.put(userId, apartmentName);
        }

        // 사용자 권한 저장
        if (role != null) {
            userRoles.put(userId, role);
        }
        
        // 재연결 시도 횟수 초기화
        reconnectAttempts.put(userId, new AtomicInteger(0));

        // 완료, 타임아웃, 에러 콜백 설정
        emitter.onCompletion(() -> {
            removeEmitter(userId, emitter);
            log.info("SSE 연결 완료 - userId: {}, 현재 사용자 연결 수: {}", userId, getTotalConnections());
        });

        emitter.onTimeout(() -> {
            emitter.complete();
            removeEmitter(userId, emitter);
            log.info("SSE 연결 타임아웃 - userId: {}, 현재 사용자 연결 수: {}", userId, getTotalConnections());
        });

        emitter.onError(e -> {
            removeEmitter(userId, emitter);
            log.warn("SSE 연결 에러 - userId: {}, 에러: {}", userId, e.getMessage());
            
            // 재연결 시도 횟수 증가 및 확인
            AtomicInteger attempts = reconnectAttempts.get(userId);
            if (attempts != null && attempts.incrementAndGet() <= MAX_RECONNECT_ATTEMPTS) {
                log.info("SSE 재연결 시도 - userId: {}, 시도 횟수: {}/{}", userId, attempts.get(), MAX_RECONNECT_ATTEMPTS);
            } else {
                log.warn("SSE 최대 재연결 시도 횟수 초과 - userId: {}", userId);
                reconnectAttempts.remove(userId);
            }
        });

        try {
            // 연결된 클라이언트에게 초기 연결 성공 메시지 전송
            Map<String, Object> connectData = Map.of(
                "type", "connect",
                "message", "Connected successfully!",
                "userId", userId,
                "apartmentId", apartmentId != null ? apartmentId : "",
                "apartmentName", apartmentName != null ? apartmentName : "",
                "role", role != null ? role : ""
            );
            
            emitter.send(SseEmitter.event()
                    .name("connect")
                    .data(connectData));

            log.info("SSE 연결 추가 - userId: {}, apartmentId: {}, apartmentName: {}, role: {}, 현재 사용자 연결 수: {}",
                    userId, apartmentId, apartmentName, role, getTotalConnections());
        } catch (IOException e) {
            log.error("SSE 초기 메시지 전송 실패", e);
            removeEmitter(userId, emitter);
        }

        return emitter;
    }

    /**
     * 특정 사용자의 SSE 연결을 제거합니다.
     */
    private void removeEmitter(Long userId, SseEmitter emitter) {
        if (userId != null && userEmitters.containsKey(userId)) {
            userEmitters.get(userId).remove(emitter);

            // 해당 사용자의 emitter가 모두 제거되면 맵에서 사용자 항목도 제거
            if (userEmitters.get(userId).isEmpty()) {
                userEmitters.remove(userId);

                // 아파트 매핑에서도 제거
                Long apartmentId = userApartments.remove(userId);
                if (apartmentId != null && apartmentUsers.containsKey(apartmentId)) {
                    apartmentUsers.get(apartmentId).remove(userId);
                    if (apartmentUsers.get(apartmentId).isEmpty()) {
                        apartmentUsers.remove(apartmentId);
                    }
                }

                // 아파트 이름 매핑에서도 제거
                userApartmentNames.remove(userId);

                // 권한 매핑에서도 제거
                userRoles.remove(userId);
                
                // 재연결 시도 정보 제거
                reconnectAttempts.remove(userId);
            }
        }
    }

    /**
     * 특정 사용자에게 알림을 전송합니다.
     *
     * @param userId 알림을 받을 사용자 ID
     * @param eventName 이벤트 이름
     * @param data 전송할 데이터
     * @return 전송 성공 여부
     */
    public boolean notiToUser(Long userId, String eventName, Map<String, Object> data) {
        if (userId == null || !userEmitters.containsKey(userId)) {
            log.warn("사용자가 연결되어 있지 않아 알림을 전송할 수 없습니다. userId: {}", userId);
            return false;
        }

        log.info("사용자에게 알림 전송 - userId: {}, 이벤트: {}, 데이터: {}", userId, eventName, data);
        
        // 아파트 이름 추가 (프론트엔드 필터링용)
        String apartmentName = userApartmentNames.get(userId);
        if (apartmentName != null && !data.containsKey("apartmentName")) {
            data.put("apartmentName", apartmentName);
        }

        List<SseEmitter> emitters = userEmitters.get(userId);
        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();
        boolean allSuccess = true;

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventName)
                        .data(data));
            } catch (IOException e) {
                deadEmitters.add(emitter);
                allSuccess = false;
                if (e.getMessage() != null && e.getMessage().contains("Broken pipe")) {
                    log.warn("클라이언트 연결 종료 - userId: {}", userId);
                } else {
                    log.error("사용자 알림 전송 오류 - userId: {}", userId, e);
                }
            }
        }

        // 죽은 emitter 제거
        if (!deadEmitters.isEmpty()) {
            emitters.removeAll(deadEmitters);
            if (emitters.isEmpty()) {
                userEmitters.remove(userId);
            }
        }
        
        return allSuccess;
    }

    /**
     * 특정 아파트의 관리자들(ADMIN, MANAGER)에게 알림을 전송합니다.
     *
     * @param apartmentId 아파트 ID
     * @param eventName 이벤트 이름
     * @param data 전송할 데이터
     * @return 전송 성공 여부
     */
    public boolean notiToApartmentAdmins(Long apartmentId, String eventName, Map<String, Object> data) {
        if (apartmentId == null || !apartmentUsers.containsKey(apartmentId)) {
            log.warn("해당 아파트에 연결된 사용자가 없습니다. apartmentId: {}", apartmentId);
            return false;
        }

        Set<Long> userIds = apartmentUsers.get(apartmentId);

        // ADMIN과 MANAGER 권한을 가진 사용자만 필터링
        Set<Long> adminUserIds = userIds.stream()
                .filter(userId -> {
                    String role = userRoles.get(userId);
                    return role != null && (role.equals("ADMIN") || role.equals("MANAGER"));
                })
                .collect(Collectors.toSet());

        log.info("아파트 관리자들에게 알림 전송 - apartmentId: {}, 관리자 수: {}, 이벤트: {}",
                apartmentId, adminUserIds.size(), eventName);
                
        // 아파트 이름 추가 (아파트 ID가 있는 경우)
        if (!data.containsKey("apartmentId")) {
            data.put("apartmentId", apartmentId);
        }

        // 각 관리자에게 알림 전송
        boolean allSuccess = true;
        for (Long userId : adminUserIds) {
            if (!notiToUser(userId, eventName, data)) {
                allSuccess = false;
            }
        }
        
        return allSuccess;
    }

    /**
     * 특정 아파트의 모든 사용자에게 알림을 전송합니다.
     *
     * @param apartmentId 아파트 ID
     * @param eventName 이벤트 이름
     * @param data 전송할 데이터
     * @return 전송 성공 여부
     */
    public boolean notiToApartmentUsers(Long apartmentId, String eventName, Map<String, Object> data) {
        if (apartmentId == null || !apartmentUsers.containsKey(apartmentId)) {
            log.warn("해당 아파트에 연결된 사용자가 없습니다. apartmentId: {}", apartmentId);
            return false;
        }

        Set<Long> userIds = apartmentUsers.get(apartmentId);
        
        log.info("아파트 사용자들에게 알림 전송 - apartmentId: {}, 사용자 수: {}, 이벤트: {}",
                apartmentId, userIds.size(), eventName);
                
        // 아파트 이름 추가 (아파트 ID가 있는 경우)
        if (!data.containsKey("apartmentId")) {
            data.put("apartmentId", apartmentId);
        }

        // 각 사용자에게 알림 전송
        boolean allSuccess = true;
        for (Long userId : userIds) {
            if (!notiToUser(userId, eventName, data)) {
                allSuccess = false;
            }
        }
        
        return allSuccess;
    }

    /**
     * 연결된 모든 클라이언트에게 이벤트를 전송합니다. (전체 브로드캐스트)
     *
     * @param eventName 이벤트 이름
     * @param data 전송할 데이터
     * @return 전송 성공 여부
     */
    public boolean notiToAll(String eventName, Map<String, Object> data) {
        log.info("모든 사용자에게 알림 전송 - 이벤트: {}, 데이터: {}, 대상 사용자 수: {}",
                eventName, data, userEmitters.size());

        // 모든 사용자에게 알림 전송
        boolean allSuccess = true;
        for (Long userId : userEmitters.keySet()) {
            if (!notiToUser(userId, eventName, data)) {
                allSuccess = false;
            }
        }
        
        return allSuccess;
    }

    /**
     * 이전 noti 메서드 호환성 유지 (전체 브로드캐스트)
     */
    public boolean noti(String eventName, Map<String, Object> data) {
        return notiToAll(eventName, data);
    }

    /**
     * 헬스 체크 이벤트를 모든 클라이언트에게 전송합니다.
     */
    public void sendHeartbeat() {
        Map<String, Object> heartbeatData = Map.of(
            "type", "heartbeat",
            "timestamp", System.currentTimeMillis()
        );
        
        log.debug("하트비트 전송 - 연결된 사용자 수: {}", userEmitters.size());
        notiToAll("heartbeat", heartbeatData);
    }

    /**
     * 현재 연결된 총 클라이언트 수를 반환합니다.
     */
    public int getTotalConnections() {
        return userEmitters.values().stream()
                .mapToInt(List::size)
                .sum();
    }

    /**
     * 현재 연결된 사용자 수를 반환합니다.
     */
    public int getConnectedCount() {
        return userEmitters.size();
    }

    /**
     * 특정 사용자가 연결되어 있는지 확인합니다.
     */
    public boolean isUserConnected(Long userId) {
        return userEmitters.containsKey(userId) && !userEmitters.get(userId).isEmpty();
    }

    /**
     * 아파트별 연결된 유저 ID 집합 반환
     */
    public Set<Long> getApartmentUserIds(Long apartmentId) {
        return apartmentUsers.getOrDefault(apartmentId, java.util.Collections.emptySet());
    }

    /**
     * 전체 연결된 유저 ID 집합 반환
     */
    public Set<Long> getAllConnectedUserIds() {
        return userEmitters.keySet();
    }
    
    /**
     * 특정 사용자의 아파트 이름을 반환합니다.
     */
    public String getUserApartmentName(Long userId) {
        return userApartmentNames.get(userId);
    }
}