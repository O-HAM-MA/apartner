'use client';
import {
  Home,
  Settings,
  Bell,
  BarChart,
  Users,
  MessageSquare,
  UserCircle,
  Building,
} from 'lucide-react';
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
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-pink-50 ${
        isActive ? 'bg-pink-100 text-pink-700 font-semibold' : 'text-gray-700'
      }`}
    >
      <Icon
        size={20}
        className={isActive ? 'text-pink-700' : 'text-gray-500'}
      />
      <span>{label}</span>
    </Link>
  );
};

const Sidebar = () => {
  const pathname = usePathname();
  const { loginMember, isLogin } = useGlobalLoginMember();

  const navItems = [
    { href: '/udash', icon: Home, label: '대시보드' },
    {
      href: '/udash/facilities',
      icon: Building,
      label: '공용시설 예약/확인',
    },
    { href: '/udash/vehicles', icon: UserCircle, label: '차량 관리' },
    {
      href: '/udash/inspections',
      icon: Settings,
      label: '점검 (소방/가스/전기/수도)',
    },
    { href: '/udash/complaints', icon: Users, label: '민원 관리' },
    { href: '/udash/notices', icon: Bell, label: '공지사항' },
    { href: '/udash/chat', icon: MessageSquare, label: '실시간 채팅' },
  ];

  return (
    <div className="w-64 bg-white h-screen p-5 flex flex-col border-r border-gray-200">
      <div className="mb-10 flex flex-col items-start">
        <div className="flex items-center space-x-2 mb-2">
          <Building size={32} className="text-pink-600" />
          <h1 className="text-2xl font-bold text-gray-800">APTner</h1>
        </div>
        {isLogin && loginMember ? (
          <div className="bg-gray-100 p-3 rounded-lg w-full mt-5">
            <p className="text-sm font-semibold text-gray-800">
              {loginMember.userName || '입주민'}
            </p>
            {(loginMember.apartmentName ||
              loginMember.buildingName ||
              loginMember.unitNumber) && (
              <p className="text-xs text-gray-500">
                {loginMember.apartmentName}
                {loginMember.buildingName && ` ${loginMember.buildingName}`}
                {loginMember.unitNumber && ` ${loginMember.unitNumber}`}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-gray-100 p-3 rounded-lg w-full mt-5">
            <p className="text-sm font-semibold text-gray-800">로그인 필요</p>
            <p className="text-xs text-gray-500">서비스를 이용해주세요.</p>
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
                isActive={pathname === item.href}
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
