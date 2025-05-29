"use client";
import Sidebar from "@/components/sidebar";
import type React from "react";
import ChatFloatingButton from "@/components/ChatFloatingButton";
import { ApartnerTalkProvider } from "@/contexts/ApartnerTalkContext";

export default function UdashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ApartnerTalkProvider>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
        <ChatFloatingButton />
      </div>
    </ApartnerTalkProvider>
  );
}
