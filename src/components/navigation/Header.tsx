import React, { useState } from 'react';
import {
  Bell,
  Flame,
  Volume2,
  VolumeX,
  X,
  Database,
  User,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WebAscendLogo } from '../ui/WebAscendLogo';
import { getLevelProgress } from '../../config/progression';
import { formatTimeHUD } from '../../utils/date';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const {
    user,
    syncStatus,
    isSupabaseReady,
    profile,
    notifications,
    markNotificationRead,
    clearNotifications,
    toggleSound,
    setActiveTab,
    setAuthModalOpen,
    setAccountModalOpen,
    setSupabaseConfigModalOpen,
    hasSecretKeyError,
    isMissingTablesError,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const { level, currentLevelXP, nextLevelXP, progressPercent } = getLevelProgress(profile.totalXP);

  return (
    <header className="sticky top-0 z-40 w-full min-h-[5rem] border-b border-blue-900/20 px-4 sm:px-8 py-3 flex items-center justify-between bg-[#05070A]/85 backdrop-blur-md select-none">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto gap-4">
        {/* Left: Mobile Logo or Desktop Sleek Telemetry Columns */}
        <div className="flex items-center gap-4 sm:gap-8">
          <div className="lg:hidden">
            <WebAscendLogo size="sm" showText={true} />
          </div>

          <div className="hidden sm:flex items-center gap-6 lg:gap-8 font-mono">
            {/* Database / Cloud Status Pill */}
            <div
              onClick={() => {
                if (hasSecretKeyError || isMissingTablesError) {
                  setSupabaseConfigModalOpen(true);
                } else if (!user) {
                  setAuthModalOpen(true);
                } else {
                  setAccountModalOpen(true);
                }
              }}
              className="cursor-pointer group"
              title={
                hasSecretKeyError
                  ? 'Click to fix secret key error'
                  : isMissingTablesError
                  ? 'Click to run SQL schema in Supabase'
                  : user
                  ? 'PostgreSQL Synced: Click to view operative account'
                  : isSupabaseReady
                  ? 'PostgreSQL Connected: Click to sign in with Cloud Auth'
                  : 'Local Demo Mode: Click to connect Supabase'
              }
            >
              <p className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Database className="w-3 h-3 text-slate-400 group-hover:text-blue-400 transition-colors" />
                <span>DB Source</span>
              </p>
              <p className="text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    hasSecretKeyError
                      ? 'bg-red-500 animate-pulse'
                      : isMissingTablesError
                      ? 'bg-amber-400 animate-pulse'
                      : syncStatus === 'SYNCED'
                      ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                      : syncStatus === 'SYNCING'
                      ? 'bg-amber-400 animate-ping'
                      : syncStatus === 'OFFLINE'
                      ? 'bg-red-500'
                      : isSupabaseReady
                      ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                      : 'bg-blue-400'
                  }`}
                />
                <span
                  className={
                    hasSecretKeyError
                      ? 'text-red-400 font-bold'
                      : isMissingTablesError
                      ? 'text-amber-400 font-bold'
                      : syncStatus === 'SYNCED'
                      ? 'text-emerald-400 group-hover:text-emerald-300'
                      : syncStatus === 'SYNCING'
                      ? 'text-amber-400'
                      : syncStatus === 'OFFLINE'
                      ? 'text-red-400'
                      : isSupabaseReady
                      ? 'text-emerald-400 group-hover:text-emerald-300'
                      : 'text-blue-400 group-hover:text-blue-300'
                  }
                >
                  {hasSecretKeyError
                    ? 'KEY CONFLICT'
                    : isMissingTablesError
                    ? 'TABLES MISSING'
                    : syncStatus === 'SYNCED'
                    ? 'POSTGRES SYNCED'
                    : syncStatus === 'SYNCING'
                    ? 'SYNCING...'
                    : syncStatus === 'OFFLINE'
                    ? 'OFFLINE'
                    : isSupabaseReady
                    ? 'POSTGRES READY (GUEST)'
                    : 'LOCAL DEMO'}
                </span>
              </p>
            </div>

            <div
              onClick={() => setActiveTab('ASCEND')}
              className="cursor-pointer group"
            >
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Current Rank</p>
              <p className="text-sm text-red-500 font-bold group-hover:text-red-400 transition-colors font-['Chakra_Petch']">
                RANK {profile.rank}
              </p>
            </div>

            <div
              onClick={() => setActiveTab('REWARDS')}
              className="cursor-pointer group"
            >
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Spidey Coins</p>
              <p className="text-sm text-amber-300 font-mono font-bold flex items-center gap-1.5 group-hover:text-amber-200 transition-colors">
                <span className="text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]">🕷</span>
                <span>{profile.currentEssence.toLocaleString()}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right: Level Progress, Auth & Controls */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Web Streak pill */}
          <div
            onClick={() => setActiveTab('TODAY')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-950/40 to-[#0A0E17] border border-red-900/40 text-xs font-mono cursor-pointer hover:border-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.1)] transition-all"
            title="Web Streak - Days Connected"
          >
            <Flame className="w-4 h-4 text-red-500 fill-red-500/30 animate-pulse" />
            <span className="font-bold text-white font-['Chakra_Petch']">{profile.currentStreak}</span>
            <span className="hidden sm:inline text-[10px] text-red-400/90 font-bold uppercase tracking-wider">WEB STREAK</span>
          </div>

          {/* Level Progress Gauge */}
          <div className="text-right hidden md:block font-mono">
            <p className="text-xs text-slate-300 font-bold font-['Chakra_Petch'] tracking-wide">
              LEVEL {level}
            </p>
            <div className="w-36 lg:w-44 h-2 bg-slate-900 border border-blue-900/30 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6] transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase">
              {currentLevelXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
            </p>
          </div>

          {/* Auth Button: Sign In or User Account */}
          {user ? (
            <button
              onClick={() => setAccountModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/40 border border-blue-500/40 text-blue-300 hover:text-white hover:border-blue-400 hover:bg-blue-900/50 transition-all font-mono text-xs shadow-[0_0_10px_rgba(2,132,199,0.15)]"
              title="Operative Cloud Profile & Settings"
            >
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline font-bold tracking-wider uppercase font-['Chakra_Petch'] max-w-[100px] truncate">
                {profile.username || 'OPERATIVE'}
              </span>
            </button>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600/80 to-blue-600/80 hover:from-red-500 hover:to-blue-500 text-white font-bold text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(230,43,58,0.25)] cursor-pointer"
              title="Sign In / Register with Supabase"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>CLOUD AUTH</span>
            </button>
          )}

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
                    <span className="text-xs font-bold text-white uppercase font-['Chakra_Petch'] tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      SYSTEM ALERTS
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-900/40 text-red-300 border border-red-900/50 font-bold">
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
