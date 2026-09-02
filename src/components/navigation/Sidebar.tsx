import React from 'react';
import {
  Compass,
  Target,
  CheckSquare,
  Calendar,
  Sparkles,
  TrendingUp,
  User,
  Shield,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';
import { WebAscendLogo } from '../ui/WebAscendLogo';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, profile, toggleSound } = useApp();

  const navItems: {
    id: ActiveTab;
    label: string;
    glyph: string;
    icon: React.FC<{ className?: string }>;
    badge?: string;
  }[] = [
    { id: 'TODAY', label: 'TODAY', glyph: '◎', icon: Compass },
    { id: 'MISSIONS', label: 'MISSIONS', glyph: '🎯', icon: Target },
    { id: 'HABITS', label: 'HABITS', glyph: '✓', icon: CheckSquare },
    { id: 'TRACKING', label: 'TRACKING', glyph: '◷', icon: Calendar },
    { id: 'REWARDS', label: 'REWARDS', glyph: '◈', icon: Sparkles },
    { id: 'ASCEND', label: 'ASCEND', glyph: '↗', icon: TrendingUp, badge: `RANK ${profile.rank}` },
    { id: 'PROFILE', label: 'PROFILE', glyph: '👤', icon: User },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#0A0E17] border-r border-blue-900/20 min-h-screen justify-between sticky top-0 h-screen select-none z-30">
      {/* Top Header & Logo */}
      <div>
        <div className="p-8 pb-6 flex items-center">
          <WebAscendLogo size="md" showText={true} />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-1 font-['Chakra_Petch']">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id.toLowerCase()}`}
                onClick={() => setActiveTab(item.id)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-all duration-200 cursor-pointer
                  ${
                    isActive
                      ? 'bg-blue-600/10 border-l-2 border-red-500 text-white rounded-r-md shadow-[0_0_15px_rgba(37,99,235,0.08)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-md'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${isActive ? 'text-red-400 opacity-100' : 'opacity-70'}`}>
                    {item.glyph}
                  </span>
                  <span className="tracking-widest">{item.label}</span>
                </div>

                {item.badge && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-900/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User ID Block & Audio Toggle */}
      <div className="p-6 mt-auto border-t border-blue-900/10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-red-500 shrink-0 shadow-inner">
              {profile.rank}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-mono tracking-wider uppercase">USER ID</p>
              <p className="text-sm text-white font-medium truncate tracking-wide">{profile.username}</p>
            </div>
          </div>

          <button
            onClick={toggleSound}
            className="p-2 rounded-lg hover:bg-slate-800/60 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700"
            title={profile.soundEnabled ? 'Mute HUD Audio' : 'Unmute HUD Audio'}
            aria-label="Toggle Sound"
          >
            {profile.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-blue-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-600 pt-1">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-blue-400" />
            SECURE PROTOCOL
          </span>
          <span>LVL {profile.level}</span>
        </div>
      </div>
    </aside>
  );
};

