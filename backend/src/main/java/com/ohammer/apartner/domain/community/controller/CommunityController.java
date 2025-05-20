package com.ohammer.apartner.domain.community.controller;

import com.ohammer.apartner.domain.community.dto.CommunityRequestDto;
import com.ohammer.apartner.domain.community.dto.CommunityResponseDto;
import com.ohammer.apartner.domain.community.service.CommunityService;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.security.utils.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/community")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;

    @PostMapping
    public CommunityResponseDto create(@RequestBody CommunityRequestDto dto) {
        User user = SecurityUtil.getCurrentUser();
        return communityService.createPost(dto, user);
    }


    @GetMapping
    public List<CommunityResponseDto> list() {
        User user = SecurityUtil.getCurrentUser();
        //boolean isAdmin = user.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        boolean isAdmin = false;

        return communityService.listPosts(isAdmin);
    }

    @PutMapping("/update/{id}")
    public CommunityResponseDto update(@PathVariable(value = "id") Long id,
                                       @RequestBody CommunityRequestDto dto
                                       ) {
        User user = SecurityUtil.getCurrentUser();
        //boolean isAdmin = user.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        //boolean isAdmin = false;

        return communityService.update(id, dto, user);
    }

    @DeleteMapping("/delete/{id}")
    public void delete(@PathVariable(value = "id") Long id
                       ) {
        User user = SecurityUtil.getCurrentUser();
//        boolean isAdmin = user.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        //boolean isAdmin = false;

        communityService.delete(id, user);
    }

    @PostMapping("/{id}/pin")
    public CommunityResponseDto pin(@PathVariable(value = "id") Long id
                                    ) {
        User user = SecurityUtil.getCurrentUser();
//        boolean isAdmin = user.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
//        if (!isAdmin) throw new SecurityException("Not allowed");
        boolean isAdmin = false;

        return communityService.pin(id);
    }

    @GetMapping("/{id}")
    public List<CommunityResponseDto> listBranch(@PathVariable(value = "id") Long id) {
        //User user = SecurityUtil.getCurrentUser();
        //boolean isAdmin = user.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        boolean isAdmin = false;

        return communityService.listBranchPosts(false, id);
    }
}
