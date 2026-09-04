import React, { useState } from 'react';
import {
  CheckCircle2,
  Plus,
  Flame,
  Award,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  CheckSquare,
  TrendingUp,
  AlertTriangle,
  Radio,
  Clock,
  ShieldCheck,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MissionModal } from '../modals/MissionModal';
import { HabitModal } from '../modals/HabitModal';
import { ConfirmModal } from '../modals/ConfirmModal';
import { formatReadableDate } from '../../utils/date';
import { getRankProgress, RANK_CONFIG, RANK_ORDER, getLevelProgress } from '../../config/progression';
import { Mission, Habit } from '../../types';
import { SpideyCoinIcon } from '../ui/SpideyCoinDisplay';
import { WebStreakVisualizer } from '../ui/WebStreakVisualizer';
import { SpiderIcon } from '../ui/SpiderIcon';

export const TodayView: React.FC = () => {
  const {
    profile,
    missions,
    habits,
    dailyRecords,
    todayDate,
    toggleMissionCompletion,
    toggleHabitCompletion,
    createMission,
    updateMission,
    deleteMission,
    createHabit,
    updateHabit,
    deleteHabit,
    setActiveTab,
  } = useApp();

  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [deletingMission, setDeletingMission] = useState<Mission | null>(null);

  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);

  const [activeWebConnectionId, setActiveWebConnectionId] = useState<string | null>(null);

  const todayRecord = dailyRecords[todayDate] || {
    date: todayDate,
    completedMissionIds: [],
    completedHabitIds: [],
    isPerfectDay: false,
    xpEarned: 0,
    essenceEarned: 0,
    totalRequiredMissions: 0,
    totalActiveHabits: 0,
    status: 'IN_PROGRESS',
  };

  const activeMissions = missions.filter((m) => m.isActive);
  const activeHabits = habits.filter((h) => h.isActive);

  const totalObjectives = activeMissions.length + activeHabits.length;
  const completedObjectives =
    todayRecord.completedMissionIds.filter((id) => activeMissions.some((m) => m.id === id)).length +
    todayRecord.completedHabitIds.filter((id) => activeHabits.some((h) => h.id === id)).length;

  const unresolvedCount = totalObjectives - completedObjectives;
  const progressPercent = totalObjectives > 0 ? Math.round((completedObjectives / totalObjectives) * 100) : 0;

  const rankProgress = getRankProgress(profile.totalSuccessfulDays ?? profile.consistencyDaysCompleted ?? 0);
  const rankOrder = RANK_ORDER;
  const currentRankIndex = rankOrder.indexOf(profile.rank);
  const { level, currentLevelXP, nextLevelXP, progressPercent: xpPercent } = getLevelProgress(profile.totalXP);

  // Time-aware greeting
  const currentHour = new Date().getHours();
  const timeGreeting =
    currentHour < 12 ? 'GOOD MORNING' : currentHour < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING';

  // Handle mission toggle with web connection animation
  const handleMissionClick = (missionId: string) => {
    const isCurrentlyDone = todayRecord.completedMissionIds.includes(missionId);
    if (!isCurrentlyDone) {
      setActiveWebConnectionId(missionId);
      setTimeout(() => setActiveWebConnectionId(null), 1200);
    }
    toggleMissionCompletion(missionId);
  };

  // Potential rewards still available today
  const potentialXP =
    activeMissions
      .filter((m) => !todayRecord.completedMissionIds.includes(m.id))
      .reduce((sum, m) => sum + m.xpReward, 0) +
    activeHabits
      .filter((h) => !todayRecord.completedHabitIds.includes(h.id))
      .reduce((sum, h) => sum + h.xpReward, 0);

  const potentialCoins =
    activeMissions
      .filter((m) => !todayRecord.completedMissionIds.includes(m.id))
      .reduce((sum, m) => sum + m.essenceReward, 0) +
    activeHabits
      .filter((h) => !todayRecord.completedHabitIds.includes(h.id))
      .reduce((sum, h) => sum + h.essenceReward, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 lg:pb-8 font-sans relative">
      {/* Dynamic Animated Web Filament Overlay when completing mission */}
      {activeWebConnectionId && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-red-600/5 backdrop-blur-[1px] animate-pulse" />
          <div className="relative flex flex-col items-center">
            <SpiderIcon size={54} color="#EF4444" glow={true} className="animate-bounce" />
            <span className="text-xs font-mono font-bold text-red-400 mt-2 px-3 py-1 rounded-full bg-[#0A0E17] border border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
              MISSION COMPLETE // WEB CONNECTION STABILIZED
            </span>
          </div>
        </div>
      )}

      {/* 1. COMMAND CENTER HEADER: SYSTEM ONLINE & TELEMETRY CLUSTER */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0D1322] via-[#0A0E17] to-[#140D18] border border-blue-900/30 backdrop-blur-md relative overflow-hidden shadow-2xl">
        {/* Subtle geometric web watermark in header */}
        <div className="absolute -right-8 -top-8 w-60 h-60 opacity-[0.06] pointer-events-none">
          <svg viewBox="0 0 100 100" className="stroke-white fill-none">
            <circle cx="50" cy="50" r="10" />
            <circle cx="50" cy="50" r="22" strokeDasharray="3 2" />
            <circle cx="50" cy="50" r="34" />
            <circle cx="50" cy="50" r="46" strokeDasharray="1 3" />
            <line x1="50" y1="4" x2="50" y2="96" />
            <line x1="4" y1="50" x2="96" y2="50" />
            <line x1="17" y1="17" x2="83" y2="83" />
            <line x1="83" y1="17" x2="17" y2="83" />
          </svg>
        </div>

        {/* Top telemetry bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_#60a5fa]" />
              <span className="text-blue-400 font-bold uppercase tracking-widest">SYSTEM ONLINE</span>
              <span className="text-slate-600">//</span>
              <span className="text-red-400 font-bold tracking-wider uppercase">WEB HUB COMMAND</span>
              <span className="text-slate-600">//</span>
              <span className="text-slate-400">{formatReadableDate(todayDate)}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-wide font-['Chakra_Petch'] uppercase mt-1">
              {timeGreeting}, <span className="text-red-500">{profile.username}</span>
            </h1>

            <p className="text-xs text-slate-400 font-mono flex flex-wrap items-center gap-2 pt-1">
              <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-900/40 text-blue-300 font-bold">
                LEVEL {level}
              </span>
              <span className="px-2 py-0.5 rounded bg-red-950/60 border border-red-900/40 text-red-300 font-bold">
                RANK {profile.rank} ({RANK_CONFIG[profile.rank].codename})
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">
                Next Rank in <strong className="text-red-400">{rankProgress.daysRemaining} days</strong>
              </span>
            </p>
          </div>

          {/* Quick HUD Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono">
            {/* Spidey Coins */}
            <div
              onClick={() => setActiveTab('REWARDS')}
              className="p-3 rounded-xl bg-[#0F141F] border border-amber-500/30 hover:border-amber-400/60 cursor-pointer transition-all shadow-[0_0_15px_rgba(245,158,11,0.08)]"
            >
              <div className="flex items-center gap-1.5 text-[10px] text-amber-300/80 uppercase font-semibold">
                <SpideyCoinIcon size={14} glow={false} />
                <span>SPIDEY COINS</span>
              </div>
              <div className="text-lg font-bold text-white font-['Chakra_Petch'] mt-0.5">
                {profile.currentEssence.toLocaleString()}
              </div>
            </div>

            {/* Web Streak */}
            <div
              onClick={() => setActiveTab('TRACKING')}
              className="p-3 rounded-xl bg-[#0F141F] border border-red-900/40 hover:border-red-500/50 cursor-pointer transition-all shadow-[0_0_15px_rgba(239,68,68,0.08)]"
            >
              <div className="flex items-center gap-1 text-[10px] text-red-400 uppercase font-semibold">
                <Flame className="w-3.5 h-3.5 fill-red-500/30" />
                <span>WEB STREAK</span>
              </div>
              <div className="text-lg font-bold text-white font-['Chakra_Petch'] mt-0.5">
                {profile.currentStreak} <span className="text-xs text-red-400 font-normal">DAYS</span>
              </div>
            </div>

            {/* Daily Objectives Output */}
            <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-[#0F141F] border border-blue-900/40">
              <div className="flex items-center gap-1 text-[10px] text-blue-400 uppercase font-semibold">
                <Radio className="w-3.5 h-3.5" />
                <span>OBJECTIVES</span>
              </div>
              <div className="text-lg font-bold text-white font-['Chakra_Petch'] mt-0.5">
                {completedObjectives} / {totalObjectives}{' '}
                <span className="text-xs text-blue-400 font-normal">({progressPercent}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Level XP Progress Bar inside Header */}
        <div className="mt-5 pt-4 border-t border-blue-900/20 grid grid-cols-1 md:grid-cols-2 gap-4 items-center text-xs font-mono">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400 uppercase">Evolution XP To Level {level + 1}</span>
              <span className="text-blue-300 font-bold">
                {currentLevelXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
              </span>
            </div>
            <div className="w-full h-2 bg-slate-900 border border-blue-900/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_10px_#38bdf8] transition-all duration-500 rounded-full"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

          {/* Potential Yield Callout */}
          <div className="flex items-center justify-between sm:justify-end gap-4 text-[11px] text-slate-400">
            <span>UNCLAIMED TODAY:</span>
            <span className="text-blue-400 font-bold">+{potentialXP} XP</span>
            <span className="text-slate-700">|</span>
            <span className="text-amber-300 font-bold flex items-center gap-1">
              +{potentialCoins} SPIDEY COINS
            </span>
          </div>
        </div>
      </div>

      {/* 2. SPIDER-SENSE NOTIFICATION BANNER */}
      {unresolvedCount > 0 ? (
        <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/40 via-[#0A0E17] to-amber-950/20 border border-red-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono shadow-[0_0_20px_rgba(239,68,68,0.12)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500 flex items-center justify-center text-red-400 shrink-0 animate-pulse">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-red-400 font-bold uppercase tracking-wider font-['Chakra_Petch'] block sm:inline mr-2">
                ⚠ SPIDER-SENSE DETECTED:
              </span>
              <span className="text-slate-300">
                {unresolvedCount} {unresolvedCount === 1 ? 'objective remains' : 'objectives remain'} unresolved. Complete them before the daily cycle ends to safeguard your Web Streak.
              </span>
            </div>
          </div>
          <span className="text-red-400 font-bold uppercase text-[10px] px-2.5 py-1 rounded bg-red-950/60 border border-red-800/50 self-start sm:self-auto shrink-0">
            STREAK AT RISK
          </span>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#0A0E17] to-blue-950/30 border border-emerald-500/40 flex items-center justify-between text-xs font-mono shadow-[0_0_20px_rgba(16,185,129,0.12)]">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-slate-200">
              <strong className="text-emerald-400 font-['Chakra_Petch'] uppercase tracking-wider">
                ✓ ALL DIRECTIVES SECURED:
              </strong>{' '}
              Web link fully stabilized for today. Daily consistency and ascension progress verified.
            </span>
          </div>
          <span className="text-emerald-400 font-bold uppercase text-[10px] px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-800/50 shrink-0">
            100% STABILIZED
          </span>
        </div>
      )}

      {/* 3. MAIN COMMAND GRID (12 Cols) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: MISSIONS & DAILY PROTOCOLS (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* MISSIONS SECTION */}
          <div>
            <div className="flex justify-between items-end border-b border-blue-900/20 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white tracking-wide font-['Chakra_Petch'] flex items-center gap-2">
                  <Target className="w-5 h-5 text-red-500" />
                  TODAY'S MISSIONS
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-950/50 text-blue-400 border border-blue-900/30">
                  {todayRecord.completedMissionIds.length}/{activeMissions.length}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMissionModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-['Chakra_Petch'] text-xs font-bold tracking-wider uppercase shadow-[0_0_12px_rgba(239,68,68,0.25)] transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" /> NEW MISSION
                </button>
                <button
                  onClick={() => setActiveTab('MISSIONS')}
                  className="text-xs font-mono text-blue-400 opacity-80 hover:opacity-100 hover:underline cursor-pointer"
                >
                  VIEW ALL &rarr;
                </button>
              </div>
            </div>

            {/* Missions List */}
            <div className="space-y-3">
              {activeMissions.length === 0 ? (
                <div className="bg-[#0A0E17] border border-blue-900/20 p-8 rounded-xl text-center space-y-3">
                  <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                    No active mission directives assigned for today.
                  </p>
                  <button
                    onClick={() => setIsMissionModalOpen(true)}
                    className="px-4 py-2 rounded-lg bg-red-600/20 border border-red-500/40 text-red-300 font-mono text-xs hover:bg-red-600/30 transition-all cursor-pointer"
                  >
                    + INITIALIZE MISSION DIRECTIVE
                  </button>
                </div>
              ) : (
                activeMissions.map((mission) => {
                  const isCompleted = todayRecord.completedMissionIds.includes(mission.id);
                  return (
                    <div
                      key={mission.id}
                      onClick={() => handleMissionClick(mission.id)}
                      className={`
                        p-4 rounded-xl flex items-center justify-between group transition-all duration-200 cursor-pointer select-none border relative overflow-hidden
                        ${
                          isCompleted
                            ? 'bg-slate-900/25 border-blue-900/20 hover:border-blue-500/40 opacity-75'
                            : 'bg-[#0F141F] border-blue-900/40 shadow-[0_0_15px_rgba(37,99,235,0.06)] hover:border-blue-500/60'
                        }
                      `}
                    >
                      {/* Web Thread Flash on completion */}
                      {activeWebConnectionId === mission.id && (
                        <div className="absolute inset-0 bg-red-500/20 animate-pulse pointer-events-none" />
                      )}

                      <div className="flex items-center gap-4 min-w-0">
                        {/* Checkbox */}
                        <div
                          className={`
                            w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all
                            ${
                              isCompleted
                                ? 'border border-blue-500 bg-blue-500/20'
                                : 'border border-slate-600 group-hover:border-blue-400'
                            }
                          `}
                        >
                          {isCompleted && (
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm shadow-[0_0_8px_#3b82f6]" />
                          )}
                        </div>

                        {/* Mission Content */}
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-semibold transition-all truncate ${
                              isCompleted ? 'text-slate-400 line-through opacity-70' : 'text-white'
                            }`}
                          >
                            {mission.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 font-mono">
                            <span className="text-[10px] bg-blue-900/30 text-blue-300 border border-blue-900/40 px-1.5 py-0.5 rounded uppercase font-bold">
                              +{mission.xpReward} XP
                            </span>
                            <span className="text-[10px] bg-amber-950/40 text-amber-300 border border-amber-900/40 px-1.5 py-0.5 rounded uppercase font-bold flex items-center gap-1">
                              +{mission.essenceReward} COINS
                            </span>
                            {mission.priority === 'HIGH' && (
                              <span className="text-[9px] bg-red-950/60 text-red-400 border border-red-800/40 px-1.5 py-0.5 rounded uppercase font-bold">
                                HIGH PRIORITY
                              </span>
                            )}
                            {mission.isRequired && (
                              <span className="text-[9px] bg-amber-950/50 text-amber-400 border border-amber-800/40 px-1.5 py-0.5 rounded uppercase font-bold">
                                REQUIRED CORE
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                        {isCompleted ? (
                          <span className="text-emerald-400 font-bold tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> COMPLETE
                          </span>
                        ) : (
                          <span className="text-blue-400 font-bold tracking-wider group-hover:text-blue-300">
                            UNRESOLVED
                          </span>
                        )}

                        <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingMission(mission);
                              setIsMissionModalOpen(true);
                            }}
                            className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit Directive"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingMission(mission);
                            }}
                            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Decommission Mission"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* DAILY PROTOCOLS (HABITS) SECTION */}
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-blue-900/20 pb-2">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white tracking-wider uppercase font-['Chakra_Petch']">
                  DAILY PROTOCOLS
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-950/50 text-blue-400 border border-blue-900/30">
                  {todayRecord.completedHabitIds.length}/{activeHabits.length}
                </span>
              </div>
              <button
                onClick={() => setIsHabitModalOpen(true)}
                className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> ADD PROTOCOL
              </button>
            </div>

            {activeHabits.length === 0 ? (
              <div className="bg-[#0A0E17] border border-blue-900/20 p-5 rounded-xl text-center">
                <span className="text-xs text-slate-500 font-mono">
                  No daily protocols active. Anchor your daily habits to stabilize your web.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeHabits.map((habit) => {
                  const isCompleted = todayRecord.completedHabitIds.includes(habit.id);
                  return (
                    <div
                      key={habit.id}
                      onClick={() => toggleHabitCompletion(habit.id)}
                      className={`
                        p-3.5 rounded-xl flex justify-between items-center cursor-pointer transition-all select-none border
                        ${
                          isCompleted
                            ? 'bg-slate-900/20 border-slate-800 opacity-65'
                            : 'bg-[#0F141F] border-blue-900/30 hover:border-blue-500/50 shadow-sm'
                        }
                      `}
                    >
                      <div className="min-w-0 mr-2">
                        <span
                          className={`text-xs block truncate ${
                            isCompleted ? 'text-slate-400 line-through' : 'text-white font-semibold'
                          }`}
                        >
                          {habit.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Flame className="w-3 h-3 text-red-500 fill-red-500/30" />
                          <span>{habit.currentStreak} day streak</span>
                        </span>
                      </div>

                      <div className="shrink-0 flex items-center gap-2 font-mono">
                        <span className="text-[10px] text-blue-400">+{habit.xpReward} XP</span>
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                            isCompleted
                              ? 'bg-blue-500/20 border border-blue-500 text-blue-400'
                              : 'border border-slate-700 text-transparent'
                          }`}
                        >
                          {isCompleted ? '✓' : ''}
                        </div>
                        <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-slate-800">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingHabit(habit);
                              setIsHabitModalOpen(true);
                            }}
                            className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit Protocol"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingHabit(habit);
                            }}
                            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Delete Protocol"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: WEB STREAK NETWORK & ASCENSION PATH (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* 1. WEB STREAK NETWORK VISUALIZER */}
          <WebStreakVisualizer
            streak={profile.currentStreak}
            longestStreak={profile.longestStreak}
            showDetails={true}
          />

          {/* 2. ASCENSION PROGRESSION CARD */}
          <div className="bg-[#0A0E17] border border-blue-900/30 p-6 rounded-2xl flex-1 flex flex-col justify-between shadow-lg relative overflow-hidden">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Chakra_Petch'] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-red-500" />
                  ASCENSION HIERARCHY
                </h3>
                <button
                  onClick={() => setActiveTab('ASCEND')}
                  className="text-[11px] text-red-500 hover:text-red-400 font-bold font-mono flex items-center gap-1 cursor-pointer"
                >
                  {profile.rank} &rarr; {rankProgress.nextRank || 'APEX'} <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Stepped Timeline */}
              <div className="relative flex flex-col justify-between pl-8 border-l border-slate-800 ml-2 space-y-4 font-mono">
                <div className="absolute left-[-5px] top-0 w-[9px] h-[9px] rounded-full bg-slate-700" />
                <div className="absolute left-[-5px] bottom-0 w-[9px] h-[9px] rounded-full bg-red-600 shadow-[0_0_10px_red]" />

                {/* SSS down to E */}
                {[...rankOrder].reverse().map((r) => {
                  const rIndex = rankOrder.indexOf(r);
                  const isCurrent = r === profile.rank;
                  const isPassed = rIndex < currentRankIndex;

                  if (isCurrent) {
                    return (
                      <div key={r} className="text-sm text-red-500 font-bold flex items-center gap-2">
                        RANK {r} <span className="text-[10px] font-normal text-red-400 opacity-80">(ACTIVE TIER)</span>
                      </div>
                    );
                  }

                  if (isPassed) {
                    return (
                      <div key={r} className="text-xs text-slate-400 opacity-70 flex items-center gap-2">
                        RANK {r} <span className="text-blue-400">✓ SECURED</span>
                      </div>
                    );
                  }

                  return (
                    <div key={r} className="text-xs text-slate-600 opacity-40">
                      RANK {r}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Consistency Meter */}
            <div className="mt-6 pt-4 border-t border-blue-900/20 font-mono">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] text-slate-400 uppercase tracking-tight">Tier Consistency Meter</span>
                <span className="text-xs text-white font-bold">
                  {rankProgress.daysInCurrentRank} / {rankProgress.daysNeededForNextRank} DAYS
                </span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-600 shadow-[0_0_8px_#ef4444] transition-all duration-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((rankProgress.daysInCurrentRank / rankProgress.daysNeededForNextRank) * 100)
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between items-center mt-2 text-[10px] text-slate-500">
                <span>
                  {rankProgress.daysRemaining} days to Rank {rankProgress.nextRank || 'APEX'}
                </span>
                <button
                  onClick={() => setActiveTab('ASCEND')}
                  className="text-blue-400 hover:underline cursor-pointer"
                >
                  View Ladder &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modals */}
      <MissionModal
        isOpen={isMissionModalOpen}
        onClose={() => {
          setIsMissionModalOpen(false);
          setEditingMission(null);
        }}
        onSave={(data) => {
          if (editingMission) {
            updateMission(editingMission.id, data);
          } else {
            createMission(data);
          }
        }}
        onDelete={(id) => {
          const m = missions.find((item) => item.id === id);
          if (m) setDeletingMission(m);
          else deleteMission(id);
        }}
        initialMission={editingMission}
      />

      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={() => {
          setIsHabitModalOpen(false);
          setEditingHabit(null);
        }}
        onSave={(data) => {
          if (editingHabit) {
            updateHabit(editingHabit.id, data);
          } else {
            createHabit(data);
          }
        }}
        onDelete={(id) => {
          const h = habits.find((item) => item.id === id);
          if (h) setDeletingHabit(h);
          else deleteHabit(id);
        }}
        initialHabit={editingHabit}
      />

      {/* Confirmation Modal for Mission Deletion */}
      <ConfirmModal
        isOpen={!!deletingMission}
        onClose={() => setDeletingMission(null)}
        onConfirm={() => {
          if (deletingMission) {
            deleteMission(deletingMission.id);
            setDeletingMission(null);
          }
        }}
        title="DECOMMISSION MISSION"
        subtitle="SECURITY PROTOCOL OVERRIDE"
        itemName={deletingMission?.title}
        message="Are you sure you want to decommission this mission directive? It will be safely removed from your roster immediately."
        confirmText="DECOMMISSION"
        cancelText="ABORT"
        isDestructive={true}
        icon="trash"
      />

      {/* Confirmation Modal for Habit Deletion */}
      <ConfirmModal
        isOpen={!!deletingHabit}
        onClose={() => setDeletingHabit(null)}
        onConfirm={() => {
          if (deletingHabit) {
            deleteHabit(deletingHabit.id);
            setDeletingHabit(null);
          }
        }}
        title="DELETE HABIT PROTOCOL"
        subtitle="SECURITY PROTOCOL OVERRIDE"
        itemName={deletingHabit?.name}
        message="Are you sure you want to delete this habit directive? It will be removed from your active daily protocols immediately."
        confirmText="DELETE PROTOCOL"
        cancelText="ABORT"
        isDestructive={true}
        icon="trash"
      />
    </div>
  );
};


