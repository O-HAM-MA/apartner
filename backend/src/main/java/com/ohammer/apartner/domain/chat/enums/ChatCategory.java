package com.ohammer.apartner.domain.chat.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 채팅 카테고리 열거형
 * 코드와 이름을 매핑하여 관리
 */
@Getter
@RequiredArgsConstructor
public enum ChatCategory {
    COMPLAINT("A01", "민원"),
    SUGGESTION("A02", "건의사항"),
    REPAIR("A03", "수리/정비"),
    SECURITY("A04", "보안/안전");

    private final String code;
    private final String displayName;

    /**
     * 코드로 카테고리 찾기
     * @param code 카테고리 코드
     * @return 해당 코드의 카테고리, 없으면 null
     */
    public static ChatCategory findByCode(String code) {
        if (code == null) {
            return null;
        }
        for (ChatCategory category : values()) {
            if (category.getCode().equals(code)) {
                return category;
            }
        }
        return null;
    }

    /**
     * 이름으로 카테고리 찾기
     * @param displayName 카테고리 이름
     * @return 해당 이름의 카테고리, 없으면 null
     */
    public static ChatCategory findByDisplayName(String displayName) {
        if (displayName == null) {
            return null;
        }
        for (ChatCategory category : values()) {
            if (category.getDisplayName().equals(displayName)) {
                return category;
            }
        }
        return null;
    }

    /**
     * 코드로 카테고리 이름 찾기
     * @param code 카테고리 코드
     * @return 해당 코드의 카테고리 이름, 없으면 null
     */
    public static String getDisplayNameByCode(String code) {
        ChatCategory category = findByCode(code);
        return category != null ? category.getDisplayName() : null;
    }

    /**
     * 이름으로 카테고리 코드 찾기
     * @param displayName 카테고리 이름
     * @return 해당 이름의 카테고리 코드, 없으면 null
     */
    public static String getCodeByDisplayName(String displayName) {
        ChatCategory category = findByDisplayName(displayName);
        return category != null ? category.getCode() : null;
    }
} 