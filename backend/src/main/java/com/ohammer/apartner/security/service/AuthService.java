package com.ohammer.apartner.security.service;
//이 부분은 테스트를 위한 것이며 추후 어딘가에 병합이 될 수 있음


import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.ohammer.apartner.domain.image.entity.Image;

import com.ohammer.apartner.domain.image.repository.ImageRepository;
import com.ohammer.apartner.domain.image.util.FileUtils;
import com.ohammer.apartner.domain.user.entity.Role;
import com.ohammer.apartner.domain.user.entity.User;

import com.ohammer.apartner.domain.user.repository.UserRepository;
import com.ohammer.apartner.global.Status;
import com.ohammer.apartner.security.jwt.JwtTokenizer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.*;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.*;
import com.amazonaws.SdkClientException;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AuthService {

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    private final UserRepository userRepository;
    private final ImageRepository imageRepository;
    private final JwtTokenizer jwtTokenizer;
    private final AmazonS3 amazonS3;

    public Optional<User> findByIdWithRoles(Long id) {
        return userRepository.findByIdWithRoles(id);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    public Optional<User> findById(Long userId) {
        return userRepository.findById(userId);
    }

    // 소셜 로그인 정보로 사용자 찾기
    public Optional<User> findBySocialProviderAndSocialId(String socialProvider, String socialId) {
        return userRepository.findBySocialProviderAndSocialId(socialProvider, socialId);
    }

    public String genAccessToken(User user) {
        return jwtTokenizer.createAccessToken(
                user.getId(),
                user.getEmail(),
                user.getStatus(),
                user.getRoles()
        );
    }

    public String genRefreshToken(User user) {
        return jwtTokenizer.createRefreshToken(
                user.getId(),
                user.getEmail(),
                user.getStatus(),
                user.getRoles()
        );
    }

    @Transactional
    public void addRefreshToken(User user, String refreshToken) {
        user.setRefreshToken(refreshToken);
        userRepository.save(user);
    }

    //소셜로그인에 가입한 유저를 새로 만들기
    @Transactional
    public User join(String username, String password, String profileImgUrl, String providerType,String socialId) {

        if (userRepository.existsBySocialId(socialId)) {
            throw new RuntimeException("해당 socialId은 이미 사용중입니다.");
        }

        Date currentDate = new Date();
        //전화번호 난수 추가
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyMMddmmss");
        String formattedDateTime = dateFormat.format(currentDate);
        //나중에 프사 추가 하십셔
        User user = User.builder()
        .userName(username)
                .password(password)
                .socialProvider(providerType)
                .roles(new HashSet<>(Set.of(Role.USER)))
                .phoneNum(providerType.toUpperCase().charAt(0) + "A" + formattedDateTime + (int) (Math.random() * 1000) + 1)
                .status(Status.ACTIVE)
                .build();

        userRepository.save(user);
        inputSocialProfileImage(user, profileImgUrl);
        return user;
    }

    private File downloadFileFromUrl(String fileUrl) throws IOException {
        File tempFile = File.createTempFile("profile", ".tmp");
        try (InputStream inputStream = new URL(fileUrl).openStream();
             FileOutputStream outputStream = new FileOutputStream(tempFile)) {

            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }
            outputStream.flush();
        }
        return tempFile;
    }

    private void uploadFileToS3(File file, String s3Key, String contentType) throws IOException {
        try (InputStream inputStream = new FileInputStream(file)) {
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentType(contentType);
            metadata.setContentLength(file.length());

            // S3 버킷이 ACL을 지원하지 않으므로 ACL 설정 없이 업로드
            PutObjectRequest putObjectRequest = new PutObjectRequest(bucket, s3Key, inputStream, metadata);
            amazonS3.putObject(putObjectRequest);
        }
    }

    @Transactional
    public String inputSocialProfileImage(User user, String profileImgUrl) {
        User userProfile = userRepository.findById(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자 없음"));

        // 1. 원본 파일명에서 확장자 추출 (url에서 확장자 뽑기)
        String originalFileName = profileImgUrl.substring(profileImgUrl.lastIndexOf("/") + 1); // 파일명만 추출
        String fileExtension = FileUtils.extractFileExtension(originalFileName);
        String contentType = FileUtils.determineContentType(fileExtension); // Content-Type 얻기
        String fileName = FileUtils.createFileName(originalFileName); // UUID_형식으로 파일명 생성
        String permanentS3Key = "kakoProfile/" + user.getId() + "/" + fileName;

        // 2. 기존 이미지 삭제
        Image existingImage = userProfile.getProfileImage();
        if (existingImage != null) {
            // 기존 S3 이미지 삭제 시도 (실패해도 일단 진행)
            try {
                 deleteS3Image(existingImage.getFilePath());
            } catch (Exception e) {
                 log.warn("Failed to delete existing S3 image: {}", existingImage.getFilePath(), e);
            }
            imageRepository.delete(existingImage);
            userProfile.setProfileImage(null);
        }

        // 3. S3 업로드 시도
        Long imageSize = null;
        File tempfile = null;
        String kakaoProfileImageUrl = null;
        boolean uploadSuccess = false;

        try {
            tempfile = downloadFileFromUrl(profileImgUrl);

            if (tempfile.length() == 0) {
                log.info("Downloaded profile image is empty for user: {}", user.getId());
                return null; // 빈 파일이면 업로드하지 않음
            }

            imageSize = tempfile.length();

            // S3 업로드 시도
            try {
                uploadFileToS3(tempfile, permanentS3Key, contentType);
                kakaoProfileImageUrl = amazonS3.getUrl(bucket, permanentS3Key).toString();
                uploadSuccess = true; // 업로드 성공 플래그 설정
                log.info("Successfully uploaded profile image to S3 for user: {}. URL: {}", user.getId(), kakaoProfileImageUrl);
            } catch (SdkClientException | IOException e) {
                // S3 업로드 실패 시 로그 남기고 이미지 저장 안 함
                log.error("Failed to upload profile image to S3 for user: {}. S3 Key: {}. Error: {}", user.getId(), permanentS3Key, e.getMessage());
                // uploadSuccess는 false인 상태로 유지
            }

        } catch (IOException e) {
            // 파일 다운로드 또는 임시 파일 처리 중 오류
            log.error("Failed to process profile image download/temp file for user: {}. Error: {}", user.getId(), e.getMessage());
            // ResponseStatusException 대신 로그만 남김
        } finally {
            if (tempfile != null) {
                tempfile.delete();
            }
        }

        // 4. 업로드가 성공한 경우에만 DB 저장
        if (uploadSuccess && kakaoProfileImageUrl != null && imageSize != null) {
            Image newImage = Image.builder()
                    .filePath(kakaoProfileImageUrl)
                    .isTemp(false)
                    .path(permanentS3Key)
                    .originalName(originalFileName)
                    .storedName(permanentS3Key)
                    .contentType(contentType)
                    .size(imageSize)
                    .isDeleted(false)
                    .user(userProfile)
                    .build();
            imageRepository.save(newImage);
            userProfile.setProfileImage(newImage);
            log.info("Saved profile image metadata to DB for user: {}", user.getId());
            return kakaoProfileImageUrl;
        } else {
            // 업로드 실패 또는 빈 파일 등의 이유로 이미지 저장 안 함
            log.warn("Profile image DB registration skipped for user: {} due to upload failure or empty file.", user.getId());
            return null; // 실패 시 null 반환
        }
    }

    private void deleteS3Image(String fileName) {
        try {
            String key = fileName.contains(".com/") ? fileName.split(".com/")[1] : fileName;
            amazonS3.deleteObject(bucket, key);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "S3 이미지 삭제 실패");
        }
    }

    @Transactional
    public User modifyOrJoin(String username, String profileImgUrl, String providerType, String socialId) {
        User user = userRepository.findBySocialProviderAndSocialId(providerType, socialId).orElse(null);

        //만약에 있다면 수정
        if (user != null) {
            inputSocialProfileImage(user, profileImgUrl);
            return user;
        }

        //핸드폰 번호는 없다
        //소셜로그인계정으로 로그인시 아이디,비밀번호를 까먹었다면 해당 소셜 서비스에서 바꾸는게 나을듯
        //없으면 참가
        return join(username, "", profileImgUrl, providerType, socialId);
    }
}
