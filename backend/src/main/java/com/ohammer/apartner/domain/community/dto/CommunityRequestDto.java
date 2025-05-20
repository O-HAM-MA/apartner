package com.ohammer.apartner.domain.community.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CommunityRequestDto {

    private String content;
    private Long parentId; // null for root post
}
