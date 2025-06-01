package com.ohammer.apartner.domain.community.service;

import com.ohammer.apartner.domain.community.dto.CommunityRequestDto;
import com.ohammer.apartner.domain.community.dto.CommunityResponseDto;
import com.ohammer.apartner.domain.community.dto.UserBasicDto;
import com.ohammer.apartner.domain.community.entity.Community;
import com.ohammer.apartner.domain.community.repository.CommunityRepository;
import com.ohammer.apartner.domain.user.entity.Role;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.Status;
import com.ohammer.apartner.security.utils.SecurityUtil;
import com.ohammer.apartner.security.utils.checkRoleUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommunityService {

    private final CommunityRepository communityRepository;

    @Transactional
    public CommunityResponseDto createPost(CommunityRequestDto dto, User user) {
        Community parent = null;
        if (dto.getParentId() != null) {
            parent = communityRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new IllegalArgumentException("Parent not found"));
        }
        Community community = Community.builder()
                .content(dto.getContent())
                .author(user)
                .parent(parent)
                .status(Status.ACTIVE)
                .pinned(false)
                .build();
        Community saved = communityRepository.save(community);
        return toDto(saved, true);
    }

    @Transactional(readOnly = true)
    public List<CommunityResponseDto> listPosts() {

        User currentUser = SecurityUtil.getCurrentUser();
        if (currentUser == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Set<Role> roles = currentUser.getRoles();
        boolean isAdmin = roles.stream().anyMatch(role ->
                role == Role.MANAGER || role == Role.MODERATOR || role == Role.ADMIN);

        List<Community> list = communityRepository.findByStatusAndParentIsNullOrderByCreatedAtDesc(Status.ACTIVE);
        return list.stream()
                .map(c -> toDto(c, isAdmin)) // includeAuthor = true
                .collect(Collectors.toList());
    }

    @Transactional
    public CommunityResponseDto update(Long id, CommunityRequestDto dto, User user) {
        Community comm = communityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Not found"));

        // 유저 역할 확인
//        Set<Role> roles = user.getRoles();
//        boolean isAdmin = roles.contains(Role.MANAGER) || roles.contains(Role.MODERATOR) || roles.contains(Role.ADMIN);


        if (!comm.getAuthor().getId().equals(user.getId())) {
            throw new SecurityException("작성자만 수정할 수 있습니다.");
        }
//        if (!isAdmin && !comm.getAuthor().equals(user)) {
//            throw new SecurityException("Unauthorized");
//        }
        comm.setContent(dto.getContent());
        return toDto(comm, false);
    }

    @Transactional
    public void delete(Long id, User user) {
        Community comm = communityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Not found"));

        // 유저 역할 확인
        Set<Role> roles = user.getRoles();
        boolean isAdmin = roles.contains(Role.MANAGER) || roles.contains(Role.MODERATOR) || roles.contains(Role.ADMIN);


        if (!isAdmin && !comm.getAuthor().getId().equals(user.getId())) {
            throw new SecurityException("작성자만 삭제할 수 있습니다.");
        }
//        if (!isAdmin && !comm.getAuthor().equals(user)) {
//            throw new SecurityException("Unauthorized");
//        }
        comm.setStatus(Status.INACTIVE);
    }

    @Transactional
    public CommunityResponseDto pin(Long id) {

        checkRoleUtils.validateManagerAccess();

        Community comm = communityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Not found"));
        comm.setPinned(!comm.isPinned());
        return toDto(comm, true);
    }

    private CommunityResponseDto toDto(Community c, boolean includeAuthor) {
        UserBasicDto authorDto = includeAuthor && c.getAuthor() != null
                ? UserBasicDto.builder()
                .id(c.getAuthor().getId())
                .username(c.getAuthor().getUserName())
                .build()
                : null;
        return CommunityResponseDto.builder()
                .id(c.getId())
                .content(c.getContent())
                .author(authorDto)
                .parentId(c.getParent() != null ? c.getParent().getId() : null)
                .createdAt(c.getCreatedAt())
                .modifiedAt(c.getModifiedAt())
                .status(c.getStatus().getValue())
                .pinned(c.isPinned())
                .build();
    }

    @Transactional(readOnly = true)
    public List<CommunityResponseDto> listBranchPosts(Long parentId) {

        // 1) 로그인 사용자 가져오기 — 로그인 필수로 처리
        User currentUser = SecurityUtil.getCurrentUser();
        if (currentUser == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        // 2) 역할 체크: MANAGER, MODERATOR, ADMIN만 작성자 보임
        Set<Role> roles = currentUser.getRoles();
        boolean includeAuthor = roles.contains(Role.MANAGER)
                || roles.contains(Role.MODERATOR)
                || roles.contains(Role.ADMIN);


        // ACTIVE 상태인 답글만 조회
        List<Community> list = communityRepository
                .findByParentIdAndStatus(parentId, Status.ACTIVE);




        //List<Community> list = communityRepository.findByParentId(parentId);
        //list = communityRepository.findByStatusAndParentIsNullOrderByCreatedAtDesc(Status.ACTIVE);
        return list.stream()
                .map(c -> toDto(c, includeAuthor))
                .collect(Collectors.toList());
    }
}
