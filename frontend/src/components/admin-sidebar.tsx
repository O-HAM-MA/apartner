'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  MessageSquare,
  BarChart3,
  Bell,
  LogOut,
  Menu,
  X,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useGlobalAdminMember } from '@/auth/adminMember';
import { get } from '@/utils/api';
import { toast } from '@/components/ui/use-toast';
import NotificationBell from '@/components/notification-bell';
import NotificationStatus from '@/components/notification-status';

// API 응답 타입 정의
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface AdminMenu {
  id: string;
  name: string;
  url: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { adminMember, logoutAndRedirect } = useGlobalAdminMember();
  const [authorizedMenus, setAuthorizedMenus] = useState<AdminMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [useDefaultMenus, setUseDefaultMenus] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [noMenusRegistered, setNoMenusRegistered] = useState(false);

  // 아이콘 맵핑
  const iconMap: Record<string, any> = {
    LayoutDashboard: LayoutDashboard,
    Users: Users,
    Shield: Shield,
    Settings: Settings,
    MessageSquare: MessageSquare,
    BarChart3: BarChart3,
    Bell: Bell,
    FileText: FileText,
  };

  // 기본 메뉴 (API 호출 실패 시 사용)
  const defaultMenuItems = [
    {
      title: 'Dashboard',
      href: '/admin/addash',
      icon: LayoutDashboard,
    },
  ];

  // ADMIN 권한 사용자를 위한 기본 메뉴 (시스템에 메뉴가 없을 경우)
  const adminFallbackMenuItems = [
    {
      title: 'Dashboard',
      href: '/admin/addash',
      icon: LayoutDashboard,
    },
    {
      title: '메뉴 관리',
      href: '/admin/grades',
      icon: Settings,
    },
  ];

  // 사용자 등급에 따른 메뉴 가져오기
  useEffect(() => {
    const fetchUserMenus = async () => {
      try {
        setLoading(true);
        setApiError(null);
        setNoMenusRegistered(false);

        console.log('[메뉴 로드] 메뉴 API 호출 시작 - 사용자:', adminMember);
        console.log('[메뉴 로드] ADMIN 여부:', adminMember.isAdmin);

        // 사용자 등급에 따른 메뉴 API 호출
        const response = await get<ApiResponse<AdminMenu[]>>(
          '/api/v1/admin/menu/me/menus'
        );

        console.log('[메뉴 로드] API 응답:', JSON.stringify(response));

        if (response.success) {
          // 메뉴가 있는 경우 (ADMIN이든 MANAGER든)
          if (Array.isArray(response.data) && response.data.length > 0) {
            console.log(
              `[메뉴 로드] 권한이 있는 메뉴 ${response.data.length}개 로드됨:`,
              response.data
            );
            setAuthorizedMenus(response.data);
            setUseDefaultMenus(false);
          }
          // ADMIN인데 반환된 메뉴가 없는 경우 (아직 메뉴가 등록되지 않음)
          else if (adminMember && adminMember.isAdmin) {
            console.log(
              '[메뉴 로드] ADMIN 권한이지만 등록된 메뉴가 없습니다. 기본 ADMIN 메뉴 사용'
            );
            setNoMenusRegistered(true);
            setUseDefaultMenus(true);
          }
          // MANAGER인데 권한 있는 메뉴가 없는 경우
          else {
            console.log(
              '[메뉴 로드] MANAGER 권한이며 접근 가능한 메뉴가 없습니다.'
            );
            setAuthorizedMenus([]);
            setUseDefaultMenus(false);
          }
        } else {
          console.error(
            '[메뉴 로드 오류] 메뉴 정보를 불러오는데 실패했습니다:',
            response.message
          );
          setApiError(response.message || 'API 응답이 유효하지 않습니다');
          setUseDefaultMenus(true);
        }
      } catch (error) {
        console.error('[메뉴 로드 오류] 메뉴 권한 로드 중 오류 발생:', error);
        setApiError(
          error instanceof Error ? error.message : '알 수 없는 오류 발생'
        );
        setUseDefaultMenus(true);
        // 개발 환경에서는 오류 토스트 표시
        if (process.env.NODE_ENV === 'development') {
          toast({
            title: '메뉴 로드 오류',
            description:
              error instanceof Error
                ? error.message
                : '메뉴 권한을 불러오는데 실패했습니다.',
            variant: 'destructive',
          });
        }
      } finally {
        setLoading(false);
      }
    };

    // 로그인 된 상태인 경우에만 메뉴 가져오기
    if (adminMember?.id) {
      console.log(
        '[메뉴 로드] 로그인 상태 확인됨, 메뉴 가져오기 시도',
        adminMember
      );
      fetchUserMenus();
    } else {
      console.log('[메뉴 로드] 로그인되지 않음, 기본 메뉴 사용');
      setLoading(false);
      setUseDefaultMenus(true);
    }
  }, [adminMember?.id, adminMember.isAdmin]);

  // API에서 가져온 메뉴를 사이드바 형식으로 변환
  const dynamicNavItems = authorizedMenus.map((menu) => {
    // 기본 아이콘
    let IconComponent = FileText;

    // 메뉴에 아이콘 정보가 있고, 해당 아이콘이 맵핑에 존재하면 사용
    if (menu.icon && iconMap[menu.icon]) {
      IconComponent = iconMap[menu.icon];
    }

    return {
      title: menu.name,
      href: menu.url,
      icon: IconComponent,
      description: menu.description,
    };
  });

  // 최종 사용할 메뉴 아이템 선택
  const navItems = (() => {
    // 동적 메뉴가 있으면 사용
    if (!useDefaultMenus) {
      return dynamicNavItems;
    }

    // ADMIN이고 시스템에 등록된 메뉴가 없는 경우 관리용 메뉴 제공
    if (adminMember.isAdmin && noMenusRegistered) {
      return adminFallbackMenuItems;
    }

    // 그 외의 경우 기본 메뉴 사용
    return defaultMenuItems;
  })();

  console.log(
    '[메뉴 렌더링] 메뉴 항목:',
    navItems,
    '기본메뉴사용:',
    useDefaultMenus,
    'ADMIN여부:',
    adminMember.isAdmin
  );

  // ADMIN이거나 메뉴가 있는 경우에만 접근 가능
  const hasAccessToMenu = adminMember.isAdmin || navItems.length > 0;

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed lg:hidden top-4 left-4 z-40">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          'fixed lg:static inset-0 z-30 lg:z-0 lg:backdrop-blur-none lg:bg-transparent transform transition-transform duration-200 lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-full w-64 border-r bg-background flex flex-col">
          <div className="p-4 border-b flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-lg">Apartner Admin</div>
                <div className="text-sm text-muted-foreground">
                  관리자 대시보드
                </div>
                {adminMember.isAdmin && (
                  <div className="text-xs mt-1 text-green-600">ADMIN 권한</div>
                )}
              </div>
              <NotificationBell />
            </div>

            <NotificationStatus className="ml-auto mt-2" />
          </div>
          <div className="flex-1 overflow-auto py-2">
            {loading ? (
              <div className="flex justify-center items-center h-20">
                <div className="text-sm text-muted-foreground">
                  메뉴 로드 중...
                </div>
              </div>
            ) : apiError ? (
              <div className="px-4 py-3 text-sm text-red-500">
                <p className="font-medium">메뉴 로드 오류</p>
                <p className="text-xs mt-1">{apiError}</p>
                <p className="text-xs mt-2">관리자 권한 확인 필요</p>
              </div>
            ) : navItems.length === 0 ? (
              <div className="px-4 py-3 text-sm text-amber-500">
                <p className="font-medium">표시할 메뉴 없음</p>
                {adminMember.isAdmin ? (
                  <div>
                    <p className="text-xs mt-1">
                      시스템에 등록된 메뉴가 없습니다
                    </p>
                    <p className="text-xs mt-1">
                      메뉴 관리에서 메뉴를 추가해주세요
                    </p>
                    <Link
                      href="/admin/grades"
                      className="text-xs mt-2 flex items-center text-blue-500 hover:underline"
                    >
                      <Settings className="mr-1 h-3 w-3" />
                      메뉴 관리로 이동
                    </Link>
                  </div>
                ) : (
                  <p className="text-xs mt-1">
                    계정에 메뉴 접근 권한이 없습니다
                  </p>
                )}
              </div>
            ) : (
              <nav className="grid gap-1 px-2">
                {navItems.map((item, index) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={index}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-muted',
                        isActive
                          ? 'bg-muted font-medium text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </Link>
                  );
                })}

                {/* ADMIN이라면 메뉴 관리 추가 (어떤 경우든) */}
                {adminMember.isAdmin &&
                  !navItems.some((item) => item.href === '/admin/grades') && (
                    <Link
                      href="/admin/grades"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-muted',
                        pathname === '/admin/grades'
                          ? 'bg-muted font-medium text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      <Settings className="h-4 w-4" />
                      메뉴 관리
                    </Link>
                  )}
              </nav>
            )}
          </div>
          <div className="p-4 border-t mb-20">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={adminMember.profileImageUrl || undefined}
                  alt="Admin"
                />
                <AvatarFallback>
                  {adminMember.userName?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {adminMember.userName || '관리자'}
                </div>
                <div className="text-xs text-muted-foreground truncate max-w-28">
                  {adminMember.email || 'admin@apartner.site'}
                </div>
                {adminMember.isAdmin && (
                  <div className="text-xs text-green-600">ADMIN 권한</div>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={logoutAndRedirect}
            >
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
