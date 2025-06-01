package com.ohammer.apartner.domain.community.controller;

import com.ohammer.apartner.domain.community.dto.CommunityRequestDto;
import com.ohammer.apartner.domain.community.dto.CommunityResponseDto;
import com.ohammer.apartner.domain.community.service.CommunityService;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.security.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "아파트 입주민들 간의 커뮤니티 소통 관리 api")
@RestController
@RequestMapping("/api/v1/community")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;

    @Operation(summary = "커뮤니티 소통 게시판에 글 등록")
    @PostMapping
    public CommunityResponseDto create(@RequestBody CommunityRequestDto dto) {
        User user = SecurityUtil.getCurrentUser();
        return communityService.createPost(dto, user);
    }


    @Operation(summary = "커뮤니티 소통 게시판 글 목록 조회")
    @GetMapping
    public List<CommunityResponseDto> list() {

        //boolean isAdmin = user.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        boolean isAdmin = false;

        return communityService.listPosts();
    }

    @Operation(summary = "해당 입주민이 작성한 글 수정")
    @PutMapping("/update/{id}")
    public CommunityResponseDto update(@PathVariable(value = "id") Long id,
                                       @RequestBody CommunityRequestDto dto
                                       ) {
        User user = SecurityUtil.getCurrentUser();
        //boolean isAdmin = user.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        //boolean isAdmin = false;

        return communityService.update(id, dto, user);
    }

    @Operation(summary = "해당 입주민이 작성한 글 삭제")
    @DeleteMapping("/delete/{id}")
    public void delete(@PathVariable(value = "id") Long id
                       ) {
        User user = SecurityUtil.getCurrentUser();
//        boolean isAdmin = user.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        //boolean isAdmin = false;

        communityService.delete(id, user);
    }

    @Operation(summary = "글 고정시키기")
    @PostMapping("/{id}/pin")
    public CommunityResponseDto pin(@PathVariable(value = "id") Long id
                                    ) {
        User user = SecurityUtil.getCurrentUser();
//        boolean isAdmin = user.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
//        if (!isAdmin) throw new SecurityException("Not allowed");
        boolean isAdmin = false;

        return communityService.pin(id);
    }


    @Operation(summary = "특정 글에 달린 답글 목록 조회")
    @GetMapping("/{id}")
    public List<CommunityResponseDto> listBranch(@PathVariable(value = "id") Long id) {
        //User user = SecurityUtil.getCurrentUser();
        //boolean isAdmin = user.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        //boolean isAdmin = false;

        return communityService.listBranchPosts(id);
    }
}
