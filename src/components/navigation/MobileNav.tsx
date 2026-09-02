import React from 'react';
import {
  Compass,
  Target,
  Calendar,
  Sparkles,
  User,
  CheckSquare,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'TODAY', label: 'TODAY', icon: Compass },
    { id: 'MISSIONS', label: 'MISSIONS', icon: Target },
    { id: 'HABITS', label: 'HABITS', icon: CheckSquare },
    { id: 'TRACKING', label: 'TRACK', icon: Calendar },
    { id: 'REWARDS', label: 'REWARDS', icon: Sparkles },
    { id: 'ASCEND', label: 'ASCEND', icon: TrendingUp },
    { id: 'PROFILE', label: 'PROFILE', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#070b14]/95 backdrop-blur-lg border-t border-[#182234] px-1 py-1.5 select-none safe-area-pb">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all min-w-[48px]
                ${
                  isActive
                    ? 'text-[#ff334b]'
                    : 'text-slate-400 hover:text-slate-200'
                }
              `}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#ff334b] shadow-[0_0_6px_#ff334b]" />
                )}
              </div>
              <span className="text-[9px] font-bold font-['Chakra_Petch'] tracking-wider mt-1 uppercase">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
