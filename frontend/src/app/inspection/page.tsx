'use client';

import { useState } from 'react';
import { Tab } from '@headlessui/react';
import InspectionItemManagement from '@/components/inspection/InspectionItemManagement';
import InspectionSchedule from '@/components/inspection/InspectionSchedule';
import InspectionHistory from '@/components/inspection/InspectionHistory';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function InspectionPage() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const tabs = [
    { name: '점검 항목 관리', component: InspectionItemManagement },
    { name: '점검 일정', component: InspectionSchedule },
    { name: '점검 이력', component: InspectionHistory },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">시설 점검 관리</h1>
        
        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <Tab.List className="flex space-x-1 rounded-xl bg-white p-1 shadow-sm">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )
                }
              >
                {tab.name}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-6">
            {tabs.map((tab, idx) => (
              <Tab.Panel
                key={idx}
                className={classNames(
                  'rounded-xl bg-white p-6',
                  'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
                )}
              >
                <tab.component />
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
} 