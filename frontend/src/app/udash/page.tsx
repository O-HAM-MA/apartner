import FeatureCard from "@/components/feature-card";
import NotificationItem from "@/components/notification-item";
import client from "@/lib/backend/client";
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
      title: '공용시설 예약',
      description: '헬스장, 독서실 등 공용시설 예약',
      icon: 'CalendarDays',
      actionIcon: 'Edit3',
      href: '/udash/facilities',
    },
    {
      title: '차량관리',
      description: '입주민 차량 등록 및 관리',
      icon: 'CarFront',
      actionIcon: 'Zap',
      href: '/udash/vehicles',
    },
    {
      title: '점검관리',
      description: '시설 점검 일정 및 이력 관리',
      icon: 'FileText',
      actionIcon: 'Edit3',
      href: '/udash/inspections',
    },
    {
      title: '민원관리',
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
            <button className="relative p-2 rounded-full hover:bg-gray-200 focus:outline-none">
              <BellRing size={22} className="text-gray-600" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-pink-500 ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        {/* Feature Cards Section */}
        {/* 이미지에는 4개의 카드가 있지만, 공지사항도 비슷한 스타일이라 5개로 구성 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {featureCards.slice(0, 2).map((card) => (
            <FeatureCard
              key={card.title}
              title={card.title}
              description={card.description}
              icon={card.icon}
              href={card.href}
            />
          ))}
          <FeatureCard
            key={featureCards[3].title}
            title={featureCards[3].title}
            description={featureCards[3].description}
            icon={featureCards[3].icon}
            href={featureCards[3].href}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {featureCards.slice(2, 3).map((card) => (
            <FeatureCard
              key={card.title}
              title={card.title}
              description={card.description}
              icon={card.icon}
              href={card.href}
            />
          ))}
          {featureCards.slice(4, 5).map((card) => (
            <FeatureCard
              key={card.title}
              title={card.title}
              description={card.description}
              icon={card.icon}
              href={card.href}
            />
          ))}
        </div>

        {/* Recent Notifications Section */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            최근 알림
          </h3>
          <div>
            {notifications.map((notification, index) => (
              <NotificationItem
                key={index}
                title={notification.title}
                details={notification.details}
                time={notification.time}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
