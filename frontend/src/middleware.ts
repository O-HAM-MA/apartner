import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 정적 파일 및 무시할 경로 패턴
const STATIC_PATHS = [
  /\.[^/]+$/, // 확장자가 있는 모든 파일 (이미지, CSS, JS 등)
  /^\/api\//, // API 경로
  /^\/admin\//, // 관리자 경로
  /^\/_next\//, // Next.js 내부 경로
];

// 인증이 필요 없는 경로들
const publicPaths = [
  "/",
  "/login",
  "/signup",
  "/find-id",
  "/find-password",
  "/auth",
  "/foreignsVehicles",
  "/admin",
  "/udash",
];

// 백엔드 API 기본 URL
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.apartner.site";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const url = request.nextUrl.toString();

  // RSC(React Server Components) 요청인 경우 (_rsc 파라미터가 있는 경우) 통과
  if (url.includes("_rsc=")) {
    console.log(`[Middleware] RSC 요청 감지, 인증 체크 스킵: ${url}`);
    return NextResponse.next();
  }

  // 정적 파일이나 무시할 경로인 경우 통과
  if (STATIC_PATHS.some((pattern) => pattern.test(path))) {
    return NextResponse.next();
  }

  // 현재 경로가 public 경로인지 확인
  const isPublicPath = publicPaths.some(
    (publicPath) => path === publicPath || path.startsWith(publicPath + "/")
  );

  // public 경로면 바로 통과
  if (isPublicPath) {
    console.log(`[Middleware] 공개 경로 통과: ${path}`);
    return NextResponse.next();
  }

  try {
    // 백엔드 /me API를 호출하여 사용자 인증 검증
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: {
        Cookie: request.headers.get("cookie") || "",
      },
      credentials: "include",
    });

    // 인증 성공 시 통과
    if (response.ok) {
      console.log(`[Middleware] 백엔드 인증 성공, 통과: ${path}`);
      return NextResponse.next();
    } else {
      // 인증 실패 시 로그인 페이지로 리다이렉트
      console.log(
        `[Middleware] 백엔드 인증 실패, 로그인 페이지로 리다이렉트: ${path}`
      );
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } catch (error) {
    // 오류 발생 시 로그인 페이지로 리다이렉트
    console.error(`[Middleware] 백엔드 통신 오류: ${error}`);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

// 미들웨어는 페이지 요청에만 적용하고 정적 파일 요청은 건너뜁니다
export const config = {
  matcher: [
    // 모든 경로 - 하지만 정적 파일은 matcher에서 자동으로 제외됨
    "/(.*)",
  ],
};
