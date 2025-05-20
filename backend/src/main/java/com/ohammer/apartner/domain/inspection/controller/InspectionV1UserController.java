package com.ohammer.apartner.domain.inspection.controller;

import com.ohammer.apartner.domain.inspection.dto.InspectionRequestDto;
import com.ohammer.apartner.domain.inspection.dto.InspectionResponseDetailDto;
import com.ohammer.apartner.domain.inspection.dto.InspectionUpdateDto;
import com.ohammer.apartner.domain.inspection.service.InspectionService;
import com.ohammer.apartner.domain.inspection.service.InspectionUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

//이거는 유저용
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/vi/inspection/user")
@Tag(name = "점검 유저 api", description = "점검 유저 API")
public class InspectionV1UserController {
    private final InspectionService inspectionService;
    private final InspectionUserService inspectionUserService;
    //자가 점검

    //그런데 메니저의 그것고 차이는 뭐지?

    //일단 조회할때 자기 것만 나와야지
    @GetMapping("")
    @Operation(
            summary = "유저가 점검목록을 가져옵니다",
            description = "점검 목록을 가져옵니다, 자기가 쓴 것이랑, 매니저가 쓴 것들이 나옵니다 주호야 페이징 처리해라"
    )
    public ResponseEntity<List<InspectionResponseDetailDto>>  showAllInspectionsWithUser() {
        return ResponseEntity.ok(inspectionUserService.getAllInspectionWithUser());
    }


    //그리고 점검 등록할떄 공지에 안나가는 등록
    @PostMapping("/create")
    @Operation(
            summary = "유저가 자가점검을 만듬니다",
            description = "자가 점금을 만드는데 "
    )
    public ResponseEntity<?>createNewUserInspection(@RequestParam InspectionRequestDto dto) {
        try {
            inspectionUserService.newUserInspectionSchedule(dto);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    //수정
    @PostMapping("/{id}")
    @Operation(
            summary = "점검 일정을 변경합니다",
            description = "점검 일정 내용을 변경합니다"
    )
    public ResponseEntity<?> updateInspectionUserSchedule(@PathVariable("id") Long id, @RequestBody InspectionUpdateDto dto) {
        try {
            inspectionUserService.updateInspectionUser(id, dto);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok().build();
    }

    //제거
    @DeleteMapping("/{id}")
    @Operation(
            summary = "해당 점검 내용을 지우고 싶을때 사용합니다, 그런데 지울 일이 있을까요?",
            description = "해당 점검 일정을 삭제합니다"
    )
    public ResponseEntity<?> deleteInspectionUserSchedule(@PathVariable("id") Long id) {
        inspectionUserService.deleteUserInspection(id);
        return ResponseEntity.ok().build();
    }
}
