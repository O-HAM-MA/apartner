"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileMenuProps {
  onClose: () => void;
}

export default function MobileMenu({ onClose }: MobileMenuProps) {
  const menuItems = [
    { name: "홈", href: "/" },
    { name: "공지사항", href: "/udash/notices" },
    { name: "민원접수", href: "/udash/complaints" },
    { name: "공용시설", href: "/udash/facilities" },
    { name: "차량관리", href: "/udash/vehicles" },
    { name: "시설점검", href: "/udash/inspections" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md"
    >
      <div className="fixed inset-0 z-50 flex flex-col p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-pink-200 dark:bg-pink-800"></div>
            <span className="text-xl font-bold dark:text-white">
              아파트 관리
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="메뉴 닫기"
          >
            <X className="w-6 h-6 dark:text-white" />
          </button>
        </div>

        <motion.nav className="flex flex-col items-center justify-center flex-1 space-y-8">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={item.href}
                className="text-2xl font-medium hover:text-pink-500 dark:text-white dark:hover:text-pink-300 transition-colors"
                onClick={onClose}
              >
                {item.name}
              </Link>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: menuItems.length * 0.1 }}
          >
            <Button
              size="lg"
              onClick={onClose}
              className="bg-black text-white dark:bg-white dark:text-black"
            >
              대시보드 가기
            </Button>
          </motion.div>
        </motion.nav>
      </div>
    </motion.div>
  );
}
