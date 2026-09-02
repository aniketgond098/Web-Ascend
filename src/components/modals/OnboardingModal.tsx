import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { WebAscendLogo } from '../ui/WebAscendLogo';
import { RankBadge } from '../ui/RankBadge';
import { Sparkles, Terminal, ArrowRight, ShieldCheck } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { initializeProfile, profile } = useApp();
  const [step, setStep] = useState<'INPUT' | 'CONFIRMATION'>('INPUT');
  const [codename, setCodename] = useState('');
  const [usePreset, setUsePreset] = useState(true);

  if (!isOpen) return null;

  const handleBegin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codename.trim()) return;
    initializeProfile(codename.trim(), usePreset);
    setStep('CONFIRMATION');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050810]/95 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-[#0a0f1e] border-2 border-[#1e293b] rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_30px_rgba(56,189,248,0.15)] relative font-mono text-slate-200"
      >
        {/* Subtle Tech Corners */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#ff334b]" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#ff334b]" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#38bdf8]" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#38bdf8]" />

        <div className="text-center mb-6">
          <WebAscendLogo size="hero" showText={true} className="justify-center mb-2" />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0e1628] border border-slate-700 text-[11px] text-[#38bdf8]">
            <Terminal className="w-3.5 h-3.5" />
            <span>SYSTEM INITIALIZATION // PROTOCOL ONLINE</span>
          </div>
        </div>

        {step === 'INPUT' ? (
          <form onSubmit={handleBegin} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2 font-bold font-['Chakra_Petch']">
                ENTER YOUR OPERATIVE CODENAME / USERNAME
              </label>
              <input
                type="text"
                required
                autoFocus
                value={codename}
                onChange={(e) => setCodename(e.target.value)}
                placeholder="e.g. Peter, Miles, Hunter, Apex"
                className="w-full px-4 py-3 rounded-xl bg-[#080c18] border border-slate-700 text-white font-mono text-base placeholder:text-slate-600 focus:outline-none focus:border-[#ff334b] shadow-inner transition-colors"
              />
            </div>

            <div className="p-4 rounded-xl bg-[#0c1222] border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 text-slate-300 font-bold font-['Chakra_Petch']">
                <ShieldCheck className="w-4 h-4 text-[#38bdf8]" />
                <span>CORE GAMEPLAY LOOP</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Complete daily missions & habits → Earn XP & Essence → Level Up regularly → Build long-term streaks → Ascend through ranks (E to SSS) → Spend Essence in the Web Market.
              </p>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={usePreset}
                  onChange={(e) => setUsePreset(e.target.checked)}
                  className="rounded bg-[#080c18] border-slate-700 text-[#38bdf8] accent-[#38bdf8]"
                />
                <span>Include starter productivity missions & daily habits</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={!codename.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#b91c1c] via-[#dc2626] to-[#ff334b] text-white font-bold tracking-widest uppercase hover:brightness-110 shadow-[0_0_25px_rgba(255,51,75,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-['Chakra_Petch']"
            >
              <span>BEGIN ASCENSION</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="text-center space-y-6">
            <div className="p-6 rounded-2xl bg-[#0e1628] border border-slate-700 space-y-4">
              <span className="text-xs text-[#22c55e] font-bold tracking-widest uppercase block">
                ● SYSTEM INITIALIZED & ONLINE
              </span>

              <h3 className="text-xl font-bold text-white uppercase font-['Chakra_Petch']">
                WELCOME, {profile.username}
              </h3>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-[#080c18] border border-slate-800 flex items-center gap-3">
                  <RankBadge rank="E" size="md" />
                  <div className="text-left">
                    <span className="text-[10px] text-slate-500 block">TIER</span>
                    <span className="text-xs font-bold text-white">RANK E</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#080c18] border border-slate-800 text-left">
                  <span className="text-[10px] text-slate-500 block">LEVEL</span>
                  <span className="text-xs font-bold text-[#38bdf8]">LEVEL 1</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">0 XP // ◈ 0</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#38bdf8] text-white font-bold tracking-widest uppercase hover:brightness-110 shadow-[0_0_20px_rgba(56,189,248,0.4)] font-['Chakra_Petch']"
            >
              VIEW TODAY'S MISSIONS
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
