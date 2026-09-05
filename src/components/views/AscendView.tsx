import React from 'react';
import {
  TrendingUp,
  Shield,
  Award,
  Lock,
  CheckCircle2,
  Sparkles,
  Zap,
  Flame,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RankBadge } from '../ui/RankBadge';
import { RANK_CONFIG, RANK_ORDER, getRankProgress } from '../../config/progression';

export const AscendView: React.FC = () => {
  const { profile } = useApp();

  const rankProgress = getRankProgress(profile.totalSuccessfulDays ?? profile.consistencyDaysCompleted ?? 0);
  const currentRankInfo = RANK_CONFIG[profile.rank];
  const nextRankInfo = rankProgress.nextRank ? RANK_CONFIG[rankProgress.nextRank] : null;

  // Reverse ladder: Top is SSS, Bottom is E
  const reversedRanks = [...RANK_ORDER].reverse();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 lg:pb-8 font-sans">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-900/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-red-500 font-mono font-bold tracking-widest uppercase">
            <TrendingUp className="w-4 h-4" />
            <span>EVOLUTIONARY PROTOCOL // RANK STABILIZATION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white uppercase font-['Chakra_Petch'] tracking-wide mt-1">
            ASCENSION
          </h1>
        </div>
      </div>

      {/* 2. Core Philosophy: XP vs Consistency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-[#0A0E17] border border-blue-900/30">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-950 text-blue-400 border border-blue-800/40 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-['Chakra_Petch'] tracking-wider">
                XP = HERO LEVEL (DAILY MOMENTUM)
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                Experience points quantify daily mission execution and protocol completions. Levels advance frequently to generate Spidey Coin bonuses and reflect short-term output.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0A0E17] border border-red-900/30">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-red-950 text-red-400 border border-red-800/40 shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-['Chakra_Petch'] tracking-wider">
                SUCCESSFUL DAYS = RANK ASCENSION (LONG-TERM MASTERY)
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                <strong>1 Calendar Day with all Core Directives complete = +1 Day towards Rank Ascension.</strong> XP levels and Rank are separate evolutionary vectors. Advancing each tier requires <strong>180 disciplined days</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Active Ascension Milestone Summary */}
      <div className="p-6 rounded-2xl bg-[#0A0E17] border border-blue-900/25 shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Current Rank */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0F141F] border border-blue-900/30">
            <RankBadge rank={profile.rank} size="lg" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">
                CURRENT TIER
              </span>
              <h4 className="text-lg font-bold text-white font-['Chakra_Petch']">
                {currentRankInfo.name}
              </h4>
              <span className="text-xs font-mono text-blue-400">
                {currentRankInfo.codename}
              </span>
            </div>
          </div>

          {/* Center: Consistency Progress */}
          <div className="space-y-2 font-mono">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-slate-400 font-bold uppercase">
                RANK CONSISTENCY PROGRESS
              </span>
              <span className="text-white font-bold">
                {rankProgress.daysInCurrentRank} / {rankProgress.daysNeededForNextRank} SUCCESSFUL DAYS COMPLETED
              </span>
            </div>

            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-600 shadow-[0_0_10px_#ef4444] rounded-full transition-all duration-500"
                style={{ width: `${rankProgress.progressPercent}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span>{rankProgress.progressPercent}% towards next ascension rank</span>
              <strong className="text-red-400">
                {rankProgress.daysRemaining} DAYS REMAINING
              </strong>
            </div>
          </div>

          {/* Next Target Rank */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0F141F] border border-blue-900/30">
            {nextRankInfo ? (
              <>
                <RankBadge rank={nextRankInfo.tier} size="lg" glow={false} />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">
                    NEXT ASCENSION TARGET
                  </span>
                  <h4 className="text-lg font-bold text-slate-200 font-['Chakra_Petch']">
                    {nextRankInfo.codename}
                  </h4>
                  <span className="text-xs font-mono text-amber-400">
                    +500 SPIDEY COINS on Promotion
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center w-full py-2 text-xs text-red-400 font-bold font-['Chakra_Petch']">
                ★ TRANSCENDENT WEB-SLINGER APEX RANK ACHIEVED ★
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Complete Ascension Hierarchy Ladder */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white uppercase font-['Chakra_Petch'] tracking-wider">
          THE COMPLETE ASCENSION HIERARCHY
        </h3>

        <div className="space-y-3">
          {reversedRanks.map((tier) => {
            const info = RANK_CONFIG[tier];
            const currentTierOrder = currentRankInfo.order;
            const isCurrent = tier === profile.rank;
            const isCompleted = info.order < currentTierOrder;
            const isLocked = info.order > currentTierOrder;

            return (
              <div
                key={tier}
                className={`
                  p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4
                  ${
                    isCurrent
                      ? 'bg-[#0F141F] border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.15)] ring-1 ring-red-500/50'
                      : isCompleted
                      ? 'bg-[#0A0E17] border-blue-900/30'
                      : 'bg-[#0A0E17]/50 border-slate-900 opacity-60'
                  }
                `}
              >
                {/* Left: Badge & Info */}
                <div className="flex items-center gap-4">
                  <div className="relative z-10 shrink-0">
                    <RankBadge rank={tier} size="md" glow={isCurrent} />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-bold text-white font-['Chakra_Petch']">
                        {info.name}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-900/40 font-semibold">
                        {info.codename}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-600 text-white animate-pulse">
                          CURRENT RANK
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-sans max-w-xl">
                      {info.description}
                    </p>
                  </div>
                </div>

                {/* Right: Requirements & Status */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-blue-900/20 text-xs font-mono">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase">Prerequisite</span>
                    <span className="text-slate-300 font-bold">180 DAYS DISCIPLINE</span>
                  </div>

                  {isCompleted ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>MASTERED</span>
                    </div>
                  ) : isCurrent ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 text-red-400 border border-red-800/50 font-bold">
                      <Flame className="w-4 h-4 animate-pulse" />
                      <span>{rankProgress.daysInCurrentRank}/180 DAYS</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-slate-500 border border-slate-800">
                      <Lock className="w-3.5 h-3.5" />
                      <span>LOCKED</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
