"use client";

import type { ReactNode } from "react";
import AdminSidebar from "@/components/admin-sidebar";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin";

  return (
    <div className="flex min-h-screen bg-muted/30 overflow-hidden">
      {!isLoginPage && <AdminSidebar />}
      <main
        className={`overflow-auto ${isLoginPage ? "w-full" : "flex-1 p-8"}`}
      >
        {children}
      </main>
    </div>
  );
}
