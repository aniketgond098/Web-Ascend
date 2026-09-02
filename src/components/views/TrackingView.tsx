import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Award,
  Flame,
  ShieldCheck,
  CircleDot,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateString, formatReadableDate, parseDateString } from '../../utils/date';
import { DailyRecord } from '../../types';
import { SpideyCoinIcon } from '../ui/SpideyCoinDisplay';

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

  const perfectDaysThisMonth = currentMonthRecords.filter((r) => r.isSuccessfulDay || r.isPerfectDay).length;
  const totalDaysTracked = Object.keys(dailyRecords).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 lg:pb-8 font-sans">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-900/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-red-500 font-mono font-bold tracking-widest uppercase">
            <Clock className="w-4 h-4" />
            <span>TEMPORAL DIRECTIVES // SECTOR ARCHIVES</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white uppercase font-['Chakra_Petch'] tracking-wide mt-1">
            MISSION LOG
          </h1>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 font-mono">
          <button
            onClick={jumpToToday}
            className="px-3 py-1.5 rounded-lg bg-[#0A0E17] border border-blue-900/30 hover:border-red-400 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            TODAY
          </button>
          <div className="flex items-center gap-1 bg-[#0A0E17] p-1 rounded-lg border border-blue-900/30">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-white font-['Chakra_Petch'] uppercase tracking-wider min-w-[120px] text-center">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="p-4 rounded-xl bg-[#0A0E17] border border-blue-900/20">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
            PERFECT DAYS (MONTH)
          </span>
          <div className="text-2xl font-bold font-['Chakra_Petch'] text-emerald-400 flex items-center gap-2 mt-0.5">
            <Award className="w-5 h-5" />
            <span>{perfectDaysThisMonth} DAYS</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0A0E17] border border-blue-900/20">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
            CURRENT STREAK
          </span>
          <div className="text-2xl font-bold font-['Chakra_Petch'] text-red-500 flex items-center gap-2 mt-0.5">
            <Flame className="w-5 h-5 fill-red-500/20" />
            <span>{profile.currentStreak} DAYS</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0A0E17] border border-blue-900/20">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
            ALL-TIME CONSISTENCY
          </span>
          <div className="text-2xl font-bold font-['Chakra_Petch'] text-blue-400 mt-0.5">
            {profile.totalSuccessfulDays ?? profile.consistencyDaysCompleted} DAYS
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0A0E17] border border-blue-900/20">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
            ARCHIVE LOGS
          </span>
          <div className="text-2xl font-bold font-['Chakra_Petch'] text-white mt-0.5">
            {totalDaysTracked} LOGGED
          </div>
        </div>
      </div>

      {/* 3. Main Grid: Calendar (Left 8 cols) & Day Detail Dossier (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Matrix (8 cols) */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-[#0A0E17] border border-blue-900/20 shadow-lg">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-400 text-xs py-2 border-b border-blue-900/20 mb-3 font-mono">
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
              const isPerfect = Boolean(cell.record?.isSuccessfulDay || cell.record?.isPerfectDay || cell.record?.status === 'PERFECT');
              const isPartial = cell.record?.status === 'PARTIAL' || (!isPerfect && ((cell.record?.completedMissionIds.length || 0) > 0 || (cell.record?.completedHabitIds.length || 0) > 0));

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`
                    relative min-h-[58px] sm:min-h-[70px] p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition-all select-none
                    ${
                      !cell.isCurrentMonth
                        ? 'opacity-25 border-transparent bg-slate-900/10'
                        : isSelected
                        ? 'bg-[#0F141F] border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.25)]'
                        : isToday
                        ? 'bg-red-950/20 border-red-500/50'
                        : 'bg-[#0F141F]/60 border-blue-900/20 hover:border-blue-700/50'
                    }
                  `}
                >
                  {/* Day Header */}
                  <div className="flex justify-between items-start font-mono">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? 'text-red-400 font-black'
                          : isSelected
                          ? 'text-blue-400'
                          : cell.isCurrentMonth
                          ? 'text-slate-300'
                          : 'text-slate-600'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {isToday && (
                      <span className="text-[8px] font-bold px-1 rounded bg-red-950 text-red-400 border border-red-800/50">
                        NOW
                      </span>
                    )}
                  </div>

                  {/* Daily Status Indicator Glyph */}
                  <div className="flex items-center justify-end font-mono">
                    {isPerfect ? (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                        <span className="hidden sm:inline text-[9px]">PERFECT</span>
                      </div>
                    ) : isPartial ? (
                      <div className="flex items-center gap-1 text-[10px] text-blue-400">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        <span className="hidden sm:inline text-[9px]">PARTIAL</span>
                      </div>
                    ) : hasRecord && cell.record?.status === 'MISSED' ? (
                      <span className="text-[10px] text-slate-500">×</span>
                    ) : (
                      <span className="text-[9px] text-slate-700">·</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-blue-900/20 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 font-mono">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" /> PERFECT DAY (100%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" /> PARTIAL
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-slate-600 font-bold">·</span> REST / IDLE
              </span>
            </div>
            <span className="text-slate-500 text-[11px]">SELECT ANY DATE FOR TELEMETRY</span>
          </div>
        </div>

        {/* Day Detail Panel (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-[#0A0E17] border border-blue-900/30 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/20 mb-4 font-mono">
              <div>
                <span className="text-[10px] text-blue-400 uppercase tracking-widest block">
                  ARCHIVE TELEMETRY
                </span>
                <h3 className="text-base font-bold text-white uppercase font-['Chakra_Petch'] mt-0.5">
                  {formatReadableDate(selectedDateStr)}
                </h3>
              </div>
              {isSelectedToday && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/40">
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
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400'
                      : selectedRecord.status === 'PARTIAL'
                      ? 'bg-blue-950/20 border-blue-500/40 text-blue-400'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="font-bold tracking-wider uppercase font-['Chakra_Petch']">
                    STATUS: {selectedRecord.isPerfectDay ? 'PERFECT DAY' : selectedRecord.status}
                  </span>
                  {selectedRecord.isPerfectDay && <Award className="w-4 h-4" />}
                </div>

                {/* Quantitative Breakdown */}
                <div className="space-y-2.5 bg-[#0F141F] p-3.5 rounded-xl border border-blue-900/30">
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
                    <strong className="text-blue-400 font-bold">
                      +{selectedRecord.xpEarned || (selectedRecord.isPerfectDay ? 250 : 80)} XP
                    </strong>
                  </div>

                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">SPIDEY COINS:</span>
                    <strong className="text-amber-300 font-bold flex items-center gap-1">
                      <SpideyCoinIcon size={12} />
                      +{selectedRecord.essenceEarned || (selectedRecord.isPerfectDay ? 200 : 70)}
                    </strong>
                  </div>
                </div>

                {/* Execution Efficiency */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
                    <span>EXECUTION EFFICIENCY</span>
                    <span className="text-white font-bold">{selectedRecord.isPerfectDay ? '100%' : 'PARTIAL'}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        selectedRecord.isPerfectDay ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-blue-500'
                      }`}
                      style={{ width: selectedRecord.isPerfectDay ? '100%' : '65%' }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 font-mono text-xs space-y-2">
                <CircleDot className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p>NO ARCHIVE LOGGED FOR THIS DATE.</p>
                <p className="text-[10px] text-slate-600">
                  Daily outputs are logged automatically during system cycles.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-blue-900/20 text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-4">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Cryptographic local ledger verified.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
