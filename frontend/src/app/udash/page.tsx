import FeatureCard from '@/components/feature-card';
import NotificationItem from '@/components/notification-item';
import client from '@/lib/backend/client';
import RecentNotifications from '@/components/RecentNotifications';
import {
  CalendarDays,
  Edit3,
  FileText,
  Megaphone,
  BellRing,
  Zap,
  MessageCircle,
  UserCircle,
  Car,
  CarFront,
} from 'lucide-react';

const DashboardPage = () => {
  const featureCards = [
    {
      title: '공용시설',
      description: '헬스장, 독서실 등 공용시설 예약 및 예약 내역 확인',
      icon: 'CalendarDays',
      actionIcon: 'Edit3',
      href: '/udash/facilities',
    },
    {

      title: "차량관리",
      description: "입주민 차량 등록 및 관리",
      icon: "CarFront",
      actionIcon: "Zap",
      href: "/udash/vehicles",

    },
    {
      title: '시설 점검',
      description: '시설 점검 일정 및 이력 관리',
      icon: 'FileText',
      actionIcon: 'Edit3',
      href: '/udash/inspections',
    },
    {
      title: '민원 관리',
      description: '민원 신청 및 처리 현황',
      icon: 'MessageCircle',
      actionIcon: 'Edit3',
      href: '/udash/complaints',
    },
    {
      title: '공지사항',
      description: '아파트 주요 공지 및 안내사항',
      icon: 'Megaphone',
      actionIcon: 'Megaphone',
      href: '/udash/notices',

      
    },
    {
      title: '소통 관리',
      description: '입주민 커뮤니티 소통 게시판',
      icon: 'MessageCircle',
      actionIcon: 'Edit3',
      href: '/udash/community',
    },
  ] as const;

  const notifications = [
    {
      title: '헬스장 예약이 승인되었습니다.',
      details: '2024-03-20 14:00-16:00',
      time: '1시간 전',
    },
    {
      title: '3월 관리비 고지서가 발행되었습니다.',
      details: '납부 마감일: 2024-03-25',
      time: '3시간 전',
    },
    {
      title: '커뮤니티센터 대청소 안내',
      details: '내일 오전 10시부터',
      time: '5시간 전',
    },
  ];

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* <Sidebar /> */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">대시보드</h2>
          <div className="flex items-center space-x-4">
            {/* 불필요한 벨 아이콘 제거 (사이드바에 이미 있음) */}
          </div>
        </header>

        {/* 첫 번째 줄: 공용시설 예약, 차량관리, 민원관리 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <FeatureCard
            key={featureCards[0].title}
            title={featureCards[0].title}
            description={featureCards[0].description}
            icon={featureCards[0].icon}
            href={featureCards[0].href}
          />
          <FeatureCard
            key={featureCards[1].title}
            title={featureCards[1].title}
            description={featureCards[1].description}
            icon={featureCards[1].icon}
            href={featureCards[1].href}
          />
          <FeatureCard
            key={featureCards[3].title}
            title={featureCards[3].title}
            description={featureCards[3].description}
            icon={featureCards[3].icon}
            href={featureCards[3].href}
          />
        </div>

        {/* 두 번째 줄: 점검관리, 공지사항, 소통관리 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <FeatureCard
            key={featureCards[2].title}
            title={featureCards[2].title}
            description={featureCards[2].description}
            icon={featureCards[2].icon}
            href={featureCards[2].href}
          />
          <FeatureCard
            key={featureCards[4].title}
            title={featureCards[4].title}
            description={featureCards[4].description}
            icon={featureCards[4].icon}
            href={featureCards[4].href}
          />
          <FeatureCard
            key={featureCards[5].title}
            title={featureCards[5].title}
            description={featureCards[5].description}
            icon={featureCards[5].icon}
            href={featureCards[5].href}
          />
        </div>

        {/* Recent Notifications Section */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            최근 알림
          </h3>
          <RecentNotifications />
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
