// backend/src/main/java/com/ohammer/apartner/global/dto/AlarmRequest.java
package com.ohammer.apartner.global.dto;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Slf4j
public class AlarmRequest {
    private String type;
    private String title;
    private String message;
    private String linkUrl;
    private String businessType;
    private Long entityId;
    private Long senderId;
    private String category;
    private Map<String, Object> extraData;
    private String data; // 기존 호환성 유지

    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 알림 데이터를 Map으로 변환하여 반환합니다.
     */
    public Map<String, Object> getData() {
        Map<String, Object> result = new HashMap<>();
        
        // 기본 필드 추가
        result.put("type", type != null ? type : "info");
        result.put("title", title != null ? title : (type != null ? type : "알림"));
        result.put("message", message != null ? message : "");
        
        // 선택적 필드 추가
        if (linkUrl != null && !linkUrl.isEmpty()) {
            result.put("linkUrl", linkUrl);
        }
        
        if (entityId != null) {
            result.put("entityId", entityId);
        }
        
        if (senderId != null) {
            result.put("senderId", senderId);
        }
        
        if (category != null && !category.isEmpty()) {
            result.put("category", category);
        }
        
        // extraData가 있으면 추가
        if (extraData != null && !extraData.isEmpty()) {
            result.putAll(extraData);
        }
        
        // 기존 data 필드 처리 (JSON 문자열이면 파싱)
        if (data != null && !data.isEmpty()) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> dataMap = objectMapper.readValue(data, Map.class);
                result.putAll(dataMap);
            } catch (JsonProcessingException e) {
                log.warn("JSON 파싱 실패: {}", e.getMessage());
                result.put("data", data); // 파싱 실패 시 원본 문자열 저장
            }
        }
        
        return result;
    }
}