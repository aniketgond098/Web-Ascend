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
import { HudCard } from '../ui/HudCard';
import { ProgressBar } from '../ui/ProgressBar';
import { RankBadge } from '../ui/RankBadge';
import { RANK_CONFIG, RANK_ORDER, getRankProgress } from '../../config/progression';
import { RankTier } from '../../types';

export const AscendView: React.FC = () => {
  const { profile, triggerAscendSimulation } = useApp();

  const rankProgress = getRankProgress(profile.consistencyDaysCompleted);
  const currentRankInfo = RANK_CONFIG[profile.rank];
  const nextRankInfo = rankProgress.nextRank ? RANK_CONFIG[rankProgress.nextRank] : null;

  // Reverse ladder: Top is SSS, Bottom is E
  const reversedRanks = [...RANK_ORDER].reverse();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 lg:pb-8 font-mono">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#ff334b] font-bold tracking-widest uppercase">
            <TrendingUp className="w-4 h-4" />
            <span>OPERATIVE EVOLUTION // ASCENSION PROTOCOL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase font-['Chakra_Petch'] tracking-wide">
            RANK ASCENSION LADDER
          </h1>
        </div>

        {/* Test simulation button for demonstrating rank up ceremony */}
        <button
          onClick={triggerAscendSimulation}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a0f18] border border-[#ff334b]/40 hover:border-[#ff334b] text-[#ff334b] text-xs font-bold tracking-wider uppercase transition-all shadow-[0_0_12px_rgba(255,51,75,0.2)]"
        >
          <Sparkles className="w-4 h-4" />
          <span>SIMULATE RANK-UP CEREMONY</span>
        </button>
      </div>

      {/* Main Philosophy Card: XP vs Consistency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HudCard variant="blue" className="p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#0369a1]/30 border border-[#38bdf8] text-[#38bdf8]">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-['Chakra_Petch'] tracking-wider">
                XP = LEVEL PROGRESSION (FREQUENT)
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                XP tracks daily output and tasks completed. Levels advance regularly every few days to maintain character momentum and unlock essence bonuses.
              </p>
            </div>
          </div>
        </HudCard>

        <HudCard variant="crimson" className="p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#7f1d1d]/30 border border-[#ff334b] text-[#ff334b]">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-['Chakra_Petch'] tracking-wider">
                CONSISTENCY = RANK ASCENSION (LONG-TERM)
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Ranks represent unwavering discipline over time. Each tier requires approximately <strong>180 successful consistency days</strong> (~6 months) of deliberate execution.
              </p>
            </div>
          </div>
        </HudCard>
      </div>

      {/* Active Ascension Milestone Summary */}
      <HudCard className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Current Rank */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[#080d1a] border border-slate-800">
            <RankBadge rank={profile.rank} size="lg" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                CURRENT TIER
              </span>
              <h4 className="text-lg font-bold text-white font-['Chakra_Petch']">
                {currentRankInfo.name}
              </h4>
              <span className="text-xs font-mono text-[#38bdf8]">
                {currentRankInfo.codename}
              </span>
            </div>
          </div>

          {/* Center: Consistency Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-slate-400 font-bold uppercase">
                CONSISTENCY PROGRESS
              </span>
              <span className="text-white font-bold">
                {rankProgress.daysInCurrentRank} / {rankProgress.daysNeededForNextRank} DAYS
              </span>
            </div>

            <ProgressBar
              progress={rankProgress.progressPercent}
              color="crimson"
              height="md"
            />

            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span>{rankProgress.progressPercent}% to next rank</span>
              <strong className="text-[#ff334b]">
                {rankProgress.daysRemaining} DAYS REMAINING
              </strong>
            </div>
          </div>

          {/* Next Target Rank */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[#080d1a] border border-slate-800">
            {nextRankInfo ? (
              <>
                <RankBadge rank={nextRankInfo.tier} size="lg" glow={false} />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    NEXT ASCENSION
                  </span>
                  <h4 className="text-lg font-bold text-slate-200 font-['Chakra_Petch']">
                    {nextRankInfo.name}
                  </h4>
                  <span className="text-xs font-mono text-amber-400">
                    +500 ◈ Essence on Promotion
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center w-full py-2 text-xs text-[#a855f7] font-bold">
                ★ SUPREME ARCHITECT MAX RANK ACHIEVED ★
              </div>
            )}
          </div>
        </div>
      </HudCard>

      {/* 8-Tier Vertical Progression Ladder */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white uppercase font-['Chakra_Petch'] tracking-wider">
          THE COMPLETE ASCENSION HIERARCHY
        </h3>

        <div className="relative space-y-3 pl-4 sm:pl-8 before:absolute before:left-8 sm:before:left-12 before:top-6 before:bottom-6 before:w-0.5 before:bg-gradient-to-b before:from-[#a855f7] via-[#38bdf8] to-slate-800">
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
                  relative flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all
                  ${
                    isCurrent
                      ? 'bg-[#140b12] border-2 border-[#ff334b] shadow-[0_0_25px_rgba(255,51,75,0.25)] scale-[1.01]'
                      : isCompleted
                      ? 'bg-[#090e1a]/80 border-slate-800/80'
                      : 'bg-[#060810]/60 border-slate-900 opacity-60'
                  }
                `}
              >
                {/* Left: Badge & Info */}
                <div className="flex items-center gap-4">
                  <div className="relative z-10">
                    <RankBadge rank={tier} size="md" glow={isCurrent} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white font-['Chakra_Petch']">
                        {info.name}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-[#131a2e] text-slate-300 font-semibold">
                        {info.codename}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded bg-[#ff334b] text-white animate-pulse">
                          ← CURRENT RANK
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono max-w-xl">
                      {info.description}
                    </p>
                  </div>
                </div>

                {/* Right: Requirements & Status */}
                <div className="flex items-center justify-between sm:justify-end gap-4 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800 text-xs">
                  <div className="text-right font-mono">
                    <span className="text-[10px] text-slate-500 block">TIER REQ</span>
                    <span className="text-slate-300 font-bold">180 CONSISTENT DAYS</span>
                  </div>

                  {isCompleted ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#059669]/20 text-[#22c55e] border border-[#22c55e]/30 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>MASTERED</span>
                    </div>
                  ) : isCurrent ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7f1d1d]/30 text-[#ff334b] border border-[#ff334b]/40 font-bold">
                      <Flame className="w-4 h-4 animate-pulse" />
                      <span>{rankProgress.daysInCurrentRank}/180 DAYS</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 text-slate-500 border border-slate-700/40">
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
