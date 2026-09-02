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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HudCard } from '../ui/HudCard';
import { RankBadge } from '../ui/RankBadge';
import { RANK_CONFIG } from '../../config/progression';
import { formatReadableDate } from '../../utils/date';
import { DailyRecord } from '../../types';

export const ProfileView: React.FC = () => {
  const {
    profile,
    updateProfile,
    missions,
    habits,
    dailyRecords,
    purchases,
    toggleSound,
    resetAllData,
    exportData,
    importData,
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(profile.username);
  const [importText, setImportText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

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
      alert('System data successfully loaded and restored.');
      setShowImportBox(false);
      setImportText('');
    } else {
      alert('Invalid backup schema. Import aborted.');
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        'WARNING: This will reset all your progress, ledger transactions, and rank history back to Level 1 Rank E. Proceed?'
      )
    ) {
      resetAllData();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 lg:pb-8 font-mono">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs text-[#38bdf8] font-bold tracking-widest uppercase">
        <Terminal className="w-4 h-4" />
        <span>OPERATIVE ARCHIVES // DOSSIER OVERVIEW</span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-white uppercase font-['Chakra_Petch'] tracking-wide">
        OPERATIVE PROFILE & METRICS
      </h1>

      {/* Main Dossier Card */}
      <HudCard className="p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
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
                    className="px-3 py-1.5 rounded-lg bg-[#080d1a] border border-[#38bdf8] text-white text-base font-bold font-['Chakra_Petch'] uppercase"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-[#38bdf8] text-slate-950 text-xs font-bold"
                  >
                    SAVE
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs"
                  >
                    CANCEL
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-white uppercase font-['Chakra_Petch'] tracking-wider">
                    {profile.username}
                  </h2>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                    title="Edit Codename"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <p className="text-xs text-[#38bdf8] font-bold tracking-widest uppercase">
                {rankInfo.name} // {rankInfo.codename}
              </p>

              <p className="text-xs text-slate-400 max-w-md">
                System Operative since {formatReadableDate(profile.createdAt.split('T')[0])}. Neural connection calibrated and operational.
              </p>
            </div>
          </div>

          {/* Quick Level & Currency Badge */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="p-3.5 rounded-xl bg-[#080d1a] border border-slate-800 text-center sm:text-left">
              <span className="text-[10px] text-slate-500 block uppercase">CURRENT TIER</span>
              <span className="text-lg font-bold text-[#ff334b] font-['Chakra_Petch']">
                RANK {profile.rank}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#080d1a] border border-slate-800 text-center sm:text-left">
              <span className="text-[10px] text-slate-500 block uppercase">CURRENT LEVEL</span>
              <span className="text-lg font-bold text-[#38bdf8] font-['Chakra_Petch']">
                LEVEL {profile.level}
              </span>
            </div>
          </div>
        </div>
      </HudCard>

      {/* Lifetime Quantitative Metrics Grid */}
      <div>
        <h3 className="text-base font-bold text-white uppercase font-['Chakra_Petch'] tracking-wider mb-3">
          LIFETIME QUANTITATIVE METRICS
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <HudCard className="p-4">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">
              TOTAL XP EARNED
            </span>
            <div className="text-xl font-bold font-['Chakra_Petch'] text-[#38bdf8] flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>{profile.totalXP.toLocaleString()} XP</span>
            </div>
          </HudCard>

          <HudCard className="p-4">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">
              LIFETIME ESSENCE
            </span>
            <div className="text-xl font-bold font-['Chakra_Petch'] text-[#ff334b] flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>◈ {profile.totalEssenceEarned.toLocaleString()}</span>
            </div>
          </HudCard>

          <HudCard className="p-4">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">
              LONGEST STREAK
            </span>
            <div className="text-xl font-bold font-['Chakra_Petch'] text-amber-400 flex items-center gap-2">
              <Flame className="w-4 h-4" />
              <span>{profile.longestStreak} DAYS</span>
            </div>
          </HudCard>

          <HudCard className="p-4">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">
              PERFECT DAYS
            </span>
            <div className="text-xl font-bold font-['Chakra_Petch'] text-[#22c55e] flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>{totalPerfectDays} DAYS</span>
            </div>
          </HudCard>

          <HudCard className="p-4">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">
              CONSISTENCY DAYS
            </span>
            <div className="text-xl font-bold font-['Chakra_Petch'] text-white">
              {profile.consistencyDaysCompleted} DAYS
            </div>
          </HudCard>

          <HudCard className="p-4">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">
              REGISTERED MISSIONS
            </span>
            <div className="text-xl font-bold font-['Chakra_Petch'] text-slate-200">
              {missions.length} DIRECTIVES
            </div>
          </HudCard>

          <HudCard className="p-4">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">
              REGISTERED HABITS
            </span>
            <div className="text-xl font-bold font-['Chakra_Petch'] text-slate-200">
              {habits.length} ANCHORS
            </div>
          </HudCard>

          <HudCard className="p-4">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">
              MARKET REWARDS CLAIMED
            </span>
            <div className="text-xl font-bold font-['Chakra_Petch'] text-slate-200">
              {purchases.length} CLAIMED
            </div>
          </HudCard>
        </div>
      </div>

      {/* System Settings & Local Backup Management */}
      <div>
        <h3 className="text-base font-bold text-white uppercase font-['Chakra_Petch'] tracking-wider mb-3">
          SYSTEM PREFERENCES & DATA BACKUPS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sound & Audio Toggle */}
          <HudCard className="p-5 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white font-['Chakra_Petch'] uppercase">
                SYNTHESIZED AUDIO HUD
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Play futuristic Web Audio chime effects upon mission completions and level-ups.
              </p>
            </div>

            <button
              onClick={toggleSound}
              className={`p-3 rounded-xl border transition-all ${
                profile.soundEnabled
                  ? 'bg-[#0369a1]/30 border-[#38bdf8] text-[#38bdf8]'
                  : 'bg-slate-800/40 border-slate-700 text-slate-500'
              }`}
            >
              {profile.soundEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>
          </HudCard>

          {/* Backup Data Export */}
          <HudCard className="p-5 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white font-['Chakra_Petch'] uppercase">
                EXPORT ARCHIVE BACKUP
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Copy your complete JSON ledger state to clipboard for offline backup.
              </p>
            </div>

            <button
              onClick={handleExport}
              className="px-3.5 py-2 rounded-xl bg-[#0e1628] border border-slate-700 hover:border-[#38bdf8] text-xs font-bold text-white transition-all flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-4 h-4 text-[#38bdf8]" />
              <span>{copiedNotification ? 'COPIED!' : 'EXPORT JSON'}</span>
            </button>
          </HudCard>

          {/* Backup Import */}
          <HudCard className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-sm font-bold text-white font-['Chakra_Petch'] uppercase">
                  RESTORE DATA
                </h4>
                <p className="text-xs text-slate-400">
                  Import a previously exported JSON backup payload.
                </p>
              </div>

              <button
                onClick={() => setShowImportBox(!showImportBox)}
                className="px-3 py-1.5 rounded-lg bg-[#0e1628] border border-slate-700 text-xs font-bold text-slate-300 hover:text-white"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>

            {showImportBox && (
              <div className="mt-3 space-y-2">
                <textarea
                  rows={3}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste backup JSON string here..."
                  className="w-full p-2.5 rounded-xl bg-[#080d1a] border border-slate-700 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#38bdf8]"
                />
                <button
                  onClick={handleImport}
                  className="px-4 py-2 rounded-lg bg-[#0284c7] text-white text-xs font-bold hover:brightness-110"
                >
                  RESTORE BACKUP NOW
                </button>
              </div>
            )}
          </HudCard>

          {/* Reset System */}
          <HudCard variant="crimson" className="p-5 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white font-['Chakra_Petch'] uppercase">
                RE-INITIALIZE OPERATIVE
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Clear all active missions, habits, and reset back to factory state.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl bg-[#7f1d1d]/30 border border-[#ff334b]/50 hover:border-[#ff334b] text-xs font-bold text-[#ff334b] transition-all flex items-center gap-1.5 shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RESET</span>
            </button>
          </HudCard>
        </div>
      </div>
    </div>
  );
};
