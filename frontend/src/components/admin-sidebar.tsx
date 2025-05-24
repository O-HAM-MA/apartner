"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGlobalAdminMember } from "@/auth/adminMember";
import { get } from "@/utils/api";
import { toast } from "@/components/ui/use-toast";

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
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { adminMember, logoutAndRedirect } = useGlobalAdminMember();
  const [authorizedMenus, setAuthorizedMenus] = useState<AdminMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [useDefaultMenus, setUseDefaultMenus] = useState(false);

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
      title: "Dashboard",
      href: "/admin/addash",
      icon: LayoutDashboard,
    },
    {
      title: "User Management",
      href: "/admin/users",
      icon: Users,
    },
    {
      title: "Grade Management",
      href: "/admin/grades",
      icon: Shield,
    },
    {
      title: "Admin Accounts",
      href: "/admin/accounts",
      icon: Settings,
    },
    {
      title: "Chat Management",
      href: "/admin/chat",
      icon: MessageSquare,
    },
    {
      title: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
    },
    {
      title: "Notifications",
      href: "/admin/notifications",
      icon: Bell,
    },
    {
      title: "Complaints",
      href: "/admin/complaints",
      icon: Bell,
    },
  ];

  // 사용자 등급에 따른 메뉴 가져오기
  useEffect(() => {
    const fetchUserMenus = async () => {
      try {
        setLoading(true);

        // 사용자 등급에 따른 메뉴 API 호출
        const response = await get<ApiResponse<AdminMenu[]>>(
          "/api/v1/admin/menu/me/menus"
        );

        if (response.success && response.data) {
          setAuthorizedMenus(response.data);
          setUseDefaultMenus(false);
        } else {
          console.error(
            "메뉴 정보를 불러오는데 실패했습니다:",
            response.message
          );
          setUseDefaultMenus(true);
        }
      } catch (error) {
        console.error("메뉴 권한 로드 중 오류 발생:", error);
        setUseDefaultMenus(true);
        // 개발 중에는 오류 메시지를 표시하지 않음
        // toast({
        //   title: "오류",
        //   description: "메뉴 권한을 불러오는데 실패했습니다.",
        //   variant: "destructive",
        // });
      } finally {
        setLoading(false);
      }
    };

    // 로그인 된 상태인 경우에만 메뉴 가져오기
    if (adminMember?.id) {
      fetchUserMenus();
    } else {
      setLoading(false);
      setUseDefaultMenus(true);
    }
  }, [adminMember?.id]);

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

  // 최종 사용할 메뉴 아이템 (API 호출 성공 시 동적 메뉴, 실패 시 기본 메뉴)
  const navItems = useDefaultMenus ? defaultMenuItems : dynamicNavItems;

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
          "fixed lg:static inset-0 z-30 lg:z-0 bg-background/80 backdrop-blur-sm lg:backdrop-blur-none lg:bg-transparent transform transition-transform duration-200 lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full w-64 border-r bg-background flex flex-col">
          <div className="p-4 border-b">
            <div className="font-bold text-lg">Apartner Admin</div>
            <div className="text-sm text-muted-foreground">관리자 대시보드</div>
          </div>
          <div className="flex-1 overflow-auto py-2">
            {loading ? (
              <div className="flex justify-center items-center h-20">
                <div className="text-sm text-muted-foreground">
                  메뉴 로드 중...
                </div>
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
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-muted",
                        isActive
                          ? "bg-muted font-medium text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
          <div className="mt-auto p-4 border-t">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={adminMember.profileImageUrl || undefined}
                  alt="Admin"
                />
                <AvatarFallback>
                  {adminMember.userName?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {adminMember.userName || "관리자"}
                </div>
                <div className="text-xs text-muted-foreground truncate max-w-28">
                  {adminMember.email || "admin@apartner.site"}
                </div>
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

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
