"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
  ];

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "h-screen w-64 bg-background border-r transition-transform duration-200 ease-in-out lg:block",
          isMobileMenuOpen
            ? "fixed inset-y-0 left-0 z-40 translate-x-0"
            : "fixed inset-y-0 left-0 z-40 -translate-x-full lg:relative lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <Link href="/admin" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-apartner-600 dark:text-apartner-400">
                Apartner Admin
              </span>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    pathname === item.href
                      ? "bg-apartner-100 text-apartner-600 dark:bg-apartner-900/50 dark:text-apartner-400"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>

          <div className="p-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage
                    src="/placeholder.svg?height=32&width=32"
                    alt="Admin"
                  />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-muted-foreground">
                    admin@apartner.com
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
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
