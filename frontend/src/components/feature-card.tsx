"use client";

import { motion } from "framer-motion";
// import { LucideProps } from "lucide-react"; // 제거 또는 주석 처리
import React from "react";
import * as Icons from "lucide-react"; // 모든 아이콘을 Icons 객체로 가져옵니다.

interface FeatureCardProps {
  title: string;
  description: string;
  icon: keyof typeof Icons; // 타입을 string에서 Icons의 key로 변경
  iconBgColor?: string; // 다시 추가 (page.tsx에서 사용중)
  iconColor?: string; // 다시 추가 (page.tsx에서 사용중)
  // actionIcon?: keyof typeof Icons; // 필요하다면 actionIcon도 동일하게 처리
}

export default function FeatureCard({
  title,
  description,
  icon,
  iconBgColor = "bg-primary/10", // 기본값 설정
  iconColor = "text-primary", // 기본값 설정
}: FeatureCardProps) {
  const IconComponent = Icons[icon] as React.ElementType;

  if (!IconComponent) {
    // 적절한 fallback 아이콘이나 에러 처리를 할 수 있습니다.
    return <div>Invalid icon: {icon}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className="bg-card border border-border rounded-lg p-6 transition-all duration-300 hover:shadow-md h-full flex flex-col"
    >
      <div
        className={`w-12 h-12 ${iconBgColor} rounded-full flex items-center justify-center mb-4 shrink-0`}
      >
        <IconComponent size={24} className={iconColor} />
      </div>
      <div className="flex flex-col grow">
        <h3 className="text-xl font-semibold mb-3">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {/* actionIcon이 필요하다면 여기에 렌더링 로직 추가 */}
    </motion.div>
  );
}
