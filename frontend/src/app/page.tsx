"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  ThumbsUp,
  ArrowRight,
  Menu,
  Moon,
  Sun,
} from "lucide-react";
import PhotoGallery from "@/components/photo-gallery";
import MobileMenu from "@/components/mobile-menu";
import { useGlobalLoginMember } from "@/auth/loginMember"; // useGlobalLoginMember 훅 import

// 알림 기능 관련 임포트 주석 처리
// import NotificationBell from "@/components/notification-bell"
// import { useNotifications } from "@/contexts/notification-context"
// import { toast } from "@/components/ui/use-toast"
// import { ToastAction } from "@/components/ui/toast"

export default function Home() {
  const { isLogin, loginMember } = useGlobalLoginMember(); // 로그인 정보 가져오기
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // 알림 기능 관련 코드 주석 처리
  // const { addNotification } = useNotifications()

  // Ensure theme toggle only renders client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  // 알림 기능 관련 코드 주석 처리
  /*
  // Demo: Show a welcome notification when the page loads
  useEffect(() => {
    if (mounted) {
      setTimeout(() => {
        const welcomeNotification = {
          title: "환영합니다",
          message: "아파트 관리 시스템에 오신 것을 환영합니다. 새로운 알림 기능이 추가되었습니다.",
          type: "info" as const,
        }

        addNotification(welcomeNotification.title, welcomeNotification.message, welcomeNotification.type)

        toast({
          title: welcomeNotification.title,
          description: welcomeNotification.message,
          action: <ToastAction altText="확인">확인</ToastAction>,
        })
      }, 2000)
    }
  }, [mounted, addNotification])
  */

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <MobileMenu onClose={() => setMobileMenuOpen(false)} />
        )}
      </AnimatePresence>

      {/* Header */}
      {isLogin && (
        <section className="bg-pink-100 dark:bg-pink-900/30 transition-colors duration-300">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
                >
                  {loginMember?.profileImageUrl ? (
                    <Image
                      src={loginMember.profileImageUrl}
                      alt={loginMember.userName || "Profile"}
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  ) : (
                    <Image
                      src="/placeholder.svg?height=64&width=64"
                      alt="Profile"
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  )}
                </motion.div>
                <div>
                  <motion.h1
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-xl font-bold dark:text-white"
                  >
                    {`${loginMember?.userName} 입주민`}
                  </motion.h1>
                  {(loginMember?.apartmentName ||
                    loginMember?.buildingName ||
                    loginMember?.unitNumber) && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="bg-pink-200 dark:bg-pink-800 text-pink-800 dark:text-pink-100 text-xs px-2 py-1 rounded inline-block mt-1"
                    >
                      {loginMember.apartmentName} {loginMember.buildingName}동{" "}
                      {loginMember.unitNumber}호
                    </motion.div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {mounted && (
                  <>
                    {/* 알림 벨 컴포넌트 주석 처리 */}
                    {/* <NotificationBell /> */}
                    <button
                      onClick={toggleTheme}
                      className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-pink-200 dark:hover:bg-pink-800/50 transition-colors"
                      aria-label="Toggle theme"
                    >
                      {theme === "dark" ? (
                        <Sun className="w-5 h-5" />
                      ) : (
                        <Moon className="w-5 h-5" />
                      )}
                    </button>
                  </>
                )}
                <Link href="/udash">
                  <Button className="bg-black hover:bg-black/80 text-white dark:bg-white dark:text-black dark:hover:bg-white/80">
                    대시보드 가기
                  </Button>
                </Link>
                <button
                  className="md:hidden flex items-center justify-center ml-2"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-2 text-sm text-gray-600 dark:text-gray-300 max-w-md"
            >
              안녕하세요! 아파트 관리 시스템에 오신 것을 환영합니다.
            </motion.p>
          </div>
        </section>
      )}

      <main className="flex-1">
        {/* Hero Section with Photo Gallery */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center flex flex-col items-center justify-center"
            >
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                더 편리하고 효율적인 아파트 생활을 위한 서비스를 만나보세요.
              </p>

              {/* Dynamic Photo Gallery */}
              <PhotoGallery
                images={[
                  {
                    src: "/아파트 조경.jpg",
                    alt: "아파트 조경",
                    title: "아파트 조경",
                    description: "계절의 아름다움을 담은 아파트 조경",
                  },
                  {
                    src: "/지하주차장2.jpg",
                    alt: "주차 시설",
                    title: "주차 시설",
                    description: "넓고 안전한 지하 주차 공간",
                  },
                  {
                    src: "/커뮤니티 시설2.jpg",
                    alt: "커뮤니티 시설",
                    title: "커뮤니티 시설",
                    description: "다양한 활동을 즐길 수 있는 커뮤니티 공간",
                  },
                  {
                    src: "/아파트단지2.jpg",
                    alt: "아파트 단지",
                    title: "아파트 단지",
                    description: "편안하고 안락한 주거 환경",
                  },
                ]}
              />

              <div className="mt-4 flex justify-center">
                <span className="inline-block mx-1 w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></span>
                <span
                  className="inline-block mx-1 w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></span>
                <span
                  className="inline-block mx-1 w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                ></span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-start">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="w-full md:w-1/3 lg:w-1/4"
              >
                <div className="bg-gray-100 dark:bg-gray-800 w-full aspect-square mb-6 rounded-lg relative overflow-hidden">
                  <Image
                    src="/소개.png"
                    alt="서비스 소개"
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
                <h2 className="text-3xl font-bold mb-2 dark:text-white">
                  서비스 소개
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  아파트 관리 시스템의 주요 기능
                </p>
              </motion.div>

              <div className="w-full md:w-2/3 lg:w-3/4 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Service Card 1 */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="group"
                >
                  <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg flex items-center justify-center aspect-square mb-4 transition-all duration-300 group-hover:shadow-md relative overflow-hidden">
                    <Image
                      src="/시설예약.png"
                      alt="시설 예약"
                      layout="fill"
                      objectFit="contain"
                      className="p-4"
                    />
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      시설 예약
                    </p>
                    <h3 className="font-medium mb-4 dark:text-white">
                      편리한 비대면 예약 서비스 제공
                    </h3>
                    <div className="flex items-center gap-4 text-gray-400 dark:text-gray-500">
                      <ThumbsUp className="w-4 h-4 transition-transform duration-300 group-hover:scale-110 group-hover:text-pink-400" />
                      <MessageCircle className="w-4 h-4 transition-transform duration-300 group-hover:scale-110 group-hover:text-pink-400" />
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-pink-400" />
                    </div>
                  </div>
                </motion.div>

                {/* Service Card 2 */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="group"
                >
                  <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg flex items-center justify-center aspect-square mb-4 transition-all duration-300 group-hover:shadow-md relative overflow-hidden">
                    <Image
                      src="/소통채널.png"
                      alt="소통 채널"
                      layout="fill"
                      objectFit="contain"
                      className="p-4"
                    />
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      소통 채널
                    </p>
                    <h3 className="font-medium mb-4 dark:text-white">
                      공지 및 민원 제출을 쉽게 할 수 있습니다
                    </h3>
                    <div className="flex items-center gap-4 text-gray-400 dark:text-gray-500">
                      <ThumbsUp className="w-4 h-4 transition-transform duration-300 group-hover:scale-110 group-hover:text-pink-400" />
                      <MessageCircle className="w-4 h-4 transition-transform duration-300 group-hover:scale-110 group-hover:text-pink-400" />
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-pink-400" />
                    </div>
                  </div>
                </motion.div>

                {/* Service Card 3 */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="group"
                >
                  <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg flex items-center justify-center aspect-square mb-4 transition-all duration-300 group-hover:shadow-md relative overflow-hidden">
                    <Image
                      src="/유지보수.png"
                      alt="안전 점검"
                      layout="fill"
                      objectFit="contain"
                      className="p-4"
                    />
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      안전 점검
                    </p>
                    <h3 className="font-medium mb-4 dark:text-white">
                      공용 시설의 안전 점검 일정을 확인하세요
                    </h3>
                    <div className="flex items-center gap-4 text-gray-400 dark:text-gray-500">
                      <ThumbsUp className="w-4 h-4 transition-transform duration-300 group-hover:scale-110 group-hover:text-pink-400" />
                      <MessageCircle className="w-4 h-4 transition-transform duration-300 group-hover:scale-110 group-hover:text-pink-400" />
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-pink-400" />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold mb-4 dark:text-white">
                주요 기능
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                아파트 생활을 더 편리하게 만들어주는 다양한 기능을 제공합니다
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  title: "실시간 알림",
                  desc: "중요 공지사항을 실시간으로 받아보세요",
                },
                {
                  title: "간편한 예약",
                  desc: "주민 시설 예약을 손쉽게 할 수 있습니다",
                },
                {
                  title: "민원 접수",
                  desc: "불편사항을 빠르게 접수하고 처리 상황을 확인하세요",
                },
                {
                  title: "커뮤니티",
                  desc: "이웃과 소통하고 정보를 공유할 수 있습니다",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-pink-500 dark:text-pink-300 font-bold">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-center dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-center">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
