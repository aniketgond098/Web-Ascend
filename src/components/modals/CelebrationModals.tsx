import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { RankBadge } from '../ui/RankBadge';
import { RankTier } from '../../types';
import { Sparkles, Trophy, Award, Zap } from 'lucide-react';

export const CelebrationModals: React.FC = () => {
  const { celebration, closeCelebration } = useApp();

  useEffect(() => {
    if (!celebration.type) return;

    if (celebration.type === 'RANK_UP') {
      // Big firework confetti
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#ff334b', '#38bdf8', '#fbbf24', '#ffffff'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 80,
          origin: { x: 0 },
          colors: ['#ff334b', '#38bdf8'],
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 80,
          origin: { x: 1 },
          colors: ['#ff334b', '#38bdf8'],
        });
      }, 250);
    } else if (celebration.type === 'LEVEL_UP' || celebration.type === 'PERFECT_DAY') {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#38bdf8', '#ff334b', '#ffffff'],
      });
    }
  }, [celebration]);

  if (!celebration.type) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Dark Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeCelebration}
          className="fixed inset-0 bg-[#03060c]/85 backdrop-blur-md"
        />

        {/* Modal Body */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: 'spring', duration: 0.45, bounce: 0.2 }}
          className="relative w-full max-w-md bg-[#0a0f1e] border-2 border-[#ff334b] rounded-2xl p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(255,51,75,0.3)] z-10 font-mono"
        >
          {/* Subtle Cyber Corner Marks */}
          <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-white" />
          <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-white" />
          <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-[#38bdf8]" />
          <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-[#38bdf8]" />

          {/* 1. LEVEL UP CELEBRATION */}
          {celebration.type === 'LEVEL_UP' && (
            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0369a1]/30 border border-[#38bdf8] text-[#38bdf8] mb-4 shadow-[0_0_20px_rgba(56,189,248,0.4)]">
                <Zap className="w-8 h-8 animate-pulse" />
              </div>

              <p className="text-xs text-[#38bdf8] font-bold tracking-[0.25em] uppercase mb-1">
                SYSTEM PROTOCOL
              </p>
              <h2 className="text-2xl font-black text-white uppercase font-['Chakra_Petch'] tracking-wider mb-2">
                LEVEL UP ACHIEVED
              </h2>

              <div className="my-6 py-4 px-6 rounded-xl bg-[#0e1628] border border-slate-700 flex items-center justify-center gap-4">
                <span className="text-2xl font-extrabold text-slate-400">
                  LVL {(celebration.data as { oldLevel: number; newLevel: number })?.oldLevel || 1}
                </span>
                <span className="text-[#ff334b] text-xl font-bold">→</span>
                <span className="text-3xl font-black text-[#38bdf8] drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]">
                  LVL {(celebration.data as { oldLevel: number; newLevel: number })?.newLevel || 2}
                </span>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e293b] border border-[#38bdf8]/40 text-xs text-white mb-6">
                <Sparkles className="w-4 h-4 text-[#ff334b]" />
                <span>+{(celebration.data as { bonusEssence: number })?.bonusEssence || 50} ESSENCE BONUS</span>
              </div>

              <p className="text-xs text-slate-400 mb-6">
                Neural link capacity expanded. Keep executing your daily protocols.
              </p>

              <button
                onClick={closeCelebration}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#38bdf8] text-white font-bold tracking-widest uppercase hover:brightness-110 shadow-[0_0_20px_rgba(56,189,248,0.4)]"
              >
                ENGAGE NEXT LEVEL
              </button>
            </div>
          )}

          {/* 2. RANK UP CELEBRATION */}
          {celebration.type === 'RANK_UP' && (
            <div>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#7f1d1d]/30 border-2 border-[#ff334b] text-[#ff334b] mb-4 shadow-[0_0_30px_rgba(255,51,75,0.6)]">
                <Trophy className="w-10 h-10 animate-bounce" />
              </div>

              <p className="text-xs text-[#ff334b] font-bold tracking-[0.3em] uppercase mb-1">
                SYSTEM NOTIFICATION
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase font-['Chakra_Petch'] tracking-widest mb-1">
                ASCENSION COMPLETE
              </h2>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-6">
                LONG-TERM CONSISTENCY RECOGNIZED
              </p>

              <div className="my-6 py-5 px-6 rounded-xl bg-[#140b12] border border-[#ff334b]/40 flex items-center justify-center gap-6">
                <RankBadge
                  rank={(celebration.data as { oldRank: RankTier })?.oldRank || 'E'}
                  size="lg"
                  glow={false}
                />
                <span className="text-2xl font-bold text-[#ff334b] animate-pulse">
                  ➔
                </span>
                <RankBadge
                  rank={(celebration.data as { newRank: RankTier })?.newRank || 'D'}
                  size="hero"
                  glow={true}
                />
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1e293b] border border-[#ff334b]/60 text-xs text-white mb-6 shadow-[0_0_15px_rgba(255,51,75,0.3)]">
                <Sparkles className="w-4 h-4 text-[#38bdf8]" />
                <span className="font-bold">
                  +{(celebration.data as { bonusEssence: number })?.bonusEssence || 500} ESSENCE AWARDED
                </span>
              </div>

              <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                Your discipline has elevated you to the next echelon of mastery. The Web Ascend hierarchy acknowledges your supreme consistency.
              </p>

              <button
                onClick={closeCelebration}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#b91c1c] via-[#dc2626] to-[#ff334b] text-white font-bold tracking-widest uppercase hover:brightness-110 shadow-[0_0_25px_rgba(255,51,75,0.6)]"
              >
                ASCEND TO HIGHER REALMS
              </button>
            </div>
          )}

          {/* 3. PERFECT DAY CELEBRATION */}
          {celebration.type === 'PERFECT_DAY' && (
            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#059669]/30 border border-[#34d399] text-[#34d399] mb-4 shadow-[0_0_20px_rgba(52,211,153,0.4)]">
                <Award className="w-8 h-8" />
              </div>

              <p className="text-xs text-[#34d399] font-bold tracking-[0.25em] uppercase mb-1">
                PROTOCOL EXECUTED
              </p>
              <h2 className="text-2xl font-black text-white uppercase font-['Chakra_Petch'] tracking-wider mb-2">
                PERFECT DAY ACHIEVED
              </h2>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-6">
                ALL OBJECTIVES COMPLETE
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-[#0e1628] border border-slate-700">
                  <span className="text-[10px] text-slate-400 block uppercase">XP BONUS</span>
                  <span className="text-lg font-bold text-[#38bdf8]">
                    +{(celebration.data as { xp: number })?.xp || 100} XP
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#0e1628] border border-slate-700">
                  <span className="text-[10px] text-slate-400 block uppercase">ESSENCE BONUS</span>
                  <span className="text-lg font-bold text-[#ff334b]">
                    +{(celebration.data as { essence: number })?.essence || 100} ◈
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-6">
                Daily streak extended. 100% efficiency recorded into historical archives.
              </p>

              <button
                onClick={closeCelebration}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#059669] to-[#34d399] text-slate-950 font-black tracking-widest uppercase hover:brightness-110 shadow-[0_0_20px_rgba(52,211,153,0.4)]"
              >
                CLAIM VICTORY
              </button>
            </div>
          )}

          {/* 4. PURCHASE REWARD CELEBRATION */}
          {celebration.type === 'PURCHASE' && (
            <div>
              <div className="text-5xl mb-4 animate-pulse">
                {(celebration.data as { icon: string })?.icon || '🎁'}
              </div>

              <p className="text-xs text-[#38bdf8] font-bold tracking-[0.25em] uppercase mb-1">
                WEB MARKET CLAIM
              </p>
              <h2 className="text-2xl font-black text-white uppercase font-['Chakra_Petch'] tracking-wider mb-2">
                REWARD UNLOCKED
              </h2>

              <div className="my-5 p-4 rounded-xl bg-[#0e1628] border border-slate-700">
                <span className="text-lg font-bold text-white block mb-1">
                  {(celebration.data as { rewardName: string })?.rewardName || 'Reward'}
                </span>
                <span className="text-xs text-[#ff334b] font-mono">
                  -{(celebration.data as { cost: number })?.cost || 0} ESSENCE
                </span>
              </div>

              <p className="text-xs text-slate-300 mb-6">
                Enjoy your hard-earned reward. You earned every single point of Essence through genuine daily discipline.
              </p>

              <button
                onClick={closeCelebration}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#38bdf8] text-white font-bold tracking-widest uppercase hover:brightness-110 shadow-[0_0_20px_rgba(56,189,248,0.4)]"
              >
                ENJOY REWARD
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
