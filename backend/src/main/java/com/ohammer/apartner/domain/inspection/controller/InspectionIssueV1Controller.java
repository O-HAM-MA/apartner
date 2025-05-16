package com.ohammer.apartner.domain.inspection.controller;

import com.ohammer.apartner.domain.inspection.dto.InspectionIssueDto;
import com.ohammer.apartner.domain.inspection.dto.IssueResponseDetailDto;
import com.ohammer.apartner.domain.inspection.entity.InspectionIssue;
import com.ohammer.apartner.domain.inspection.service.InspectionIssueService;
import com.ohammer.apartner.security.CustomUserDetailsService;
import com.ohammer.apartner.security.OAuth.CustomRequest;
import com.ohammer.apartner.security.jwt.JwtTokenizer;
import io.jsonwebtoken.Claims;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/inspection/issue")
@RequiredArgsConstructor
@Tag(name = "점검 이슈 api", description = "점검 이슈 API")
public class InspectionIssueV1Controller {
    private final InspectionIssueService inspectionIssueService;

    //이슈 생성
    @PostMapping("{id}/create")
    @Operation(
            summary = "해당 점검 사항에 문제가 생겼을 경우 이슈를 생성",
            description = "해당 점검에 대한 이슈 생성"
    )
    public ResponseEntity<?> makeInspectionIssue(@PathVariable(name = "id")Long id,
                                                 @RequestBody InspectionIssueDto dto) {
        try {


            inspectionIssueService.makeInspectionIssue(id, dto.getDescription());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("이슈 생성 실패");
        }
    }
    //이슈 조회
    @GetMapping("/show/{issueId}")
    @Operation(
            summary = "해당 이슈에 대한 내용을 볼 수 있음",
            description = "해당 이슈에 대한 내용"
    )
    public ResponseEntity<IssueResponseDetailDto> getInspectionIssue(@PathVariable(name = "issueId")Long id) {
        try {
            IssueResponseDetailDto issue= inspectionIssueService.showInspectionIssue(id);

            return ResponseEntity.ok().body(issue);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    //이슈 수정
    @PostMapping("{id}/update")
    @Operation(
            summary = "해당 이슈에 대한 내용을 수정 할 수 있음",
            description = "해당 이슈에 대한 수정 내용"
    )
    public ResponseEntity<?> updateInspectionIssue(@PathVariable(name = "id") Long id, @RequestBody InspectionIssueDto dto) {
        try {
            inspectionIssueService.updateInspectionIssue(id, dto.getDescription());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("이슈 수정 실패");
        }
    }


}
