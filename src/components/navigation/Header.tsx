import React, { useState } from 'react';
import {
  Bell,
  Flame,
  Volume2,
  VolumeX,
  X,
  CheckCircle2,
  AlertCircle,
  Menu,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EssenceDisplay } from '../ui/EssenceDisplay';
import { RankBadge } from '../ui/RankBadge';
import { WebAscendLogo } from '../ui/WebAscendLogo';
import { getLevelProgress } from '../../config/progression';
import { formatTimeHUD } from '../../utils/date';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const {
    profile,
    notifications,
    markNotificationRead,
    clearNotifications,
    toggleSound,
    setActiveTab,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const { level, currentLevelXP, nextLevelXP, progressPercent } = getLevelProgress(profile.totalXP);

  return (
    <header className="sticky top-0 z-40 w-full min-h-[5rem] border-b border-blue-900/20 px-4 sm:px-8 py-3 flex items-center justify-between bg-[#05070A]/80 backdrop-blur-md select-none">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto gap-4">
        {/* Left: Mobile Logo or Desktop Sleek Telemetry Columns */}
        <div className="flex items-center gap-4 sm:gap-8">
          <div className="lg:hidden">
            <WebAscendLogo size="sm" showText={true} />
          </div>

          <div className="hidden sm:flex items-center gap-6 lg:gap-8 font-mono">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">System Status</p>
              <p className="text-xs text-blue-400 font-mono font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                ONLINE // AGENT_VER_2.4
              </p>
            </div>

            <div
              onClick={() => setActiveTab('ASCEND')}
              className="cursor-pointer group"
            >
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Current Rank</p>
              <p className="text-sm text-red-500 font-bold group-hover:text-red-400 transition-colors">
                RANK {profile.rank}
              </p>
            </div>

            <div
              onClick={() => setActiveTab('REWARDS')}
              className="cursor-pointer group"
            >
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Essence Balance</p>
              <p className="text-sm text-white font-mono font-medium flex items-center gap-1 group-hover:text-blue-300 transition-colors">
                <span className="text-blue-400">◈</span> {profile.currentEssence.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Level Progress & Controls */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Streak pill */}
          <div
            onClick={() => setActiveTab('TODAY')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-950/30 border border-blue-900/30 text-xs font-mono cursor-pointer hover:border-red-500/50 transition-colors"
            title="Daily Consistency Streak"
          >
            <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500/20" />
            <span className="font-bold text-white">{profile.currentStreak}</span>
            <span className="hidden sm:inline text-[10px] text-slate-400 uppercase">STREAK</span>
          </div>

          {/* Level Progress Gauge */}
          <div className="text-right hidden md:block">
            <p className="text-xs text-slate-400 font-medium">Level {level}</p>
            <div className="w-40 lg:w-48 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">
              {currentLevelXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
            </p>
          </div>

          {/* Audio Button */}
          <button
            onClick={toggleSound}
            className="hidden sm:flex p-2 rounded-lg bg-slate-900/50 border border-blue-900/20 text-slate-400 hover:text-white hover:border-blue-500/40 transition-colors"
            title={profile.soundEnabled ? 'Mute Sound' : 'Unmute Sound'}
            aria-label="Toggle sound"
          >
            {profile.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-blue-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-slate-900/50 border border-blue-900/20 text-slate-400 hover:text-white hover:border-blue-500/40 transition-colors"
              aria-label="Open notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#0A0E17] border border-blue-900/30 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-blue-900/20">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase font-['Chakra_Petch'] tracking-wider">
                      SYSTEM LOGS
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-900/30 text-red-300 border border-red-900/40">
                        {unreadCount} NEW
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-[11px] text-slate-400 hover:text-slate-200 underline font-mono"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-white"
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1 font-mono">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500 font-mono">
                      NO ACTIVE LOGS. ALL PROTOCOLS CLEAR.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`
                          p-2.5 rounded-lg border text-xs cursor-pointer transition-all
                          ${
                            !n.read
                              ? 'bg-blue-950/20 border-blue-500/40 text-slate-200'
                              : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
                          }
                        `}
                      >
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <span className="font-bold text-white uppercase tracking-wider font-['Chakra_Petch']">
                            {n.title}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {formatTimeHUD(n.timestamp)}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-300">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

