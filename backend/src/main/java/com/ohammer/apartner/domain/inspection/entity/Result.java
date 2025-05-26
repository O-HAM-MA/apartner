package com.ohammer.apartner.domain.inspection.entity;

//TODO? : 만약 네가 점검시간일 경우 자동으로 점검중 기능을 만들고 싶다면 NOTYET를 다시 쓰던가 아니면 버리던가
public enum Result {
    CHECKED,
    PENDING,
    NOTYET,
    //이거 하나 추가됨
    ISSUE
}