package com.ohammer.apartner.domain.user.service;

import com.ohammer.apartner.domain.user.exception.UserErrorCode;
import com.ohammer.apartner.domain.user.exception.UserException;
import com.ohammer.apartner.domain.user.dto.MyInfoResponseDto;
import com.ohammer.apartner.domain.user.dto.MyInfoUpdateRequestDto;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.user.repository.UserRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class MyInfoService {
    private final UserRepository userRepository;

    //사용자 정보 가져오기
    public MyInfoResponseDto getMyInfo(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));

        String profileImageUrl = null;
        if (user.getProfileImage() != null) {
            profileImageUrl = user.getProfileImage().getFilePath();
        }

        return MyInfoResponseDto.builder()
                .email(user.getEmail())
                .userName(user.getUserName())
                .phoneNum(user.getPhoneNum())
                .profileImageUrl(profileImageUrl)
                .createdAt(user.getCreatedAt())
                .modifiedAt(user.getModifiedAt())
                .build();
    }

    //사용자 정보 수정
    @Transactional
    public void updateMyInfo(String email, MyInfoUpdateRequestDto requestDto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));

        user.setUserName(requestDto.getUserName());
        user.setPhoneNum(requestDto.getPhoneNum());
        user.setApartment(requestDto.getApartment());
        user.setBuilding(requestDto.getBuilding());
        user.setUnit(requestDto.getUnit());
        user.setModifiedAt(LocalDateTime.now());
        userRepository.save(user);
    }
}