'use client';
import {
  Home,
  Settings,
  Bell,
  Users,
  MessageSquare,
  UserCircle,
  Building,
} from 'lucide-react';
import type React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGlobalLoginMember } from '@/auth/loginMember';

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({
  href,
  icon: Icon,
  label,
  isActive,
}) => {
  return (
    <Link
      href={href}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        isActive
          ? 'bg-pink-100 text-pink-700 font-semibold dark:bg-pink-950/50 dark:text-pink-300'
          : 'text-foreground hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-pink-950/30 dark:hover:text-pink-300'
      }`}
    >
      <Icon
        size={20}
        className={
          isActive
            ? 'text-pink-700 dark:text-pink-300'
            : 'text-muted-foreground group-hover:text-pink-600 dark:group-hover:text-pink-300'
        }
      />
      <span>{label}</span>
    </Link>
  );
};

const Sidebar = () => {
  const pathname = usePathname();
  const { loginMember, isLogin } = useGlobalLoginMember();

  // 시설 점검 경로 확인 함수 - 상세 페이지도 포함하도록 수정
  const isInspectionPath = (path: string) => {
    return (
      path === '/udash/inspections' ||
      path.startsWith('/udash/inspections/') ||
      path === '/inspection-detail'
    );
  };

  const navItems = [
    { href: '/udash', icon: Home, label: '대시보드' },
    {
      href: '/udash/facilities',
      icon: Building,
      label: '공용시설',
    },
    { href: '/udash/vehicles', icon: UserCircle, label: '차량 관리' },
    { href: '/udash/complaints', icon: Users, label: '민원 관리' },
    {
      href: '/udash/inspections',
      icon: Settings,
      label: '시설 점검',
      isActive: isInspectionPath(pathname),
    },
    { href: '/udash/notices', icon: Bell, label: '공지사항' },
    { href: '/udash/community', icon: MessageSquare, label: '소통 관리' },
  ];

  return (
    <div className="w-64 bg-card h-screen p-5 flex flex-col border-r border-border shrink-0">
      <div className="mb-10 flex flex-col items-start">
        <Link
          href="/"
          className="flex items-center space-x-2 mb-2 hover:opacity-80 transition-opacity"
        >
          <Building size={32} className="text-pink-600 dark:text-pink-400" />
          <h1 className="text-2xl font-bold text-foreground">APTner</h1>
        </Link>
        {isLogin && loginMember ? (
          <div className="bg-secondary p-3 rounded-lg w-full mt-5">
            <p className="text-sm font-semibold text-foreground">
              {loginMember.userName || '입주민'}
            </p>
            {(loginMember.apartmentName ||
              loginMember.buildingName ||
              loginMember.unitNumber) && (
              <p className="text-xs text-muted-foreground">
                {loginMember.apartmentName}
                {loginMember.buildingName && ` ${loginMember.buildingName}`}
                {loginMember.unitNumber && ` ${loginMember.unitNumber}`}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-secondary p-3 rounded-lg w-full mt-5">
            <p className="text-sm font-semibold text-foreground">로그인 필요</p>
            <p className="text-xs text-muted-foreground">
              서비스를 이용해주세요.
            </p>
          </div>
        )}
      </div>
      <nav className="flex-grow">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.label}>
              <NavItem
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={
                  item.isActive !== undefined
                    ? item.isActive
                    : pathname === item.href
                }
              />
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto">
        {/* Footer or additional links can go here */}
      </div>
    </div>
  );
};

export default Sidebar;
