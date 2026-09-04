import React, { useState } from 'react';
import {
  User,
  Shield,
  Zap,
  Flame,
  Award,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  Edit2,
  Terminal,
  Activity,
  Calendar,
  Database,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RankBadge } from '../ui/RankBadge';
import { RANK_CONFIG } from '../../config/progression';
import { formatReadableDate } from '../../utils/date';
import { DailyRecord } from '../../types';
import { ConfirmModal } from '../modals/ConfirmModal';
import { SpideyCoinIcon } from '../ui/SpideyCoinDisplay';
import { SpiderIcon } from '../ui/SpiderIcon';

export const ProfileView: React.FC = () => {
  const {
    user,
    syncStatus,
    setAuthModalOpen,
    setAccountModalOpen,
    setSupabaseConfigModalOpen,
    profile,
    updateProfile,
    missions,
    habits,
    dailyRecords,
    purchases,
    toggleSound,
    resetAllData,
    resetTestProgression,
    exportData,
    importData,
    addNotification,
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(profile.username);
  const [importText, setImportText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const rankInfo = RANK_CONFIG[profile.rank];

  // Quantitative lifetime aggregations
  const allRecords = Object.values(dailyRecords) as DailyRecord[];
  const totalDaysTracked = Object.keys(dailyRecords).length;
  const totalPerfectDays = allRecords.filter((r) => r.isPerfectDay).length;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    updateProfile({ username: username.trim() });
    setIsEditing(false);
  };

  const handleExport = () => {
    const dataStr = exportData();
    navigator.clipboard.writeText(dataStr);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const success = importData(importText);
    if (success) {
      addNotification('BACKUP RESTORED', 'System data successfully loaded and restored.', 'SYSTEM');
      setShowImportBox(false);
      setImportText('');
    } else {
      addNotification('IMPORT FAILED', 'Invalid backup schema. Import aborted.', 'SYSTEM');
    }
  };

  const handleReset = () => {
    setIsResetModalOpen(true);
  };

  const handleConfirmReset = () => {
    resetTestProgression();
    setIsResetModalOpen(false);
    addNotification('OPERATIVE RE-INITIALIZED', 'Operative reset to factory specs.', 'SYSTEM');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 lg:pb-8 font-sans">
      {/* 1. Header */}
      <div className="border-b border-blue-900/20 pb-4">
        <div className="flex items-center gap-2 text-xs text-red-500 font-mono font-bold tracking-widest uppercase">
          <Terminal className="w-4 h-4" />
          <span>OPERATIVE CREDENTIALS // SYSTEM METRICS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white uppercase font-['Chakra_Petch'] tracking-wide mt-1">
          HERO PROFILE
        </h1>
      </div>

      {/* 2. Main Dossier Card / Hero ID Badge */}
      <div className="p-6 rounded-2xl bg-[#0A0E17] border border-blue-900/30 shadow-lg relative overflow-hidden">
        {/* Subtle decorative watermark */}
        <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none">
          <SpiderIcon size={160} color="#3B82F6" />
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10">
          {/* Avatar / Rank Insignia & User Details */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <RankBadge rank={profile.rank} size="hero" glow={true} />

            <div className="space-y-2">
              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. SPECTRE-WEAVER"
                    className="px-3 py-1.5 rounded-lg bg-[#0F141F] border border-red-500 text-white text-base font-bold font-['Chakra_Petch'] uppercase focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold font-mono cursor-pointer"
                  >
                    SAVE
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-mono cursor-pointer"
                  >
                    CANCEL
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-3 justify-center sm:justify-start">
                  <h2 className="text-2xl font-bold text-white uppercase font-['Chakra_Petch'] tracking-wider">
                    {profile.username}
                  </h2>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Edit Hero Codename"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <p className="text-xs text-red-400 font-mono font-bold tracking-widest uppercase">
                RANK {profile.rank} // {rankInfo.codename.toUpperCase()}
              </p>

              <p className="text-xs text-slate-400 max-w-md font-sans">
                Hero ID initialized since {formatReadableDate(profile.joinedDate || (profile.createdAt ? String(profile.createdAt) : undefined))}. Web link synchronized and operational across all city sectors.
              </p>
            </div>
          </div>

          {/* Quick Level & Currency Badge */}
          <div className="flex flex-row gap-3 font-mono">
            <div className="p-3.5 rounded-xl bg-[#0F141F] border border-blue-900/40 text-center min-w-[100px]">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">LEVEL</span>
              <span className="text-base font-bold text-blue-400 font-['Chakra_Petch']">
                LVL {profile.level}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0F141F] border border-amber-500/40 text-center min-w-[120px]">
              <span className="text-[10px] text-amber-400/80 block uppercase font-bold">SPIDEY COINS</span>
              <span className="text-base font-bold text-amber-300 font-['Chakra_Petch'] flex items-center justify-center gap-1">
                <SpideyCoinIcon size={14} />
                {profile.currentEssence.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Lifetime Quantitative Metrics Grid */}
      <div>
        <h3 className="text-base font-bold text-white uppercase font-['Chakra_Petch'] tracking-wider mb-3">
          LIFETIME QUANTITATIVE METRICS
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="p-4 rounded-xl bg-[#0A0E17] border border-blue-900/20">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">
              TOTAL XP EARNED
            </span>
            <div className="text-xl font-bold font-['Chakra_Petch'] text-blue-400 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>{profile.totalXP.toLocaleString()} XP</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0E17] border border-blue-900/20">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">
              LIFETIME SPIDEY COINS
            </span>
            <div className="text-xl font-bold font-['Chakra_Petch'] text-amber-300 flex items-center gap-1.5">
              <SpideyCoinIcon size={16} />
              <span>{profile.totalEssenceEarned.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0E17] border border-blue-900/20">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">
              LONGEST WEB STREAK
            </span>
            <div className="text-xl font-bold font-['Chakra_Petch'] text-red-500 flex items-center gap-2">
              <Flame className="w-4 h-4 fill-red-500/20" />
              <span>{profile.longestStreak} DAYS</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0E17] border border-blue-900/20">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">
              PERFECT DAYS
            </span>
            <div className="text-xl font-bold font-['Chakra_Petch'] text-emerald-400 flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>{totalPerfectDays} DAYS</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0E17] border border-blue-900/20">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">
              SUCCESSFUL DAYS
            </span>
            <div className="text-xl font-bold font-['Chakra_Petch'] text-white">
              {profile.totalSuccessfulDays ?? profile.consistencyDaysCompleted ?? 0} DAYS
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0E17] border border-blue-900/20">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">
              ACTIVE MISSIONS
            </span>
            <div className="text-xl font-bold font-['Chakra_Petch'] text-slate-200">
              {missions.length} DIRECTIVES
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0E17] border border-blue-900/20">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">
              PROTOCOLS MAINTAINED
            </span>
            <div className="text-xl font-bold font-['Chakra_Petch'] text-slate-200">
              {habits.length} ANCHORS
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0E17] border border-blue-900/20">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">
              UPGRADES CLAIMED
            </span>
            <div className="text-xl font-bold font-['Chakra_Petch'] text-slate-200">
              {purchases.length} REDEEMED
            </div>
          </div>
        </div>
      </div>

      {/* 4. Supabase Persistent Cloud Database (Source of Truth) */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#080d1a] to-[#0a0712] border border-blue-500/30 shadow-[0_0_25px_rgba(30,58,138,0.15)] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-blue-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.3)]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white uppercase font-['Chakra_Petch'] tracking-wide">
                  SUPABASE CLOUD DATABASE
                </h3>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                    syncStatus === 'SYNCED'
                      ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                      : syncStatus === 'SYNCING'
                      ? 'bg-amber-950/50 border-amber-500/50 text-amber-300 animate-pulse'
                      : 'bg-blue-950/50 border-blue-500/50 text-blue-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      syncStatus === 'SYNCED'
                        ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                        : syncStatus === 'SYNCING'
                        ? 'bg-amber-400'
                        : 'bg-blue-400'
                    }`}
                  />
                  {syncStatus === 'SYNCED'
                    ? 'SOURCE OF TRUTH ACTIVE'
                    : syncStatus === 'SYNCING'
                    ? 'SYNCING WITH POSTGRES'
                    : 'LOCAL SANDBOX MODE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                All directives, habits, XP ledger transactions, and rank progression are stored permanently in Supabase PostgreSQL.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <button
                onClick={() => setAccountModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-xs font-mono font-bold text-blue-300 flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(59,130,246,0.2)] cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>ACCOUNT SETTINGS</span>
              </button>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-bold text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_14px_rgba(230,43,58,0.3)] flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>SIGN IN / CONNECT CLOUD</span>
              </button>
            )}

            <button
              onClick={() => setSupabaseConfigModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-mono text-slate-300 transition-all cursor-pointer"
              title="View Supabase Keys & SQL Migration Script"
            >
              SQL & KEYS
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-[#05070A]/70 border border-blue-900/20">
            <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Authenticated User</span>
            <span className="text-slate-200 font-semibold truncate block">
              {user ? user.email || user.id : 'None (Operating in client sandbox)'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#05070A]/70 border border-blue-900/20">
            <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Database Engine</span>
            <span className="text-blue-400 font-semibold flex items-center gap-1">
              <span>Supabase PostgreSQL + RLS</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#05070A]/70 border border-blue-900/20">
            <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Device Resiliency</span>
            <span className="text-emerald-400 font-semibold">
              Persists across reboots & clears
            </span>
          </div>
        </div>
      </div>

      {/* 5. System Preferences & Local Backup Management */}
      <div>
        <h3 className="text-base font-bold text-white uppercase font-['Chakra_Petch'] tracking-wider mb-3">
          SYSTEM PREFERENCES & DATA BACKUPS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sound & Audio Toggle */}
          <div className="p-5 rounded-2xl bg-[#0A0E17] border border-blue-900/20 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white font-['Chakra_Petch'] uppercase">
                WEB AUDIO & HUD SOUND FX
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">
                Synthesized web-zip audio chimes and HUD feedback on completed directives and promotions.
              </p>
            </div>

            <button
              onClick={toggleSound}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                profile.soundEnabled
                  ? 'bg-red-950/50 border-red-500 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              {profile.soundEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Backup Data Export */}
          <div className="p-5 rounded-2xl bg-[#0A0E17] border border-blue-900/20 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white font-['Chakra_Petch'] uppercase">
                EXPORT ARCHIVE BACKUP
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">
                Copy your complete JSON ledger state to clipboard for safe offline preservation.
              </p>
            </div>

            <button
              onClick={handleExport}
              className="px-3.5 py-2 rounded-lg bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/30 text-xs font-mono font-bold text-blue-300 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>{copiedNotification ? 'COPIED!' : 'EXPORT JSON'}</span>
            </button>
          </div>

          {/* Backup Import */}
          <div className="p-5 rounded-2xl bg-[#0A0E17] border border-blue-900/20">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-sm font-bold text-white font-['Chakra_Petch'] uppercase">
                  RESTORE DATA
                </h4>
                <p className="text-xs text-slate-400 font-sans">
                  Import a previously exported JSON backup payload.
                </p>
              </div>

              <button
                onClick={() => setShowImportBox(!showImportBox)}
                className="px-3 py-1.5 rounded-lg bg-[#0F141F] border border-blue-900/30 text-xs font-mono font-bold text-slate-300 hover:text-white cursor-pointer"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>

            {showImportBox && (
              <div className="mt-3 space-y-2 font-mono">
                <textarea
                  rows={3}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste backup JSON string here..."
                  className="w-full p-2.5 rounded-xl bg-[#0F141F] border border-blue-900/30 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleImport}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono transition-colors cursor-pointer"
                >
                  RESTORE BACKUP NOW
                </button>
              </div>
            )}
          </div>

          {/* Reset System */}
          <div className="p-5 rounded-2xl bg-[#0A0E17] border border-red-900/30 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white font-['Chakra_Petch'] uppercase">
                RE-INITIALIZE OPERATIVE
              </h4>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">
                Clear active directives and habits, resetting ledger to initial factory state.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="px-3.5 py-2 rounded-lg bg-red-950/40 border border-red-800/50 hover:bg-red-900/40 text-xs font-mono font-bold text-red-400 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RESET</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Reset */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
        title="FACTORY SPEC RE-INITIALIZATION"
        subtitle="OPERATIVE DATA SYSTEM OVERRIDE"
        itemName="All Active Progress & Directives"
        message="This will reset your operative back to factory specs: Rank E (0/180 successful days), Level 1, 0 XP, 0 Spidey Coins, and 0 Streak. Are you certain you want to proceed?"
        confirmText="CONFIRM RESET"
        cancelText="ABORT"
        isDestructive={true}
        icon="alert"
      />
    </div>
  );
};
