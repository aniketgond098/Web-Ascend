import React, { useState } from 'react';
import { User, Mail, Shield, Key, LogOut, Database, Check, X, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { UserProfile } from '../../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  profile: UserProfile;
  syncStatus: 'SYNCED' | 'SYNCING' | 'OFFLINE' | 'LOCAL';
  onSignOut: () => void;
  onOpenConfig: () => void;
  onUpdateUsername: (newName: string) => Promise<void>;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  user,
  profile,
  syncStatus,
  onSignOut,
  onOpenConfig,
  onUpdateUsername,
}) => {
  const [username, setUsername] = useState(profile.username);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (!isOpen) return null;

  const handleSaveUsername = async () => {
    if (!username.trim() || username.trim() === profile.username) return;
    setIsSaving(true);
    try {
      await onUpdateUsername(username.trim());
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendReset = async () => {
    if (!user?.email) return;
    try {
      await supabase.auth.resetPasswordForEmail(user.email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#090D17] border border-blue-500/40 shadow-[0_0_50px_rgba(2,132,199,0.2)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-blue-900/30 bg-[#060A12] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-950/60 border border-blue-500/30 text-blue-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-['Chakra_Petch']">
                OPERATIVE ACCOUNT & SECURITY
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Supabase Identity & Database Sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 font-mono text-xs">
          {/* Cloud Sync Badge */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${
                syncStatus === 'SYNCED' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' :
                syncStatus === 'SYNCING' ? 'bg-amber-400 animate-ping' :
                syncStatus === 'OFFLINE' ? 'bg-red-500' : 'bg-blue-400'
              }`} />
              <div>
                <span className="font-bold text-white uppercase">
                  DATABASE SOURCE OF TRUTH: {syncStatus}
                </span>
                <p className="text-[10px] text-slate-400">
                  {user ? 'Supabase PostgreSQL Cloud' : 'Local Sandbox Mode'}
                </p>
              </div>
            </div>
            <button
              onClick={onOpenConfig}
              className="px-2.5 py-1.5 rounded-lg bg-blue-950/60 border border-blue-500/30 text-blue-300 hover:text-white hover:bg-blue-900/60 transition-colors text-[11px] flex items-center gap-1"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Config / SQL</span>
            </button>
          </div>

          {/* User Details */}
          {user ? (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                  AUTHENTICATED EMAIL
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span>{user.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                  SECURITY USER ID (UUID)
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-[11px] truncate">
                  <Shield className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="truncate">{user.id}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                  OPERATIVE CODENAME
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-blue-500 focus:outline-none text-xs"
                  />
                  <button
                    onClick={handleSaveUsername}
                    disabled={isSaving || username === profile.username}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-wider uppercase transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'SAVING...' : savedSuccess ? 'SAVED!' : 'UPDATE'}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={handleSendReset}
                  disabled={resetSent}
                  className="text-blue-400 hover:text-blue-300 underline text-[11px] flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{resetSent ? 'Password reset link sent!' : 'Send password reset email'}</span>
                </button>

                <button
                  onClick={onSignOut}
                  className="px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 hover:text-white transition-colors flex items-center gap-1.5 font-bold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>SIGN OUT</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <p className="text-slate-300">
                You are currently previewing in offline/demo mode without an authenticated cloud account.
              </p>
              <button
                onClick={onSignOut} // this re-opens auth
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider"
              >
                SIGN IN / CREATE SUPABASE ACCOUNT
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
