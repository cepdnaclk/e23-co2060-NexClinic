import React from 'react';
import { motion } from 'framer-motion';

export type AppointmentCategory = 'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

interface AppointmentTabsProps {
  activeTab: AppointmentCategory;
  onTabChange: (tab: AppointmentCategory) => void;
  counts: Record<AppointmentCategory, number>;
}

const TABS: { id: AppointmentCategory; label: string; colorClass: string }[] = [
  { id: 'ALL', label: 'All Appointments', colorClass: 'bg-gray-100 text-gray-800' },
  { id: 'UPCOMING', label: 'Upcoming', colorClass: 'bg-emerald-100 text-emerald-800' },
  { id: 'COMPLETED', label: 'Completed', colorClass: 'bg-blue-100 text-blue-800' },
  { id: 'CANCELLED', label: 'Cancelled', colorClass: 'bg-rose-100 text-rose-800' },
  { id: 'EXPIRED', label: 'Expired', colorClass: 'bg-slate-200 text-slate-800' },
];

export const AppointmentTabs: React.FC<AppointmentTabsProps> = ({ activeTab, onTabChange, counts }) => {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-gray-200 pb-2">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg flex items-center gap-2 ${
              isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            
            <span className={`px-2 py-0.5 text-xs rounded-full ${tab.colorClass}`}>
              {counts[tab.id] || 0}
            </span>

            {isActive && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute left-0 right-0 bottom-[-9px] h-[2px] bg-indigo-600 rounded-t-full"
                initial={false}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
