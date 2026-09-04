import React from 'react';
import { UploadCloud, CheckCircle2, Sparkles, X, ArrowRight } from 'lucide-react';

interface MigrationPromptModalProps {
  isOpen: boolean;
  onImport: () => void;
  onStartFresh: () => void;
  importing: boolean;
}

export const MigrationPromptModal: React.FC<MigrationPromptModalProps> = ({
  isOpen,
  onImport,
  onStartFresh,
  importing,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#090D17] border border-red-500/40 shadow-[0_0_50px_rgba(230,43,58,0.2)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-red-900/30 bg-[#060810] flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-400">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-['Chakra_Petch']">
              LOCAL DATA DETECTED
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Synchronize Device Records to Cloud Database
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 font-mono text-xs text-slate-300">
          <p className="leading-relaxed">
            We discovered existing operative records stored in your browser's local cache.
            Since <strong className="text-white">Supabase PostgreSQL is now your permanent source of truth</strong>, you can migrate your existing missions, habits, consistency days, and Spidey Coins into your cloud account.
          </p>

          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2 text-[11px]">
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Preserves your custom missions, habits, and web streak</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Transfers your earned XP and Spidey Coin transactions</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Stores everything permanently in PostgreSQL across all devices</span>
            </div>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={onImport}
              disabled={importing}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-bold tracking-wider uppercase font-['Chakra_Petch'] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(230,43,58,0.3)] transition-all disabled:opacity-50"
            >
              {importing ? (
                <span>MIGRATING TO SUPABASE...</span>
              ) : (
                <>
                  <span>IMPORT PROGRESS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              onClick={onStartFresh}
              disabled={importing}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors uppercase font-bold"
            >
              START FRESH
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
