import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 정적 파일 및 무시할 경로 패턴
const STATIC_PATHS = [
  /\.[^/]+$/, // 확장자가 있는 모든 파일 (이미지, CSS, JS 등)
  /^\/api\//, // API 경로
  /^\/admin\//, // 관리자 경로
  /^\/_next\//, // Next.js 내부 경로
];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 정적 파일이나 무시할 경로인 경우 통과
  if (STATIC_PATHS.some((pattern) => pattern.test(path))) {
    return NextResponse.next();
  }

  // 토큰 확인 - 서버 검증은 실제 API 요청에서 수행됨
  // 여기서는 기본적인 토큰 존재 여부만 확인하고 리다이렉트 결정
  // 토큰의 유효성 검증은 백엔드 서버에서 수행됨
  const accessToken = request.cookies.get("accessToken");
  const refreshToken = request.cookies.get("refreshToken");
  const hasAuthToken = accessToken || refreshToken;

  console.log(
    `[Middleware] 경로: ${path}, 토큰 존재: ${Boolean(hasAuthToken)}`
  );
  console.log(
    `[Middleware] accessToken: ${
      accessToken ? "있음" : "없음"
    }, refreshToken: ${refreshToken ? "있음" : "없음"}`
  );

  // 인증이 필요 없는 경로들
  const publicPaths = [
    "/",
    "/login",
    "/signup",
    "/find-id",
    "/find-password",
    "/auth",
  ];

  // 현재 경로가 public 경로인지 확인
  const isPublicPath = publicPaths.some(
    (publicPath) => path === publicPath || path.startsWith(publicPath + "/")
  );

  // 토큰이 없고 public 경로가 아니면 로그인 페이지로 리다이렉트
  // 토큰 유효성 검증은 백엔드 API 호출 시 수행됨
  if (!hasAuthToken && !isPublicPath) {
    console.log(
      `[Middleware] 인증 토큰 없음, 로그인 페이지로 리다이렉트: ${path}`
    );
    return NextResponse.redirect(new URL("/login", request.url));
  }

  console.log(`[Middleware] 통과: ${path}`);
  return NextResponse.next();
}

// 미들웨어는 페이지 요청에만 적용하고 정적 파일 요청은 건너뜁니다
export const config = {
  matcher: [
    // 모든 경로 - 하지만 정적 파일은 matcher에서 자동으로 제외됨
    "/(.*)",
  ],
};
