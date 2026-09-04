import React from 'react';
import {
  Compass,
  Target,
  CheckSquare,
  Calendar,
  Sparkles,
  TrendingUp,
  User,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'TODAY', label: 'HUB', icon: Compass },
    { id: 'MISSIONS', label: 'MISSIONS', icon: Target },
    { id: 'HABITS', label: 'PROTOCOLS', icon: CheckSquare },
    { id: 'TRACKING', label: 'LOG', icon: Calendar },
    { id: 'REWARDS', label: 'MARKET', icon: Sparkles },
    { id: 'ASCEND', label: 'ASCEND', icon: TrendingUp },
    { id: 'PROFILE', label: 'HERO', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0A0E17]/95 backdrop-blur-lg border-t border-blue-900/20 px-1 py-1 select-none safe-area-pb">
      <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-all min-w-[44px]
                ${
                  isActive
                    ? 'text-red-500 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }
              `}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110 text-red-500' : ''}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-600 shadow-[0_0_6px_#ef4444]" />
                )}
              </div>
              <span className="text-[8px] font-mono tracking-tighter mt-0.5 uppercase whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
