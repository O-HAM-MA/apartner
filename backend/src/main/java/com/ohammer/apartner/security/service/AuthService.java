package com.ohammer.apartner.security.service;


import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.ohammer.apartner.domain.image.entity.Image;

import com.ohammer.apartner.domain.image.repository.ImageRepository;
import com.ohammer.apartner.domain.image.util.FileUtils;
import com.ohammer.apartner.domain.user.entity.Role;
import com.ohammer.apartner.domain.user.entity.User;

import com.ohammer.apartner.domain.user.repository.UserRepository;
import com.ohammer.apartner.domain.user.repository.UserLogRepository;
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
import com.ohammer.apartner.domain.user.entity.UserLog;
import java.io.*;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.*;
import com.amazonaws.SdkClientException;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    private final UserRepository userRepository;
    private final ImageRepository imageRepository;
    private final JwtTokenizer jwtTokenizer;
    private final AmazonS3 amazonS3;
    private final UserLogRepository userLogRepository;

    @Transactional(readOnly = true)
    public Optional<User> findByIdWithRoles(Long id) {
        return userRepository.findByIdWithRoles(id);
    }

    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    @Transactional(readOnly = true)
    public Optional<User> findById(Long userId) {
        return userRepository.findById(userId);
    }

    @Transactional(readOnly = true)
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

    @Transactional
    public User join(String username, String password, String profileImgUrl, String providerType,String socialId) {
        if (userRepository.existsBySocialId(socialId)) {
            throw new RuntimeException("해당 socialId은 이미 사용중입니다.");
        }
        Date currentDate = new Date();
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyMMddmmss");
        String formattedDateTime = dateFormat.format(currentDate);
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
            // 먼저 사용자와 이미지 간의 관계를 끊고 저장
            userProfile.setProfileImage(null);
            userRepository.saveAndFlush(userProfile);
            
            // 기존 S3 이미지 삭제 시도 (실패해도 일단 진행)
            try {
                 deleteS3Image(existingImage.getFilePath());
            } catch (Exception e) {
                 log.warn("Failed to delete existing S3 image: {}", existingImage.getFilePath(), e);
            }
            imageRepository.delete(existingImage);
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
                    .isTemporary(false)  // null이 아닌 값 설정
                    .path(permanentS3Key)
                    .originalName(originalFileName)
                    .storedName(permanentS3Key)
                    .contentType(contentType)
                    .size(imageSize)
                    .isDeleted(false)
                    .s3Key(permanentS3Key)  // s3_key 필드에 값 설정
                    .build();
            
            // 이미지 먼저 저장 (user 참조 없이)
            Image savedImage = imageRepository.saveAndFlush(newImage);
            
            // 별도의 트랜잭션으로 사용자에 이미지 연결
            updateUserProfileImage(userProfile.getId(), savedImage.getId());
            
            log.info("Saved profile image metadata to DB for user: {}", user.getId());
            return kakaoProfileImageUrl;
        } else {
            // 업로드 실패 또는 빈 파일 등의 이유로 이미지 저장 안 함
            log.warn("Profile image DB registration skipped for user: {} due to upload failure or empty file.", user.getId());
            return null; // 실패 시 null 반환
        }
    }

    @Transactional
    public void updateUserProfileImage(Long userId, Long imageId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자 없음"));
        Image image = imageRepository.findById(imageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "이미지 없음"));
        
        // 양방향 관계 설정
        user.setProfileImage(image);
        image.setUser(user);
        
        // 저장
        userRepository.save(user);
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
        if (user != null) {
            inputSocialProfileImage(user, profileImgUrl);
            return user;
        }
        return join(username, "", profileImgUrl, providerType, socialId);
    }

    @Transactional
    public void logout(String accessToken, String ipAddress) {
        User user = null;
        String logDescription = "로그아웃";
        try {
            var claims = jwtTokenizer.parseAccessToken(accessToken);
            final Long userId = ((Number) claims.get("userId")).longValue();
            user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다: " + userId));
            user.setRefreshToken(null);
            userRepository.save(user);
        } catch (Exception e) {
            logDescription = "로그아웃 실패: " + e.getClass().getSimpleName() + " - " + e.getMessage();
            log.warn("[AuthService.logout] accessToken 파싱 또는 로그아웃 처리 실패: {}", e.getMessage());
        } finally {
            if (user != null) {
                UserLog logoutLog = UserLog.builder()
                        .user(user)
                        .logType(UserLog.LogType.LOGOUT)
                        .description(logDescription)
                        .ipAddress(ipAddress)
                        .createdAt(java.time.LocalDateTime.now())
                        .build();
                userLogRepository.save(logoutLog);
                log.info("[AuthService.logout] 로그아웃 로그 저장 완료: userId={}, ip={}", user.getId(), ipAddress);
            } else {
                log.warn("[AuthService.logout] 로그아웃 로그 저장 불가: 사용자 정보 없음 (토큰 파싱 실패)");
            }
        }
    }

    @Transactional
    public void logLoginFailure(User user, String ipAddress) {
        UserLog loginFailedLog = UserLog.builder()
                .user(user)
                .logType(UserLog.LogType.LOGIN_FAILED)
                .description("로그인 실패")
                .ipAddress(ipAddress)
                .createdAt(java.time.LocalDateTime.now())
                .build();
        userLogRepository.save(loginFailedLog);
    }

    @Transactional
    public void logLoginSuccess(User user, String ipAddress) {
        UserLog loginSuccessLog = UserLog.builder()
                .user(user)
                .logType(UserLog.LogType.LOGIN)
                .description("로그인 성공")
                .ipAddress(ipAddress)
                .createdAt(java.time.LocalDateTime.now())
                .build();
        userLogRepository.save(loginSuccessLog);
    }
}
