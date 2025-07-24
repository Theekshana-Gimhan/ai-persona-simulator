
import React from 'react';
import { PhoneIcon } from './icons/PhoneIcon';
import { SettingsIcon } from './icons/SettingsIcon';

type Tab = 'simulation' | 'settings';

interface TabNavigatorProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const TabNavigator: React.FC<TabNavigatorProps> = ({ activeTab, setActiveTab }) => {
  const tabs: { id: Tab; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { id: 'simulation', label: 'Simulation', icon: PhoneIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="mb-6">
      <div className="flex justify-center border-b border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors duration-200 focus:outline-none ${
              activeTab === tab.id
                ? 'border-b-2 border-cyan-400 text-cyan-400'
                : 'text-slate-400 hover:text-white'
            }`}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabNavigator;
