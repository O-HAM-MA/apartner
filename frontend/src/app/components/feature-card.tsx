import React from 'react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  iconBgColor?: string;
  iconColor?: string;
  actionIcon?: React.ElementType; // 오른쪽 상단 아이콘 (선택적)
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon: Icon, iconBgColor = 'bg-pink-100', iconColor = 'text-pink-600', actionIcon: ActionIcon }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between h-full">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-lg ${iconBgColor}`}>
            <Icon size={28} className={`${iconColor}`} />
          </div>
          {ActionIcon && (
            <div className="text-gray-400 hover:text-pink-500 cursor-pointer">
              <ActionIcon size={20} />
            </div>
          )}
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
      {/* 추가적인 버튼이나 링크가 필요하다면 여기에 추가 */}
    </div>
  );
};

export default FeatureCard; 