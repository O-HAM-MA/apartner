package com.ohammer.apartner.domain.user.dto;

import com.ohammer.apartner.domain.user.entity.UserLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserLogResponse {
    private Long id;
    private Long userId;
    private String userName;
    private UserLog.LogType logType;
    private String description;
    private LocalDateTime createdAt;
    private String ipAddress;
    private String details;
    
    public static UserLogResponse from(UserLog userLog) {
        return UserLogResponse.builder()
                .id(userLog.getId())
                .userId(userLog.getUser().getId())
                .userName(userLog.getUser().getUserName())
                .logType(userLog.getLogType())
                .description(userLog.getDescription())
                .createdAt(userLog.getCreatedAt())
                .ipAddress(userLog.getIpAddress())
                .details(userLog.getDetails())
                .build();
    }
}