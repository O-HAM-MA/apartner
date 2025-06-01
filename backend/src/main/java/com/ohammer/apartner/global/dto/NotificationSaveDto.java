package com.ohammer.apartner.global.dto;

import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSaveDto {
    private Long userId;
    private Long apartmentId;
    private String title;
    private String message;
    private String type;
    private String businessType;
    private String linkUrl;
    private Long senderId;
    private Long entityId;
    private Map<String, Object> extra;

    // NotificationSaveDto dto = NotificationSaveDto.builder()
    //     .userId(1L)
    //     .apartmentId(2L)
    //     .title("제목")
    //     .message("내용")
    //     .type("info")
    //     .linkUrl("/some/url")
    //     .entityId(123L)
    //     .extra(Map.of("foo", "bar"))
    //     .build();
}
