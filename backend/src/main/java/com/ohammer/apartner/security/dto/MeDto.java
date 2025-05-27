package com.ohammer.apartner.security.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;


@Getter
@AllArgsConstructor
public class MeDto {
    private  Long id;
    private  String userName;
    private  String email;
    private  String phoneNum;
    private  LocalDateTime createdAt;
    private  LocalDateTime modifiedAt;
    private  String profileImageUrl;
    private  String apartmentName;
    private  String buildingName;
    private  String unitNumber;
    private  String socialProvider;
    private  String zipcode;
    private  String address;
}
