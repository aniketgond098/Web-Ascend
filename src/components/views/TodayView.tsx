import React, { useState } from 'react';
import {
  CheckCircle2,
  Plus,
  Flame,
  Award,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MissionModal } from '../modals/MissionModal';
import { HabitModal } from '../modals/HabitModal';
import { formatReadableDate } from '../../utils/date';
import { getRankProgress, RANK_CONFIG, RANK_ORDER } from '../../config/progression';
import { Mission, Habit, RankTier } from '../../types';

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
    createHabit,
    setActiveTab,
  } = useApp();

  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);

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

  const rankProgress = getRankProgress(profile.consistencyDaysCompleted);
  const rankOrder = RANK_ORDER;
  const currentRankIndex = rankOrder.indexOf(profile.rank);

  // 7-day mini activity pulse calculation
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const rec = dailyRecords[dateStr];
    const isToday = dateStr === todayDate;
    const isDone = rec ? (rec.isPerfectDay || rec.completedMissionIds.length > 0) : false;
    const isPartial = rec && rec.completedMissionIds.length > 0 && !rec.isPerfectDay;
    return { dateStr, isToday, isDone, isPartial };
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 lg:pb-8 font-sans">
      {/* 1. MAIN SLEEK 12-COLUMN SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: MISSIONS & HABITS (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Header */}
          <div className="flex justify-between items-end border-b border-blue-900/20 pb-3">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white tracking-wide font-['Chakra_Petch']">
                TODAY'S MISSIONS
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-950/50 text-blue-400 border border-blue-900/30">
                {todayRecord.completedMissionIds.length}/{activeMissions.length}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMissionModalOpen(true)}
                className="text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> ADD
              </button>
              <button
                onClick={() => setActiveTab('MISSIONS')}
                className="text-xs font-mono text-blue-400 opacity-70 hover:opacity-100 underline cursor-pointer"
              >
                VIEW ALL
              </button>
            </div>
          </div>

          {/* Missions List */}
          <div className="space-y-3">
            {activeMissions.length === 0 ? (
              <div className="bg-slate-900/40 border border-blue-900/20 p-8 rounded-lg text-center space-y-3">
                <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                  No active directives scheduled for today.
                </p>
                <button
                  onClick={() => setIsMissionModalOpen(true)}
                  className="px-4 py-2 rounded-md bg-blue-600/20 border border-blue-500/40 text-blue-300 font-mono text-xs hover:bg-blue-600/30 transition-all"
                >
                  + INITIALIZE MISSION
                </button>
              </div>
            ) : (
              activeMissions.map((mission) => {
                const isCompleted = todayRecord.completedMissionIds.includes(mission.id);
                return (
                  <div
                    key={mission.id}
                    onClick={() => toggleMissionCompletion(mission.id)}
                    className={`
                      p-4 rounded-lg flex items-center justify-between group transition-all duration-200 cursor-pointer select-none
                      ${
                        isCompleted
                          ? 'bg-slate-900/40 border border-blue-900/20 hover:border-blue-500/50'
                          : 'bg-[#0F141F] border-2 border-blue-600/30 shadow-[0_0_15px_rgba(37,99,235,0.1)] hover:border-blue-500/60'
                      }
                    `}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Checkbox */}
                      <div
                        className={`
                          w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all
                          ${
                            isCompleted
                              ? 'border border-blue-500 bg-blue-500/10'
                              : 'border border-slate-600 group-hover:border-blue-400'
                          }
                        `}
                      >
                        {isCompleted && (
                          <div className="w-2 h-2 bg-blue-500 rounded-sm opacity-100 shadow-[0_0_6px_#3b82f6]" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-medium transition-all truncate ${
                            isCompleted ? 'text-slate-400 line-through opacity-60' : 'text-white'
                          }`}
                        >
                          {mission.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[9px] bg-blue-900/30 text-blue-300 border border-blue-900/40 px-1.5 py-0.5 rounded uppercase tracking-widest font-mono">
                            +{mission.xpReward} XP
                          </span>
                          <span className="text-[9px] bg-red-900/30 text-red-300 border border-red-900/40 px-1.5 py-0.5 rounded uppercase tracking-widest font-mono">
                            +{mission.essenceReward} ESSENCE
                          </span>
                          {mission.isRequired && (
                            <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase font-mono">
                              REQ
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
                      {isCompleted ? (
                        <span className="text-slate-500">COMPLETE</span>
                      ) : (
                        <span className="text-blue-400 font-bold tracking-wider">ACTIVE</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* DAILY HABITS SECTION */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-slate-500 tracking-widest uppercase font-mono">
                DAILY HABITS
              </h3>
              <button
                onClick={() => setIsHabitModalOpen(true)}
                className="text-[11px] font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> ADD HABIT
              </button>
            </div>

            {activeHabits.length === 0 ? (
              <div className="bg-slate-900/20 border border-slate-800 p-4 rounded-md text-center">
                <span className="text-xs text-slate-500 font-mono">No daily habits active.</span>
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
                        p-3 rounded-md flex justify-between items-center cursor-pointer transition-all select-none
                        ${
                          isCompleted
                            ? 'bg-slate-900/20 border border-slate-800 opacity-60'
                            : 'bg-[#0F141F] border border-blue-900/40 hover:border-blue-500/50'
                        }
                      `}
                    >
                      <span
                        className={`text-xs truncate mr-2 ${
                          isCompleted ? 'text-slate-400 line-through' : 'text-white font-medium'
                        }`}
                      >
                        {habit.name}
                      </span>
                      <span className="text-[10px] font-mono font-bold shrink-0">
                        {isCompleted ? (
                          <span className="text-blue-400">✓</span>
                        ) : (
                          <span className="text-slate-500">○</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Perfect Day Banner */}
          {todayRecord.isPerfectDay && (
            <div className="p-4 rounded-lg bg-red-950/20 border border-red-900/40 flex items-center justify-between text-xs font-mono text-slate-300">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-red-500 animate-pulse shrink-0" />
                <span>
                  <strong className="text-white">PERFECT DAY PROTOCOL ACHIEVED:</strong> +100 XP & +100 Essence secured today!
                </span>
              </div>
              <span className="text-red-400 font-bold">100%</span>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ACTIVITY PULSE & ASCENSION PATH (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* 1. Activity Pulse Card */}
          <div className="bg-gradient-to-br from-blue-900/20 to-transparent border border-blue-900/30 p-6 rounded-2xl relative overflow-hidden">
            {/* Geometric Spider Web Vector Graphic */}
            <div className="absolute -right-4 -top-4 w-32 h-32 opacity-10 pointer-events-none">
              <svg viewBox="0 0 100 100" className="stroke-white fill-none">
                <circle cx="50" cy="50" r="10" />
                <circle cx="50" cy="50" r="20" strokeDasharray="4 2" />
                <circle cx="50" cy="50" r="30" />
                <circle cx="50" cy="50" r="40" strokeDasharray="1 4" />
                <line x1="50" y1="10" x2="50" y2="90" />
                <line x1="10" y1="50" x2="90" y2="50" />
                <line x1="21.7" y1="21.7" x2="78.3" y2="78.3" />
                <line x1="21.7" y1="78.3" x2="78.3" y2="21.7" />
              </svg>
            </div>

            <p className="text-xs text-blue-300 font-mono tracking-tighter uppercase">Activity Pulse</p>
            <p className="text-4xl font-bold text-white mt-1 font-['Chakra_Petch']">
              {profile.currentStreak}
            </p>
            <p className="text-[10px] text-blue-400 uppercase tracking-widest font-mono">Day Streak</p>

            {/* 7-Day Histogram Grid */}
            <div className="mt-6 grid grid-cols-7 gap-1.5 items-end">
              {last7Days.map((d, i) => (
                <div key={d.dateStr} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-full h-8 rounded-sm transition-all ${
                      d.isDone
                        ? 'bg-blue-500/80 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                        : d.isPartial
                        ? 'bg-blue-500/40'
                        : d.isToday
                        ? 'border border-blue-500/50 bg-blue-950/30'
                        : 'border border-blue-900/30 border-dashed bg-slate-900/30'
                    }`}
                  />
                  <span className="text-[9px] font-mono text-slate-500">
                    {i === 6 ? 'TODAY' : ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Ascension Path Card */}
          <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Chakra_Petch']">
                  ASCENSION PATH
                </h3>
                <span className="text-[10px] text-red-500 font-bold font-mono">
                  {profile.rank} &rarr; {rankProgress.nextRank || 'MAX'}
                </span>
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
                  const isLocked = rIndex > currentRankIndex;

                  if (isCurrent) {
                    return (
                      <div
                        key={r}
                        className="text-sm text-red-500 font-bold flex items-center gap-2"
                      >
                        RANK {r} <span className="text-[10px] font-normal text-red-400 opacity-80">(CURRENT)</span>
                      </div>
                    );
                  }

                  if (isPassed) {
                    return (
                      <div
                        key={r}
                        className="text-xs text-slate-400 opacity-60 flex items-center gap-2"
                      >
                        RANK {r} <span className="text-blue-500">✓</span>
                      </div>
                    );
                  }

                  return (
                    <div key={r} className="text-xs text-slate-500 opacity-30">
                      RANK {r}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Consistency Meter */}
            <div className="mt-6 pt-4 border-t border-slate-800 font-mono">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-tight">Consistency Meter</span>
                <span className="text-[10px] text-white">
                  {rankProgress.daysInCurrentRank} / {rankProgress.daysNeededForNextRank} DAYS
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((rankProgress.daysInCurrentRank / rankProgress.daysNeededForNextRank) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modals */}
      <MissionModal
        isOpen={isMissionModalOpen}
        onClose={() => setIsMissionModalOpen(false)}
        onSave={createMission}
      />
      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={() => setIsHabitModalOpen(false)}
        onSave={createHabit}
      />
    </div>
  );
};

