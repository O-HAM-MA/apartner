package com.ohammer.apartner.domain.vehicle.dto;


import lombok.NoArgsConstructor;
import lombok.Getter;

@Getter
@NoArgsConstructor
public class EntryRecordRequestDto {



    private String phone;    // 외부인 인증용 (입주민은 null 허용)
}
