package com.ohammer.apartner.domain.user.dto;

import com.ohammer.apartner.global.Status;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserStatusUpdateRequest {
    @NotNull(message = "상태는 필수 항목입니다")
    private Status status;
}