import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Award,
  Zap,
  Flame,
  ShieldCheck,
  CircleDot,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HudCard } from '../ui/HudCard';
import { ProgressBar } from '../ui/ProgressBar';
import { formatDateString, formatReadableDate, parseDateString } from '../../utils/date';
import { DailyRecord } from '../../types';

export const TrackingView: React.FC = () => {
  const { dailyRecords, todayDate, missions, habits, profile } = useApp();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayDate);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const jumpToToday = () => {
    setCurrentDate(new Date());
    setSelectedDateStr(todayDate);
  };

  // Build calendar matrix
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays: Array<{ dateStr: string; dayNumber: number; isCurrentMonth: boolean; record?: DailyRecord }> = [];

  // Previous month padding
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthDays - i);
    const dateStr = formatDateString(d);
    calendarDays.push({
      dateStr,
      dayNumber: prevMonthDays - i,
      isCurrentMonth: false,
      record: dailyRecords[dateStr],
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dObj = new Date(year, month, d);
    const dateStr = formatDateString(dObj);
    calendarDays.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      record: dailyRecords[dateStr],
    });
  }

  // Next month padding to fill grid
  const remainingSlots = 42 - calendarDays.length;
  for (let d = 1; d <= remainingSlots; d++) {
    const dObj = new Date(year, month + 1, d);
    const dateStr = formatDateString(dObj);
    calendarDays.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: false,
      record: dailyRecords[dateStr],
    });
  }

  const selectedRecord = dailyRecords[selectedDateStr];
  const isSelectedToday = selectedDateStr === todayDate;

  // Monthly stats
  const allRecords = Object.values(dailyRecords) as DailyRecord[];
  const currentMonthRecords = allRecords.filter((r) => {
    const d = parseDateString(r.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const perfectDaysThisMonth = currentMonthRecords.filter((r) => r.isPerfectDay).length;
  const totalDaysTracked = Object.keys(dailyRecords).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 lg:pb-8 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#38bdf8] font-bold tracking-widest uppercase">
            <Clock className="w-4 h-4" />
            <span>HISTORICAL ARCHIVES // CHRONO LOGS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase font-['Chakra_Petch'] tracking-wide">
            CONSISTENCY TRACKING
          </h1>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={jumpToToday}
            className="px-3 py-1.5 rounded-lg bg-[#0e1628] border border-slate-700 hover:border-[#38bdf8] text-xs font-bold text-white transition-colors"
          >
            TODAY
          </button>
          <div className="flex items-center gap-1 bg-[#090d18] p-1 rounded-xl border border-slate-800">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-white font-['Chakra_Petch'] uppercase tracking-wider min-w-[120px] text-center">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <HudCard className="p-4">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">
            PERFECT DAYS (MONTH)
          </span>
          <div className="text-2xl font-bold font-['Chakra_Petch'] text-[#22c55e] flex items-center gap-2">
            <Award className="w-5 h-5" />
            <span>{perfectDaysThisMonth} DAYS</span>
          </div>
        </HudCard>

        <HudCard className="p-4">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">
            CURRENT STREAK
          </span>
          <div className="text-2xl font-bold font-['Chakra_Petch'] text-[#ff334b] flex items-center gap-2">
            <Flame className="w-5 h-5 fill-[#ff334b]/20" />
            <span>{profile.currentStreak} DAYS</span>
          </div>
        </HudCard>

        <HudCard className="p-4">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">
            ALL-TIME CONSISTENCY
          </span>
          <div className="text-2xl font-bold font-['Chakra_Petch'] text-[#38bdf8]">
            {profile.consistencyDaysCompleted} DAYS
          </div>
        </HudCard>

        <HudCard className="p-4">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">
            RECORD ARCHIVES
          </span>
          <div className="text-2xl font-bold font-['Chakra_Petch'] text-slate-200">
            {totalDaysTracked} LOGGED
          </div>
        </HudCard>
      </div>

      {/* Main Grid: Calendar (Left) & Day Detail Dossier (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Matrix (8 cols) */}
        <HudCard className="lg:col-span-8 p-5">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-400 text-xs py-2 border-b border-slate-800 mb-2 font-['Chakra_Petch']">
            <span>SUN</span>
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarDays.map((cell, idx) => {
              const isSelected = cell.dateStr === selectedDateStr;
              const isToday = cell.dateStr === todayDate;
              const hasRecord = !!cell.record;
              const isPerfect = cell.record?.isPerfectDay || cell.record?.status === 'PERFECT';
              const isPartial = cell.record?.status === 'PARTIAL' || (!isPerfect && (cell.record?.completedMissionIds.length || 0) > 0);

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`
                    relative min-h-[58px] sm:min-h-[72px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition-all select-none
                    ${
                      !cell.isCurrentMonth
                        ? 'opacity-30 border-transparent bg-[#060810]'
                        : isSelected
                        ? 'bg-[#121c32] border-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                        : isToday
                        ? 'bg-[#161222] border-[#ff334b]/60'
                        : 'bg-[#090e1a]/80 border-slate-800/80 hover:border-slate-700'
                    }
                  `}
                >
                  {/* Day Header */}
                  <div className="flex justify-between items-start">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? 'text-[#ff334b] font-black'
                          : isSelected
                          ? 'text-[#38bdf8]'
                          : cell.isCurrentMonth
                          ? 'text-slate-300'
                          : 'text-slate-600'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {isToday && (
                      <span className="text-[8px] font-bold px-1 rounded bg-[#ff334b]/20 text-[#ff334b]">
                        NOW
                      </span>
                    )}
                  </div>

                  {/* Daily Status Indicator Glyph */}
                  <div className="flex items-center justify-end">
                    {isPerfect ? (
                      <div className="flex items-center gap-1 text-[10px] text-[#22c55e] font-bold">
                        <span>✓</span>
                        <span className="hidden sm:inline text-[9px]">PERFECT</span>
                      </div>
                    ) : isPartial ? (
                      <div className="flex items-center gap-1 text-[10px] text-[#38bdf8]">
                        <span>◐</span>
                        <span className="hidden sm:inline text-[9px]">PARTIAL</span>
                      </div>
                    ) : hasRecord && cell.record?.status === 'MISSED' ? (
                      <span className="text-[10px] text-slate-500">×</span>
                    ) : (
                      <span className="text-[9px] text-slate-700">--</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 font-mono">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="text-[#22c55e] font-bold">✓</span> PERFECT DAY (100%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[#38bdf8] font-bold">◐</span> PARTIAL
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-slate-600 font-bold">×</span> MISSED / REST
              </span>
            </div>
            <span className="text-slate-500 text-[11px]">CLICK DATE FOR HISTORICAL ARCHIVE</span>
          </div>
        </HudCard>

        {/* Day Detail Panel (4 cols) */}
        <HudCard variant="blue" className="lg:col-span-4 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <span className="text-[10px] font-mono text-[#38bdf8] uppercase tracking-widest block">
                  RECORD ARCHIVE
                </span>
                <h3 className="text-lg font-bold text-white uppercase font-['Chakra_Petch']">
                  {formatReadableDate(selectedDateStr)}
                </h3>
              </div>
              {isSelectedToday && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#ff334b]/20 text-[#ff334b] border border-[#ff334b]/40">
                  ACTIVE TODAY
                </span>
              )}
            </div>

            {selectedRecord ? (
              <div className="space-y-4 text-xs font-mono">
                {/* Status Callout */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    selectedRecord.isPerfectDay
                      ? 'bg-[#059669]/15 border-[#22c55e]/50 text-[#22c55e]'
                      : selectedRecord.status === 'PARTIAL'
                      ? 'bg-[#0369a1]/15 border-[#38bdf8]/50 text-[#38bdf8]'
                      : 'bg-[#1e293b]/40 border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="font-bold tracking-wider uppercase font-['Chakra_Petch']">
                    STATUS: {selectedRecord.isPerfectDay ? 'PERFECT DAY' : selectedRecord.status}
                  </span>
                  {selectedRecord.isPerfectDay && <Award className="w-4 h-4" />}
                </div>

                {/* Quantitative Breakdown */}
                <div className="space-y-2.5 bg-[#090e1a] p-3.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">MISSIONS COMPLETED:</span>
                    <strong className="text-white font-bold">
                      {selectedRecord.completedMissionIds.length} / {selectedRecord.totalRequiredMissions || missions.length}
                    </strong>
                  </div>

                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">HABITS EXECUTED:</span>
                    <strong className="text-white font-bold">
                      {selectedRecord.completedHabitIds.length} / {selectedRecord.totalActiveHabits || habits.length}
                    </strong>
                  </div>

                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">XP SECURED:</span>
                    <strong className="text-[#38bdf8] font-bold">
                      +{selectedRecord.xpEarned || (selectedRecord.isPerfectDay ? 250 : 80)} XP
                    </strong>
                  </div>

                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">ESSENCE EARNED:</span>
                    <strong className="text-[#ff334b] font-bold">
                      +{selectedRecord.essenceEarned || (selectedRecord.isPerfectDay ? 200 : 70)} ◈
                    </strong>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>EXECUTION EFFICIENCY</span>
                    <span>{selectedRecord.isPerfectDay ? '100%' : 'PARTIAL'}</span>
                  </div>
                  <ProgressBar
                    progress={selectedRecord.isPerfectDay ? 100 : 65}
                    color={selectedRecord.isPerfectDay ? 'emerald' : 'blue'}
                    height="sm"
                  />
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 font-mono text-xs space-y-2">
                <CircleDot className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p>NO ARCHIVE LOGGED FOR THIS DATE.</p>
                <p className="text-[10px] text-slate-600">
                  Data logs generate automatically during daily operation cycles.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#38bdf8]" />
            <span>Immutable local ledger verified.</span>
          </div>
        </HudCard>
      </div>
    </div>
  );
};
