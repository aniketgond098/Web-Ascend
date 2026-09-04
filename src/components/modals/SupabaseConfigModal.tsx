import React, { useState } from 'react';
import {
  Database,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Key,
  RefreshCw,
  X,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  Terminal,
} from 'lucide-react';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  isSupabaseConfigured,
  setManualSupabaseConfig,
  clearManualSupabaseConfig,
  isSecretApiKey,
  hasSecretKeyConfigured,
  getApiKeyRole,
} from '../../lib/supabase';
import { supabaseService } from '../../services/supabaseService';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged?: () => void;
  initialTab?: 'CONFIG' | 'SQL';
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigChanged,
  initialTab = 'CONFIG',
}) => {
  const [url, setUrl] = useState(SUPABASE_URL || '');
  const [anonKey, setAnonKey] = useState(SUPABASE_ANON_KEY || '');
  const [copied, setCopied] = useState(false);
  const [copiedQuickFix, setCopiedQuickFix] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'testing' | 'success' | 'failed';
    isMissingTables?: boolean;
    error?: string;
  }>({ status: 'idle' });
  const [activeTab, setActiveTab] = useState<'CONFIG' | 'SQL'>(initialTab);

  if (!isOpen) return null;

  const isSecretKeyPresent = isSecretApiKey(anonKey);
  const detectedKeyRole = getApiKeyRole(anonKey);

  // Derive direct Supabase SQL editor & API keys URL
  const projectRefMatch = url.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co/i);
  const projectRef = projectRefMatch ? projectRefMatch[1] : null;
  const supabaseSqlEditorUrl = projectRef
    ? `https://supabase.com/dashboard/project/${projectRef}/sql/new`
    : 'https://supabase.com/dashboard/project/_/sql/new';
  const supabaseApiKeysUrl = projectRef
    ? `https://supabase.com/dashboard/project/${projectRef}/settings/api`
    : 'https://supabase.com/dashboard/project/_/settings/api';

  const handleSave = () => {
    if (isSecretKeyPresent) {
      setTestResult({
        status: 'failed',
        error: 'Forbidden: You entered a secret "service_role" key. Supabase blocks secret keys in browsers. Please use the public "anon" key.',
      });
      return;
    }

    if (url.trim() && anonKey.trim()) {
      const res = setManualSupabaseConfig(url, anonKey);
      if (!res.success) {
        setTestResult({ status: 'failed', error: res.error });
        return;
      }
      if (onConfigChanged) onConfigChanged();
      handleTestConnection();
    }
  };

  const handleClear = () => {
    clearManualSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setTestResult({ status: 'idle' });
    if (onConfigChanged) onConfigChanged();
  };

  const handleTestConnection = async () => {
    setTestResult({ status: 'testing' });
    const res = await supabaseService.testConnection(url, anonKey);
    if (res.ok) {
      setTestResult({ status: 'success' });
      if (onConfigChanged) onConfigChanged();
    } else if (res.isMissingTables) {
      setTestResult({
        status: 'failed',
        isMissingTables: true,
        error: res.error,
      });
    } else {
      setTestResult({
        status: 'failed',
        isMissingTables: false,
        error: res.error,
      });
    }
  };

  const sqlSchemaText = `-- ============================================================================
-- WEB ASCEND // SUPABASE POSTGRESQL SCHEMA & AUTOMATION TRIGGER
-- Paste this script into Supabase SQL Editor and click RUN
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    username TEXT NOT NULL DEFAULT 'OPERATIVE',
    sound_enabled BOOLEAN NOT NULL DEFAULT true,
    avatar_icon TEXT DEFAULT 'SpiderIcon',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. MISSIONS (Directives & Quests)
CREATE TABLE IF NOT EXISTS public.missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    xp_reward INTEGER NOT NULL DEFAULT 50 CHECK (xp_reward >= 0),
    spidey_coin_reward INTEGER NOT NULL DEFAULT 20 CHECK (spidey_coin_reward >= 0),
    required BOOLEAN NOT NULL DEFAULT true,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. MISSION COMPLETIONS
CREATE TABLE IF NOT EXISTS public.mission_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE NOT NULL,
    completion_date TEXT NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reward_granted BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_mission_completion UNIQUE(user_id, mission_id, completion_date)
);

-- 4. HABITS (Daily Protocols)
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    frequency TEXT NOT NULL DEFAULT 'DAILY',
    xp_reward INTEGER NOT NULL DEFAULT 35 CHECK (xp_reward >= 0),
    spidey_coin_reward INTEGER NOT NULL DEFAULT 15 CHECK (spidey_coin_reward >= 0),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. HABIT COMPLETIONS
CREATE TABLE IF NOT EXISTS public.habit_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
    completion_date TEXT NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reward_granted BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_habit_completion UNIQUE(user_id, habit_id, completion_date)
);

-- 6. DAILY PROGRESS
CREATE TABLE IF NOT EXISTS public.daily_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date TEXT NOT NULL,
    required_missions_completed INTEGER NOT NULL DEFAULT 0,
    required_missions_total INTEGER NOT NULL DEFAULT 0,
    habits_completed INTEGER NOT NULL DEFAULT 0,
    habits_total INTEGER NOT NULL DEFAULT 0,
    completion_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    is_successful_day BOOLEAN NOT NULL DEFAULT false,
    is_perfect_day BOOLEAN NOT NULL DEFAULT false,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    spidey_coins_earned INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_daily_progress UNIQUE(user_id, date)
);

-- 7. XP TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.xp_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    source_type TEXT NOT NULL,
    source_id TEXT DEFAULT NULL,
    transaction_date TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. SPIDEY COIN TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.spidey_coin_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_id TEXT DEFAULT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. LEVEL PROGRESSION
CREATE TABLE IF NOT EXISTS public.level_progression (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    current_level INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. RANK PROGRESSION
CREATE TABLE IF NOT EXISTS public.rank_progression (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    current_rank TEXT NOT NULL DEFAULT 'E',
    successful_days_for_current_rank INTEGER NOT NULL DEFAULT 0,
    required_successful_days INTEGER NOT NULL DEFAULT 180,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. REWARDS
CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    cost INTEGER NOT NULL CHECK (cost >= 0),
    icon TEXT NOT NULL DEFAULT 'Sparkles',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. REWARD PURCHASES
CREATE TABLE IF NOT EXISTS public.reward_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reward_id UUID REFERENCES public.rewards(id) ON DELETE CASCADE NOT NULL,
    cost INTEGER NOT NULL,
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'SYSTEM',
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spidey_coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- IDEMPOTENT RLS POLICIES (Safe to re-run anytime)
DROP POLICY IF EXISTS "user_profiles" ON public.profiles;
CREATE POLICY "user_profiles" ON public.profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_missions" ON public.missions;
CREATE POLICY "user_missions" ON public.missions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_mission_comps" ON public.mission_completions;
CREATE POLICY "user_mission_comps" ON public.mission_completions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_habits" ON public.habits;
CREATE POLICY "user_habits" ON public.habits FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_habit_comps" ON public.habit_completions;
CREATE POLICY "user_habit_comps" ON public.habit_completions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_daily_prog" ON public.daily_progress;
CREATE POLICY "user_daily_prog" ON public.daily_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_xp_tx" ON public.xp_transactions;
CREATE POLICY "user_xp_tx" ON public.xp_transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_coin_tx" ON public.spidey_coin_transactions;
CREATE POLICY "user_coin_tx" ON public.spidey_coin_transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_level_prog" ON public.level_progression;
CREATE POLICY "user_level_prog" ON public.level_progression FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_rank_prog" ON public.rank_progression;
CREATE POLICY "user_rank_prog" ON public.rank_progression FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_rewards" ON public.rewards;
CREATE POLICY "user_rewards" ON public.rewards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_purchases" ON public.reward_purchases;
CREATE POLICY "user_purchases" ON public.reward_purchases FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_notifs" ON public.notifications;
CREATE POLICY "user_notifs" ON public.notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- USER SETUP TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user_setup()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID := NEW.id;
    v_username TEXT;
BEGIN
    v_username := COALESCE(NEW.raw_user_meta_data->>'username', 'OPERATIVE');

    INSERT INTO public.profiles (user_id, username)
    VALUES (v_user_id, v_username)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.level_progression (user_id, current_level)
    VALUES (v_user_id, 1)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.rank_progression (user_id, current_rank, successful_days_for_current_rank, required_successful_days)
    VALUES (v_user_id, 'E', 0, 180)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.missions (user_id, title, description, priority, xp_reward, spidey_coin_reward, required, active)
    VALUES 
        (v_user_id, 'Hydration Protocol', 'Drink 3L of water throughout the day for cellular vitality.', 'HIGH', 40, 20, true, true),
        (v_user_id, 'Acrobatic / Strength Conditioning', 'Execute 45 min workout or functional kinetic movement.', 'HIGH', 80, 35, true, true),
        (v_user_id, 'Cognitive Focus Deep Work', 'Complete 90 uninterrupted minutes on paramount career objective.', 'HIGH', 100, 40, true, true),
        (v_user_id, 'Sector Patrol Recon', '30-minute evening walk or mobility session to decompress neural load.', 'MEDIUM', 30, 15, false, true)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.habits (user_id, name, description, frequency, xp_reward, spidey_coin_reward, active)
    VALUES
        (v_user_id, 'Zero Refined Sugar Intake', 'Clean fuel only. Eliminate sodas, sweets, and ultra-processed junk.', 'DAILY', 35, 15, true),
        (v_user_id, '10-Minute Evening Gear Reset', 'Clear workspace desk, review tomorrow directives, prep equipment.', 'DAILY', 25, 10, true),
        (v_user_id, 'Sleep Protocol (7.5+ Hours)', 'Target 8 hours deep sleep for cellular and kinetic regeneration.', 'DAILY', 40, 20, true)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.rewards (user_id, name, description, cost, icon, active)
    VALUES
        (v_user_id, 'Cheat Meal Pass', 'High-calorie sensory recharge of choice.', 250, 'Utensils', true),
        (v_user_id, 'Gaming / Sci-Fi Marathon', '2 hours uninterrupted leisure immersion without guilt.', 200, 'Gamepad', true),
        (v_user_id, 'Tactical Gear Upgrade', 'Purchase desired tech/physical accessory for HQ.', 600, 'Shield', true),
        (v_user_id, 'Full Rest Day Protocol', 'Guilt-free complete downtime weekend afternoon.', 400, 'Coffee', true)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
        v_user_id, 
        'SYSTEM ONLINE', 
        'Neural link synchronized. Welcome, ' || v_username || '. Initialized at Rank E. Complete all required missions and daily habits to ascend.', 
        'SYSTEM'
    )
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: automatically fires on auth.users sign-up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_setup();

-- ============================================================================
-- 14. API PERMISSIONS & POSTGREST SCHEMA CACHE RELOAD
-- ============================================================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

-- Force PostgREST to immediately refresh its in-memory schema cache
NOTIFY pgrst, 'reload schema';
`;

  const quickFixSql = `-- ============================================================================
-- QUICK FIX: GRANT PERMISSIONS & RELOAD SCHEMA CACHE (Run in SQL Editor)
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- Instantly refresh Supabase PostgREST schema cache
NOTIFY pgrst, 'reload schema';`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchemaText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyQuickFix = () => {
    navigator.clipboard.writeText(quickFixSql);
    setCopiedQuickFix(true);
    setTimeout(() => setCopiedQuickFix(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#090D16] border border-blue-500/40 shadow-[0_0_50px_rgba(2,132,199,0.15)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-900/30 bg-[#060A12]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-950/60 border border-blue-500/30 text-blue-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider font-['Chakra_Petch']">
                SUPABASE DATABASE INTEGRATION
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Persistent PostgreSQL Source of Truth & Authentication
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

        {/* Tab Controls */}
        <div className="flex border-b border-blue-900/20 px-6 bg-[#070B14]">
          <button
            onClick={() => setActiveTab('CONFIG')}
            className={`py-3 px-4 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'CONFIG'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            CONNECTION CONFIG
          </button>
          <button
            onClick={() => setActiveTab('SQL')}
            className={`py-3 px-4 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'SQL'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            SQL SCHEMA SCRIPT
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs font-mono">
          {activeTab === 'CONFIG' ? (
            <>
              {/* Secret Key Alert Banner if detected */}
              {isSecretKeyPresent && (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/60 text-red-200 space-y-2.5">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                    <ShieldAlert className="w-5 h-5 shrink-0 animate-pulse" />
                    <span>FORBIDDEN: SECRET API KEY DETECTED</span>
                  </div>
                  <p className="text-xs text-red-300 leading-relaxed">
                    You have pasted Supabase's <code className="bg-black/60 px-1.5 py-0.5 rounded text-red-400 font-bold">service_role</code> secret key.
                    Supabase actively blocks secret keys from being used in browser client applications (<code className="text-red-300">Auth error: Forbidden use of secret API key in browser</code>).
                  </p>
                  <div className="p-3 rounded-lg bg-black/50 border border-red-900/40 space-y-1.5 text-[11px]">
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>HOW TO RECTIFY:</span>
                    </div>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                      <li>Open your <strong>Supabase Project Dashboard</strong></li>
                      <li>Navigate to <strong>Project Settings &rarr; API</strong></li>
                      <li>Locate <strong>Project API keys</strong></li>
                      <li>Copy the key labeled <strong className="text-emerald-400">anon public</strong> (NOT service_role)</li>
                      <li>Paste the anon key below</li>
                    </ol>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-2">
                <div className="flex items-center gap-2 text-blue-300 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>CLOUD DATABASE STATUS</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {isSupabaseConfigured() ? (
                    <span className="text-emerald-400 font-bold">
                      CONNECTED // Supabase environment variables detected. Cloud PostgreSQL database is active as the source of truth.
                    </span>
                  ) : hasSecretKeyConfigured() ? (
                    <span className="text-red-400 font-bold">
                      SECRET KEY CONFLICT // A service_role secret key was provided. Replace it with your public anon key below.
                    </span>
                  ) : (
                    <span className="text-amber-400">
                      CREDENTIALS PENDING // Enter your Supabase Project URL and Anon API Key below or configure VITE_SUPABASE_URL in your environment.
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1.5 uppercase font-bold tracking-wider">
                    SUPABASE PROJECT URL
                  </label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-slate-400 text-[11px] uppercase font-bold tracking-wider">
                      SUPABASE ANON (PUBLIC) KEY
                    </label>
                    <div className="flex items-center gap-2">
                      <a
                        href={supabaseApiKeysUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-400 hover:text-blue-300 underline font-mono flex items-center gap-1"
                      >
                        <span>Find in Supabase Dashboard</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      value={anonKey}
                      onChange={(e) => setAnonKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className={`w-full px-3.5 py-2.5 pr-20 rounded-xl bg-slate-900/90 border font-mono text-xs focus:outline-none transition-colors ${
                        isSecretKeyPresent
                          ? 'border-red-500 text-red-300 focus:border-red-400 bg-red-950/20'
                          : detectedKeyRole === 'anon'
                          ? 'border-emerald-500/80 text-emerald-200 focus:border-emerald-400'
                          : 'border-slate-700 text-white focus:border-blue-500'
                      }`}
                    />
                    {anonKey && (
                      <button
                        type="button"
                        onClick={() => setAnonKey('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Real-time key role indicator */}
                  <div className="mt-1.5 flex items-center justify-between text-[11px]">
                    {detectedKeyRole === 'service_role' && (
                      <span className="text-red-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span>Forbidden: This is the "service_role" secret key. Please replace with the "anon" public key.</span>
                      </span>
                    )}
                    {detectedKeyRole === 'anon' && (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Valid format: "anon" (public client) key ready.</span>
                      </span>
                    )}
                    {(detectedKeyRole === 'unknown' || detectedKeyRole === 'empty') && (
                      <span className="text-slate-500 text-[10px]">
                        Copy the <strong className="text-slate-400">anon</strong> (public) key from Supabase &rarr; Project Settings &rarr; API.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {testResult.status === 'success' && (
                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-xl">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Connection Verified! Supabase PostgreSQL database is reachable.</span>
                </div>
              )}

              {testResult.status === 'failed' && (
                testResult.isMissingTables ||
                testResult.error?.includes('profiles') ||
                testResult.error?.includes('schema cache') ||
                testResult.error?.includes('relation') ? (
                  <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/60 text-amber-200 space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs sm:text-sm">
                      <Sparkles className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
                      <span>API CREDENTIALS CONNECTED! POSTGREST SCHEMA CACHE REFRESH NEEDED</span>
                    </div>

                    <p className="text-[11px] text-amber-300/90 leading-relaxed">
                      Your Supabase credentials are valid and reachable! If you already executed the script and saw <code className="bg-black/60 px-1 py-0.5 rounded text-emerald-300 font-bold">Success. No rows returned</code>, PostgreSQL created the tables, but Supabase&apos;s REST API (PostgREST) needs to reload its schema cache to register them.
                    </p>

                    {/* Quick Fix Box */}
                    <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-500/40 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Quick Fix: Reload Cache & Grants (2 Seconds)</span>
                        </span>
                        <button
                          onClick={copyQuickFix}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)] cursor-pointer shrink-0"
                        >
                          {copiedQuickFix ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedQuickFix ? 'QUICK FIX COPIED!' : 'COPY 3-LINE QUICK FIX'}</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-emerald-200/80">
                        Paste this into your Supabase SQL Editor and click <strong className="text-white">Run</strong>, then click <strong className="text-white">RE-TEST TABLES NOW</strong> below:
                      </p>
                      <pre className="p-2 bg-black/60 rounded-lg text-[10px] text-emerald-300 font-mono overflow-x-auto border border-emerald-500/20">
{`GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';`}
                      </pre>
                    </div>

                    <div className="p-3 bg-black/60 rounded-xl border border-amber-500/30 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                          Need Full Schema Script Instead?
                        </span>
                        <button
                          onClick={copySql}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                          <span>{copied ? 'Copied' : 'Copy Full SQL (400 lines)'}</span>
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <a
                          href={supabaseSqlEditorUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline font-bold"
                        >
                          <span>Open Supabase SQL Editor</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        {projectRef && <span className="text-slate-500 font-mono">({projectRef})</span>}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setActiveTab('SQL')}
                        className="text-[11px] text-slate-400 hover:text-blue-400 underline transition-colors cursor-pointer"
                      >
                        Inspect raw SQL code &rarr;
                      </button>
                      <button
                        onClick={handleTestConnection}
                        disabled={testResult.status === 'testing'}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${testResult.status === 'testing' ? 'animate-spin' : ''}`} />
                        <span>RE-TEST TABLES NOW</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 text-red-400 bg-red-950/20 border border-red-500/30 p-3 rounded-xl">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold">Connection Check Failed</div>
                      <div className="text-[11px] text-red-300 leading-relaxed">
                        {testResult.error || 'Verify URL and Anon Key.'}
                      </div>
                    </div>
                  </div>
                )
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={testResult.status === 'testing' || !url}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testResult.status === 'testing' ? 'animate-spin' : ''}`} />
                    <span>TEST LINK</span>
                  </button>
                  {(url || anonKey) && (
                    <button
                      onClick={handleClear}
                      className="px-3 py-2 rounded-xl text-slate-500 hover:text-red-400 transition-colors"
                    >
                      RESET
                    </button>
                  )}
                </div>

                <button
                  onClick={handleSave}
                  disabled={!url || !anonKey || isSecretKeyPresent}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(2,132,199,0.3)] disabled:opacity-50"
                >
                  SAVE & SYNC
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="text-slate-300 text-xs font-bold">
                    Database Schema & Automation Script
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Provisions all 13 tables, indexes, RLS policies, and operative initialization triggers.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={supabaseSqlEditorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/30 flex items-center gap-1.5 text-xs transition-colors"
                  >
                    <span>Open SQL Editor</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={copySql}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-colors shrink-0 font-bold text-xs cursor-pointer shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'COPIED' : 'COPY SQL SCRIPT'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-black/60 rounded-xl border border-slate-800 max-h-72 overflow-y-auto">
                <pre className="text-[10px] leading-relaxed text-slate-300 font-mono">
                  {sqlSchemaText}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
