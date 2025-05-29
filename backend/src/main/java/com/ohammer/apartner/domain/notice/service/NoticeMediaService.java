package com.ohammer.apartner.domain.notice.service;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.ohammer.apartner.domain.image.entity.Image;
import com.ohammer.apartner.domain.image.repository.ImageRepository;
import com.ohammer.apartner.domain.image.util.FileUtils;
import com.ohammer.apartner.domain.notice.dto.response.MediaInfoResponseDto;
import com.ohammer.apartner.domain.notice.dto.response.MediaUploadResponseDto;
import com.ohammer.apartner.domain.notice.entity.NoticeFile;
import com.ohammer.apartner.domain.notice.repository.NoticeFileRepository;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeMediaService {

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    private final AmazonS3 amazonS3;
    private final ImageRepository imageRepository;
    private final NoticeFileRepository noticeFileRepository;

    @Transactional
    public List<MediaUploadResponseDto> uploadImages(List<MultipartFile> files) {
        List<MediaUploadResponseDto> responses = new ArrayList<>();

        for (MultipartFile file : files) {
            String originalName = file.getOriginalFilename();
            String storedName = FileUtils.createFileName(originalName);
            String extension = FileUtils.extractFileExtension(originalName);
            String contentType = FileUtils.determineContentType(extension);
            String path = "notice/temp/images/" + storedName; // temp 경로 사용

            // S3 업로드
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(file.getSize());
            metadata.setContentType(contentType);

            try {
                amazonS3.putObject(new PutObjectRequest(bucket, path, file.getInputStream(), metadata));
            } catch (IOException e) {
                throw new RuntimeException("이미지 업로드 실패", e);
            }

            Image image = Image.builder()
                    .originalName(originalName)
                    .storedName(storedName)
                    .path(path)
                    .size(file.getSize())
                    .contentType(contentType)
                    .s3Key(path)
                    .isTemp(true)
                    .isTemporary(true)
                    .isDeleted(false)
                    .expiresAt(LocalDateTime.now().plusHours(24))
                    .build();

            Image savedImage = imageRepository.save(image);
            String imageUrl = amazonS3.getUrl(bucket, path).toString();

            responses.add(new MediaUploadResponseDto(savedImage.getId(), imageUrl, originalName));
        }

        return responses;
    }

    @Transactional
    public List<MediaUploadResponseDto> uploadFiles(List<MultipartFile> files) {
        List<MediaUploadResponseDto> responses = new ArrayList<>();

        for (MultipartFile file : files) {

            String originalName = file.getOriginalFilename();
            String storedName = FileUtils.createFileName(originalName);
            String extension = FileUtils.extractFileExtension(originalName);
            String contentType = FileUtils.determineContentType(extension);
            String path = "notice/temp/files/" + storedName; // temp 경로 사용

            // S3 업로드
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(file.getSize());
            metadata.setContentType(contentType);

            try (InputStream is = file.getInputStream()) {
                amazonS3.putObject(new PutObjectRequest(bucket, path, is, metadata));
            } catch (IOException e) {
                throw new RuntimeException("파일 업로드 실패", e);
            }

            NoticeFile noticeFile = NoticeFile.builder()
                    .originalName(originalName)
                    .storedName(storedName)
                    .path(path)
                    .size(file.getSize())
                    .contentType(contentType)
                    .s3Key(path)
                    .build();

            NoticeFile savedFile = noticeFileRepository.save(noticeFile);
            String fileUrl = amazonS3.getUrl(bucket, path).toString();

            responses.add(new MediaUploadResponseDto(savedFile.getId(), fileUrl, originalName));
        }
        return responses;
    }

    public MediaInfoResponseDto getImageInfo(Long noticeImageId) {
        Image image = imageRepository.findById(noticeImageId)
                .orElseThrow(() -> new IllegalArgumentException("이미지 없음"));
        String url = amazonS3.getUrl(bucket, image.getS3Key()).toString();

        return new MediaInfoResponseDto(image.getId(), url, image.getOriginalName(), image.getIsTemp(),
                image.getExpiresAt());
    }

    public MediaInfoResponseDto getFileInfo(Long noticeFileId) {
        NoticeFile file = noticeFileRepository.findById(noticeFileId)
                .orElseThrow(() -> new IllegalArgumentException("파일 없음"));
        String url = amazonS3.getUrl(bucket, file.getS3Key()).toString();

        return new MediaInfoResponseDto(file.getId(), url, file.getOriginalName(), false, null);
    }

    @Transactional
    public void deleteImage(Long noticeImageId) {
        Image image = imageRepository.findById(noticeImageId)
                .orElseThrow(() -> new IllegalArgumentException("이미지를 찾을 수 없습니다."));
        amazonS3.deleteObject(bucket, image.getS3Key());
        imageRepository.delete(image);
    }

    @Transactional
    public void deleteFile(Long noticeFileId) {
        NoticeFile file = noticeFileRepository.findById(noticeFileId)
                .orElseThrow(() -> new IllegalArgumentException("파일을 찾을 수 없습니다."));
        amazonS3.deleteObject(bucket, file.getS3Key());
        noticeFileRepository.delete(file);
    }
}