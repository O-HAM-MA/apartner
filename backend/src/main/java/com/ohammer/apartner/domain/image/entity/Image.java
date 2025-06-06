package com.ohammer.apartner.domain.image.entity;

import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@Entity
@Table(name = "images")
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@ToString
public class Image extends BaseEntity {

    @OneToOne(mappedBy = "profileImage")
    private User user; // 유저와 연결된 프로필 이미지 (1:1 관계)

    @Lob // 대용량 데이터를 매핑할 때 사용됩니다. 주로 텍스트나 바이너리 데이터를 저장할 때 사용 , TEXT 타입
    private String filePath; // 이미지 경로 (TEXT 타입)

    @Column(name = "temp_id", length = 100)
    private String tempId; // 임시 이미지 식별자

    @Column(nullable = false)
    private Boolean isTemp;    // 현재 위치가 임시폴더인지 여부 - true면 임시 저장된 이미지

    @Column(nullable = false)
    private Boolean isDeleted; // soft-delete 여부

    @Column(name = "original_name", nullable = false)
    private String originalName;

    @Column(name = "stored_name", nullable = false)
    private String storedName;

    @Column(nullable = false)
    private String path;

    @Column(nullable = false)
    private Long size;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(nullable = false)
    private Boolean isTemporary; // 실제로 사용자에게 보여질 수 있는지 여부

    @Column
    private LocalDateTime expiresAt;

    @Column(name = "s3_key", nullable = false)
    private String s3Key;

    public Image(String originalName, String storedName, String path, Long size, String contentType,
                 boolean isTemporary, String tempId, String s3Key) {
        this.originalName = originalName;
        this.storedName = storedName;
        this.path = path;
        this.size = size;
        this.contentType = contentType;
        this.isTemporary = isTemporary;
        this.tempId = tempId;
        this.s3Key = s3Key;
        if (isTemporary) {
            this.expiresAt = LocalDateTime.now().plusHours(24);
        }
    }

    public String getS3Key() {
        return this.s3Key;
    }
}