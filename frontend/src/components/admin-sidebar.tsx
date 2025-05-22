"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGlobalAdminMember } from "@/auth/adminMember";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { adminMember, logoutAndRedirect } = useGlobalAdminMember();

  const navItems = [
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
      title: "Role Management",
      href: "/admin/roles",
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
                  {adminMember.email || "admin@apartner.com"}
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
