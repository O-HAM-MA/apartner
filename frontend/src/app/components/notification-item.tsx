import React from 'react';

interface NotificationItemProps {
  title: string;
  details?: string;
  time: string;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ title, details, time }) => {
  return (
    <div className="py-4 border-b border-gray-200 last:border-b-0">
      <h4 className="font-semibold text-gray-800 text-sm mb-1">{title}</h4>
      {details && <p className="text-xs text-gray-500 mb-1">{details}</p>}
      <p className="text-xs text-gray-400">{time}</p>
    </div>
  );
};

export default NotificationItem; 