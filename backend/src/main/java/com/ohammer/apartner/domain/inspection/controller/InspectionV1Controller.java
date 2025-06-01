package com.ohammer.apartner.domain.inspection.controller;

import com.ohammer.apartner.domain.inspection.dto.InspectionRequestDto;
import com.ohammer.apartner.domain.inspection.dto.InspectionResponseDetailDto;
import com.ohammer.apartner.domain.inspection.dto.InspectionUpdateDto;
import com.ohammer.apartner.domain.inspection.entity.Inspection;
import com.ohammer.apartner.domain.inspection.service.InspectionService;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.dto.ApiResponse;
import com.ohammer.apartner.security.CustomUserDetailsService;
import com.ohammer.apartner.security.OAuth.CustomRequest;
import com.ohammer.apartner.security.jwt.JwtTokenizer;
import com.ohammer.apartner.security.utils.SecurityUtil;
import io.jsonwebtoken.Claims;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/inspection/manager")
@Tag(name = "점검 api", description = "점검 API(일단은 메니저 전용)")
public class InspectionV1Controller {
    private final InspectionService inspectionService;


    //추가
    @PostMapping("/create")
    @Operation(
            summary = "점검 일정을 추가합니다, 점검 하는 사람은 로그인한 정보에서 뺴올 예정입니다",
            description = "점검 일정을 추가합니다, 시작 및 종료 시간, 점검 항목, 점검내용을 넣습니다"
    )
    public ResponseEntity<Inspection> createInspectionSchedule(@RequestBody InspectionRequestDto dto) {
        try{
            inspectionService.newInspectionSchedule(dto);
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
    public ResponseEntity<?> updateInspectionSchedule(@PathVariable("id") Long id, @RequestBody InspectionUpdateDto dto) {
        try {
            inspectionService.updateInspection(id, dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok().build();
    }

    //완료
    @PostMapping("/complete/{id}")
    @Operation(
            summary = "점검 일정을 소화하고 완료 버튼을 누르면 해당 api가 쏴져서 DB에 저 일정은 완료되었다고 처리가 됩니다",
            description = "해당 점검의 결과가 CHECKED로 변합니다"
    )
    public ResponseEntity<?> compeleteInspection(@PathVariable(name = "id") Long id) {
        try {
            inspectionService.changeInspectionResult(id, "CHECKED");
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    //시작
    @PostMapping("/start/{id}")
    @Operation(
            summary = "점검 일정을 바로 시작을 하면",
            description = "해당 점검의 상태가 PENDING으로 변합니다"
    )
    public ResponseEntity<?> startInspection(@PathVariable(name = "id") Long id) {
        try {
            inspectionService.changeInspectionResult(id, "PENDING");
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }


//    //전체 불러오기
//    //그냥 여기서 제목만 불러와도 되는게 아닌가
//    @GetMapping("")
//    @Operation(
//            summary = "점검 일정을 가져옵니다",
//            description = "점검 일정 목록을 가져옵니다"
//    )
//    public ResponseEntity<List<InspectionResponseDetailDto>> showAllInspections() {
//        User user = SecurityUtil.getCurrentUser();
//        return ResponseEntity.ok(inspectionService.showAllInspections());
//    }

    //전체 불러오기
    //그냥 여기서 제목만 불러와도 되는게 아닌가
    @GetMapping()
    @Operation(
            summary = "점검 일정을 가져옵니다",
            description = "점검 일정 목록을 가져옵니다"
    )
    public ResponseEntity<Page<InspectionResponseDetailDto>> showAllInspection(@RequestParam(name = "page") int page) {
        if (page < 1)
            page = 1;
        Pageable pageable = PageRequest.of(page - 1, 6, Sort.by(Sort.Direction.DESC, "id"));
        return ResponseEntity.ok(inspectionService.showAllInspections(pageable));
    }

    //상세 보기 -> 추가 내용 볼려고?
    @GetMapping("/{id}")
    @Operation(
            summary = "점검 일정에 대한 상세 내용을 봅니다",
            description = "해당 점검 일정에 대한 상세 내용을 볼 수 있음"
    )
    public ResponseEntity<InspectionResponseDetailDto> showInspection(@PathVariable(name = "id") Long id) {
        try {
                InspectionResponseDetailDto inspection = inspectionService.showInspection(id);
                return ResponseEntity.ok(inspection);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }

    }

    //검색
    @GetMapping("/search/{keyword}")
    public ResponseEntity<Page<InspectionResponseDetailDto>> searchInsepction(@PathVariable("keyword") String keyword, @RequestParam(name = "page") int page) {
        if (page < 1)
            page = 1;
        Pageable pageable = PageRequest.of(page - 1, 6, Sort.by(Sort.Direction.DESC, "id"));
        return ResponseEntity.ok().body(inspectionService.searchInspection(keyword, pageable));
    }

    //제거
    @DeleteMapping("/{id}")
    @Operation(
            summary = "해당 점검 내용을 지우고 싶을때 사용합니다",
            description = "해당 점검 일정을 삭제합니다"
    )
    public ResponseEntity<?> deleteInspectionSchedule(@PathVariable("id") Long id) {
        try {
            inspectionService.deleteInspection(id);
        } catch (RuntimeException e) {
            ResponseEntity.badRequest().body("삭제에 실패했습니다");
        }

        return ResponseEntity.ok().build();
    }
}
